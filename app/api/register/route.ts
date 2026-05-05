import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { Resend } from "resend";
import { generarImagen } from "@/lib/generarImagen";
import { agregarFila } from "@/lib/googleSheets";
import crypto from "crypto";

// 🔐 API KEY
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    let {
      numeroPasajero,
      name,
      dniParticipante,
      fechaNacimiento,
      email,
      phone,
    } = body;

    // 🔐 IP (para futuro rate limit)
    const ip = req.headers.get("x-forwarded-for") || "unknown";

    // 🧼 LIMPIAR DATOS
    const numeroLimpio = String(numeroPasajero).replace(/\D/g, "");
    const dniLimpio = String(dniParticipante).replace(/\D/g, "");

    // ✅ VALIDACIONES
    if (!numeroLimpio || !name || !dniLimpio || !fechaNacimiento) {
      return NextResponse.json({
        success: false,
        error: "Faltan datos obligatorios",
      });
    }

    if (!/^\d{5,10}$/.test(numeroLimpio)) {
      throw new Error("NUMERO_INVALIDO");
    }

    if (!/^\d{7,8}$/.test(dniLimpio)) {
      throw new Error("DNI_INVALIDO");
    }

    // 🎂 CALCULAR EDAD
    function calcularEdad(fecha: string) {
      const hoy = new Date();
      const nacimiento = new Date(fecha);
      let edad = hoy.getFullYear() - nacimiento.getFullYear();
      const m = hoy.getMonth() - nacimiento.getMonth();

      if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
      }

      return edad;
    }

    const edadCalculada = calcularEdad(fechaNacimiento);

    // 📌 REFERENCIAS
    const passengerRef = db.collection("pasajeros").doc(numeroLimpio);
    const dniRef = db.collection("dniCounts").doc(dniLimpio);

    let raffleNumber = "";

    await db.runTransaction(async (transaction) => {
      const passengerDoc = await transaction.get(passengerRef);
      const dniDoc = await transaction.get(dniRef);

      // ❌ NO CREAR PASAJERO AUTOMÁTICAMENTE
      if (!passengerDoc.exists) {
        throw new Error("PASAJERO_NO_VALIDO");
      }

      // 🔢 LIMITE POR PASAJERO
      const participantsSnapshot = await transaction.get(
        passengerRef.collection("participants")
      );

      if (participantsSnapshot.size >= 15) {
        throw new Error("LIMITE_PASAJERO");
      }

      // 🔢 LIMITE POR DNI
      let currentCount = dniDoc.exists ? dniDoc.data()?.count || 0 : 0;

      if (currentCount >= 3) {
        throw new Error("LIMITE_DNI");
      }

      // 🎟 RANDOM SEGURO
      const allParticipants = await transaction.get(
        db.collectionGroup("participants")
      );

      const totalGenerados = allParticipants.size;

      let numeroValido = false;

      while (!numeroValido) {
        if (totalGenerados < 90000) {
          raffleNumber = crypto.randomInt(10000, 99999).toString();
        } else {
          raffleNumber = crypto.randomInt(100000, 999999).toString();
        }

        const existe = allParticipants.docs.some(
          (doc) => doc.id === raffleNumber
        );

        if (!existe) {
          numeroValido = true;
        }
      }

      const participantRef = passengerRef
        .collection("participants")
        .doc(raffleNumber);

      // 💾 GUARDAR PARTICIPANTE
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

      // 🔢 ACTUALIZAR DNI
      transaction.set(
        dniRef,
        { count: currentCount + 1 },
        { merge: true }
      );
    });

    // 📄 Google Sheets
    await agregarFila({
      numeroPasajero: numeroLimpio,
      name,
      dni: dniLimpio,
      edad: edadCalculada,
      email,
      phone,
      numeroSorteo: raffleNumber,
    });

    // 🖼 Imagen
    const bufferImagen = await generarImagen(raffleNumber);

    // 📩 Email
    if (email && resend) {
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

    if (error.message === "PASAJERO_NO_VALIDO") {
      return NextResponse.json({
        success: false,
        error: "Número de pasajero inválido 🚫",
      });
    }

    if (error.message === "LIMITE_DNI") {
      return NextResponse.json({
        success: false,
        error: "Este DNI ya tiene 3 números 🚫",
      });
    }

    if (error.message === "LIMITE_PASAJERO") {
      return NextResponse.json({
        success: false,
        error: "Este pasajero alcanzó el máximo de 15 ventas 🚫",
      });
    }

    return NextResponse.json({
      success: false,
      error: "Error en el servidor",
    });
  }
}