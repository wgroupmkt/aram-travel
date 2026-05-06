import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const numero = searchParams.get("numero");

    if (!numero) {
      return NextResponse.json({
        existe: false,
        error: "Falta número",
      });
    }

    // 🔥 MISMA LIMPIEZA QUE REGISTER
    const numeroLimpio = String(numero).replace(/\D/g, "");

    const docRef = db.collection("pasajeros").doc(numeroLimpio);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({
        existe: false,
      });
    }

    return NextResponse.json({
      existe: true,
    });
  } catch (error) {
    console.error("ERROR VALIDAR:", error);

    return NextResponse.json(
      {
        existe: false,
        error: "Error interno",
      },
      { status: 500 }
    );
  }
}