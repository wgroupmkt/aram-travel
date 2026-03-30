import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { sellerId, name, dni, edad, email, phone } =
      await req.json();

    if (!sellerId || !name || !dni) {
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

    // 🎟 NUMERO DE SORTEO
    const raffleNumber = Date.now().toString().slice(-6);

    const participantRef = passengerRef.collection("participants").doc();

    await participantRef.set({
      name,
      edad: Number(edad),
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

    // 📩 ENVIAR EMAIL (solo si hay email)
    if (email) {
      try {
        await resend.emails.send({
          from: "Registro <registro@promo.agustinescuderoweb.com>", // ⚠️ cambiar luego
          to: email,
          subject: "Tu número de sorteo 🎟",
          html: `
            <div style="font-family: Arial; padding:20px;">
              <h2>¡Registro exitoso!</h2>
              <p>Hola ${name},</p>
              <p>Tu número de sorteo es:</p>
              <h1 style="color:#2563eb;">${raffleNumber}</h1>
              <p>¡Mucha suerte! 🍀</p>
            </div>
          `,
        });
      } catch (error) {
        console.error("Error enviando email:", error);
      }
    }

    return NextResponse.json({
      success: true,
      numeroSorteo: raffleNumber,
    });

  } catch (error) {
    console.error("ERROR REGISTER:", error);

    return NextResponse.json({
      success: false,
      error: "Error en el servidor",
    });
  }
}