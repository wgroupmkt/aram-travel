import { NextResponse } from "next/server";
import { generarImagen } from "@/lib/generarImagen"; // ajustá la ruta

export const runtime = "nodejs";

export async function GET() {
  try {
    const buffer = await generarImagen("12345");

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/jpeg",
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error generando imagen" }, { status: 500 });
  }
}