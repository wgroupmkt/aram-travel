import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const numero = searchParams.get("numero");

    if (!numero) {
      return NextResponse.json({
        existe: false,
        error: "Falta número de pasajero",
      });
    }

    // 🔥 BUSCAR POR CAMPO
    const snapshot = await db
      .collection("pasajeros")
      .where("numeroPasajero", "==", numero)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({
        existe: false,
        error: "No existe el pasajero",
      });
    }

    return NextResponse.json({
      existe: true,
      data: snapshot.docs[0].data(),
    });

  } catch (error) {
    console.error("❌ ERROR VALIDAR:", error);

    return NextResponse.json({
      existe: false,
      error: "Error del servidor",
    });
  }
}