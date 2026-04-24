import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { Resend } from "resend";
import { generarImagen } from "@/lib/generarImagen";
import { agregarFila } from "@/lib/googleSheets";

// 🔐 API KEY
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function POST(req: Request) {
  try {
    const {
      numeroPasajero,
      name,
      dniParticipante,
      fechaNacimiento,
      email,
      phone,
    } = await req.json();

    // ✅ VALIDACIÓN BÁSICA
    if (!numeroPasajero || !name || !dniParticipante || !fechaNacimiento) {
      return NextResponse.json({
        success: false,
        error: "Faltan datos obligatorios",
      });
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
    const passengerRef = db.collection("pasajeros").doc(numeroPasajero);
    const dniRef = db.collection("dniCounts").doc(dniParticipante);

    let raffleNumber = "";

    // 🔥 TRANSACCIÓN
    await db.runTransaction(async (transaction) => {
      const passengerDoc = await transaction.get(passengerRef);
      const dniDoc = await transaction.get(dniRef);

      // 🆕 CREAR PASAJERO SI NO EXISTE
      if (!passengerDoc.exists) {
        transaction.set(passengerRef, {
          numero: numeroPasajero,
          createdAt: new Date(),
        });
      }

      // 🔢 CONTAR PARTICIPANTES REALES (máx 15)
      const participantsSnapshot = await transaction.get(
        passengerRef.collection("participants")
      );

      const currentTotal = participantsSnapshot.size;

      if (currentTotal >= 15) {
        throw new Error("LIMITE_PASAJERO");
      }

      // 🔢 CONTADOR DNI (máx 3)
      let currentCount = 0;

      if (dniDoc.exists) {
        currentCount = dniDoc.data()?.count || 0;
      }

      if (currentCount >= 3) {
        throw new Error("LIMITE_DNI");
      }

      // 🎟 GENERAR NÚMERO SEGURO
      raffleNumber = Math.floor(10000 + Math.random() * 90000).toString();

      const participantRef = passengerRef
        .collection("participants")
        .doc(raffleNumber);

      // 💾 GUARDAR PARTICIPANTE
      transaction.set(participantRef, {
        name,
        fechaNacimiento,
        edad: edadCalculada,
        dni: dniParticipante,
        email: email || "",
        phone: phone || "",
        numeroSorteo: raffleNumber,
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
      numeroPasajero,
      name,
      dni: dniParticipante,
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
              <img src="cid:sorteo" style="max-width:100%;" />
            </div>
          `,
          attachments: [
            {
              filename: "sorteo.png",
              content: bufferImagen,
              cid: "sorteo",
            } as any,
          ],
        });
      } catch (error) {
        console.error("❌ Error enviando email:", error);
      }
    }

    // ✅ RESPUESTA FINAL
    return NextResponse.json({
      success: true,
      numeroSorteo: raffleNumber,
    });

  } catch (error: any) {
    console.error("❌ ERROR REGISTER:", error);

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