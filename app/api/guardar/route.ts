import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

export async function POST(req: Request) {
  try {
    const data = await req.json();

    await db.collection("pasajeros").doc(data.numero).set(data);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("ERROR GUARDAR:", error);
    return NextResponse.json({ error: true }, { status: 500 });
  }
}