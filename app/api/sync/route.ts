import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

const SHEET_URL = process.env.GOOGLE_SHEET_CSV_URL!;
console.log(process.env.GOOGLE_SHEET_CSV_URL);

export async function POST() {
  try {
    const response = await fetch(SHEET_URL);
    const csvText = await response.text();

    const lines = csvText.split("\n");

    let nuevos = 0;
    let omitidos = 0;
    let errores = 0;

    const batch = db.batch();

    for (let i = 1; i < lines.length; i++) {
      try {
        const cols = lines[i].split(",");

        // 🔥 limpiamos el número (sin puntos)
        const numeroRaw = String(cols[0] || "").trim();
        const numero = numeroRaw.replace(/\./g, "");

        const nombre = String(cols[1] || "").trim();
        const apellido = String(cols[2] || "").trim();
        const dni = String(cols[3] || "").trim();
        const anio = String(cols[4] || "").trim();

        if (!numero) {
          omitidos++;
          continue;
        }

        const ref = db.collection("pasajeros").doc(numero);

        batch.set(ref, {
          numero,
          nombre,
          apellido,
          dni,
          anio,
          createdAt: new Date(),
        });

        nuevos++;
      } catch (error) {
        errores++;
      }
    }

    await batch.commit();

    return NextResponse.json({
      ok: true,
      nuevos,
      omitidos,
      errores,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: "Error sincronizando" },
      { status: 500 }
    );
  }
}