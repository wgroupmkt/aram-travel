import { NextResponse } from "next/server";
import { generarImagen } from "@/lib/generarImagen";

export async function GET() {
  try {
    const buffer = await generarImagen("12345");

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Disposition": 'inline; filename="test.jpg"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("ERROR TEST IMAGEN:", error);

    return NextResponse.json(
      { ok: false, error: "No se pudo generar la imagen" },
      { status: 500 }
    );
  }
}