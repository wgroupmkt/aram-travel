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

    // 🔥 BUSCAR POR ID (NO usar where)
    const docRef = db.collection("pasajeros").doc(numero);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({
        existe: false,
      });
    }

    return NextResponse.json({
      existe: true,
      data: docSnap.data(),
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