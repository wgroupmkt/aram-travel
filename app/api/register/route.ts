import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { Resend } from "resend";
import { agregarFila } from "@/lib/googleSheets";
import crypto from "crypto";

// 🔐 API KEY
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;


export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      numeroPasajero,
      name,
      dniParticipante,
      fechaNacimiento,
      email,
      phone,
      captchaToken,
    } = body;

    // 🔐 CAPTCHA obligatorio
    if (!captchaToken) {
      return NextResponse.json({
        success: false,
        error: "Captcha requerido",
      });
    }

    // 🌐 Obtener IP real
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";

    // 🧼 Limpiar datos
    const numeroLimpio = String(numeroPasajero || "").replace(/\D/g, "");
    const dniLimpio = String(dniParticipante || "").replace(/\D/g, "");

    // 🔐 Turnstile secret
    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
    if (!turnstileSecret) throw new Error("TURNSTILE_SECRET_MISSING");

    // 🤖 Validar CAPTCHA
    const verifyCaptcha = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          secret: turnstileSecret,
          response: captchaToken,
          remoteip: ip,
        }),
      }
    );

    const captchaResult = await verifyCaptcha.json();

    // 🔐 Validación fuerte
    if (
      !captchaResult.success ||
      captchaResult.action !== "submit" ||
      captchaResult.hostname !== "bono.aramendiviajes.com"
    ) {
      return NextResponse.json({
        success: false,
        error: "Captcha inválido o sospechoso",
      });
    }

    // ⏱ Validar expiración (2 min)
    const challengeTime = new Date(captchaResult.challenge_ts).getTime();
    if (Date.now() - challengeTime > 2 * 60 * 1000) {
      return NextResponse.json({
        success: false,
        error: "Captcha expirado",
      });
    }

    // ✅ Validaciones básicas
    if (!numeroLimpio || !name || !dniLimpio || !fechaNacimiento) {
      return NextResponse.json({
        success: false,
        error: "Faltan datos obligatorios",
      });
    }

    if (!/^\d{4,10}$/.test(numeroLimpio)) {
      throw new Error("NUMERO_INVALIDO");
    }

    if (!/^\d{7,8}$/.test(dniLimpio)) {
      throw new Error("DNI_INVALIDO");
    }

    // 🎂 Calcular edad
    function calcularEdad(fecha: string) {
      const hoy = new Date();
      const nacimiento = new Date(fecha);

      let edad = hoy.getFullYear() - nacimiento.getFullYear();
      const mes = hoy.getMonth() - nacimiento.getMonth();

      if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
      }

      return edad;
    }

    const edadCalculada = calcularEdad(fechaNacimiento);

    // 📌 Referencias Firestore
    const passengerRef = db.collection("pasajeros").doc(numeroLimpio);
    const dniRef = db.collection("dniCounts").doc(dniLimpio);

    let raffleNumber = "";

    await db.runTransaction(async (transaction) => {
      const passengerDoc = await transaction.get(passengerRef);
      const dniDoc = await transaction.get(dniRef);

      if (!passengerDoc.exists) {
        throw new Error("PASAJERO_NO_VALIDO");
      }

      const participantsSnapshot = await transaction.get(
        passengerRef.collection("participants")
      );

      if (participantsSnapshot.size >= 15) {
        throw new Error("LIMITE_PASAJERO");
      }

      const currentCount = dniDoc.exists
        ? dniDoc.data()?.count || 0
        : 0;

      if (currentCount >= 3) {
        throw new Error("LIMITE_DNI");
      }

      // 🎟 Generar número único (optimizado)
      let numeroValido = false;

      while (!numeroValido) {
        raffleNumber = crypto.randomInt(10000, 100000).toString();

        const raffleRef = db.collection("raffleNumbers").doc(raffleNumber);
        const raffleDoc = await transaction.get(raffleRef);

        if (!raffleDoc.exists) {
          numeroValido = true;

          // reservar número
          transaction.set(raffleRef, {
            createdAt: new Date(),
          });
        }
      }

      const participantRef = passengerRef
        .collection("participants")
        .doc(raffleNumber);

      // 💾 Guardar participante
      transaction.set(participantRef, {
        name: name.trim(),
        fechaNacimiento,
        edad: edadCalculada,
        dni: dniLimpio,
        email: email || "",
        phone: phone || "",
        numeroSorteo: raffleNumber,
        ip,
        createdAt: new Date(),
      });

      // 🔢 actualizar contador DNI
      transaction.set(
        dniRef,
        { count: currentCount + 1 },
        { merge: true }
      );
    });

    // 📄 Google Sheets
    await agregarFila({
      numeroPasajero: numeroLimpio,
      name: name.trim(),
      dni: dniLimpio,
      edad: edadCalculada,
      email: email || "",
      phone: phone || "",
      numeroSorteo: raffleNumber,
    });

    // 📩 Email
    if (email && resend && /\S+@\S+\.\S+/.test(email)) {
      try {
        await resend.emails.send({
          from: "Registro <info@bono.aramendiviajes.com>",
          to: email,
          subject: "Tu número de sorteo 🎟",
          html: `
            <div style="font-family: Arial; padding:20px;">
              <h2>¡Registro exitoso!</h2>
              <p>Hola ${name}, gracias por participar 🎉</p>
              <p>Tu número de sorteo es:</p>
              <h1 style="color:#2563eb;">${raffleNumber}</h1>
            </div>
          `,
        });
      } catch (error) {
        console.error("❌ Error enviando email:", error);
      }
    }

    return NextResponse.json({
      success: true,
      numeroSorteo: raffleNumber,
    });
  } catch (error: any) {
    console.error("❌ ERROR REGISTER:", error);

    const mapErrors: Record<string, string> = {
      TURNSTILE_SECRET_MISSING: "Falta configurar Turnstile",
      PASAJERO_NO_VALIDO: "Número de pasajero inválido 🚫",
      LIMITE_DNI: "Este DNI ya tiene 3 números 🚫",
      LIMITE_PASAJERO: "Este pasajero alcanzó el máximo 🚫",
      NUMERO_INVALIDO: "Número de pasajero inválido",
      DNI_INVALIDO: "DNI inválido",
    };

    return NextResponse.json({
      success: false,
      error: mapErrors[error.message] || "Error en el servidor",
    });
  }
}