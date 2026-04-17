import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { Resend } from "resend";
import { generarImagen } from "@/lib/generarImagen";
import { agregarFila } from "@/lib/googleSheets";

// 🔐 API KEY
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function POST(req: Request) {

  console.log("EMAIL_USER:", process.env.EMAIL_USER);
  console.log("SHEET_ID:", process.env.SHEET_ID);
  console.log("RESEND_API_KEY:", process.env.RESEND_API_KEY);

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

    // 📌 REFERENCIA AL PASAJERO
    const passengerRef = db.collection("pasajeros").doc(numeroPasajero);
    const passengerDoc = await passengerRef.get();

    // 🆕 CREAR PASAJERO SI NO EXISTE
    if (!passengerDoc.exists) {
      await passengerRef.set({
        numero: numeroPasajero,
        totalParticipantes: 0,
        createdAt: new Date(),
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


    // 🔒 LIMITE: máximo 3 participantes por pasajero
     const participantsSnapshot = await passengerRef
       .collection("participants")
       .get();

     if (participantsSnapshot.size >= 3) {
       return NextResponse.json({
         success: false,
         error: "Este pasajero ya tiene 3 participantes cargados 🚫",
       });
     }

    // 🎟 GENERAR NÚMERO DE SORTEO
    let raffleNumber = Date.now().toString().slice(-5);

    if (raffleNumber.startsWith("0")) {
      raffleNumber = "1" + raffleNumber.slice(1);
    }

    // 📌 REFERENCIA PARTICIPANTE
    const participantRef = passengerRef
      .collection("participants")
      .doc(raffleNumber);

    // 💾 GUARDAR PARTICIPANTE
    await participantRef.set({
      name,
      fechaNacimiento,
      edad: edadCalculada,
      dni: dniParticipante,
      email: email || "",
      phone: phone || "",
      numeroSorteo: raffleNumber,
      createdAt: new Date(),
    });

    await agregarFila({
       numeroPasajero,
       name,
       dni: dniParticipante,
       edad: edadCalculada,
       email,
       phone,
       numeroSorteo: raffleNumber,
     });

    // 🔢 ACTUALIZAR CONTADOR
    const currentTotal = passengerDoc.data()?.totalParticipantes || 0;

    await passengerRef.set(
      {
        totalParticipantes: currentTotal + 1,
      },
      { merge: true }
    );

    // 🖼 GENERAR IMAGEN
    const bufferImagen = await generarImagen(raffleNumber);

    // 📩 ENVIAR EMAIL
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

  } catch (error) {
    console.error("❌ ERROR REGISTER:", error);

    return NextResponse.json({
      success: false,
      error: "Error en el servidor",
    });
  }
}