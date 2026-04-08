import { NextResponse } from "next/server";
import { db } from "../../../lib/firebaseAdmin";
import { Resend } from "resend";
import { generarImagen } from "@/lib/generarImagen";

// ✅ Validar API KEY antes de usarla
const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  console.error("❌ RESEND_API_KEY no está definida");
}

const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function POST(req: Request) {
  try {
    const { sellerId, name, dni, fechaNacimiento, email, phone } = await req.json();

    if (!sellerId || !name || !dni || !fechaNacimiento) {
      return NextResponse.json({
        success: false,
        error: "Faltan datos obligatorios",
      });
    }

    const passengerRef = db.collection("passengers").doc(sellerId);
    const passengerDoc = await passengerRef.get();

    if (!passengerDoc.exists) {
      await passengerRef.set({
        name: `Pasajero ${sellerId}`,
        totalParticipants: 0,
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

    // 🔒 VALIDACIÓN: máximo 15 participaciones por DNI por mes
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59
    );

    const snapshot = await db
      .collectionGroup("participants") // 🔥 busca en todas las subcolecciones
      .where("dni", "==", dni)
      .where("createdAt", ">=", startOfMonth)
      .where("createdAt", "<=", endOfMonth)
      .get();

    if (snapshot.size > 14) {
      return NextResponse.json({
        success: false,
        error: "Ya alcanzaste el máximo de 15 participaciones este mes 😅",
      });
    }

      // 🎟 NUMERO DE SORTEO
       let raffleNumber = Date.now().toString().slice(-5);

       if (raffleNumber.startsWith("0")) {
       raffleNumber = "1" + raffleNumber.slice(1);
       }

      // 👇 AGREGAR ESTO
       const participantRef = passengerRef
         .collection("participants")
         .doc(raffleNumber);

      // 💾 GUARDAR PARTICIPANTE
      await participantRef.set({
        name,
        fechaNacimiento,
        edad: edadCalculada,
        dni,
        email: email || "",
        phone: phone || "",
        numeroSorteo: raffleNumber,
        createdAt: new Date(),
      });

    // 🔢 ACTUALIZAR CONTADOR
    const currentTotal = passengerDoc.data()?.totalParticipants || 0;

    await passengerRef.update({
      totalParticipants: currentTotal + 1,
    });

    // 🔥 GENERAR IMAGEN
    const bufferImagen = await generarImagen(raffleNumber.toString());

    // 📩 ENVIAR EMAIL
    if (email && resend) {
      try {
        await resend.emails.send({
          from: "Registro <info@bono.wolftravel.com.ar>",
          to: email,
          subject: "Tu número de sorteo 🎟",
          html: `
            <div style="font-family: Arial; padding:20px;">
              <h2>¡Registro exitoso!</h2>
              <p>Hola ${name}, gracias por ayudarme con mi viaje de egresados 💙🐺</p>
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
    } else {
      console.log("⚠️ Email no enviado (falta email o API key)");
    }

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