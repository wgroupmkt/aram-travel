import fetch from "node-fetch";
import csv from "csv-parser";
import { Readable } from "stream";
import admin from "firebase-admin";
import fs from "fs";

// 🔐 Leer credenciales desde JSON
const serviceAccount = JSON.parse(
  fs.readFileSync("../../lib/serviceAccountKey.json", "utf8")
);

// 🔥 Inicializar Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// 🔗 URL Google Sheets (CSV)
const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1JTNEuYdZXSyj8Dwx3KYgx5yFSElbaCBRwcNP8GvdZkk/export?format=csv&gid=1830356038";

async function importar() {
  try {
    console.log("📥 Descargando datos...");

    const response = await fetch(SHEET_URL);
    const text = await response.text();

    const resultados = [];
    const stream = Readable.from([text]);

    stream
      .pipe(csv())
      .on("data", (data) => resultados.push(data))
      .on("end", async () => {
        console.log(`📊 Filas encontradas: ${resultados.length}`);
        console.log("🚀 Subiendo a Firebase...");

        let batch = db.batch();
        let count = 0;

        for (const row of resultados) {
          // 🔥 limpiar número
          const numero = row["Nº PASAJERO"]?.replace(/\./g, "");
          const dni = row.DNI_PASAJERO;

          const nombreCompleto =
            `${row.NOMBRE || ""} ${row.APELLIDO || ""}`.trim() ||
            "SIN NOMBRE";

          // ✅ validar datos
          if (!numero || !dni) {
            console.log("⚠️ Fila inválida:", row);
            continue;
          }

          const ref = db.collection("pasajeros").doc(numero);

          batch.set(
            ref,
            {
              numeroPasajero: numero,
              nombre: nombreCompleto,
              dni: dni,
              fechaNacimiento: row.FECHA_NACIMIENTO || "",
              email: row.EMAIL || "",
              anio: 2027,
              creadoEn: new Date(),
            },
            { merge: true } // 👈 evita sobreescribir todo
          );

          count++;

          // 🔥 Firebase limita a 500 operaciones por batch
          if (count === 500) {
            await batch.commit();
            batch = db.batch();
            count = 0;
            console.log("⚡ Batch subido (500 registros)");
          }
        }

        // 🔥 subir lo restante
        if (count > 0) {
          await batch.commit();
          console.log(`⚡ Último batch subido (${count} registros)`);
        }

        console.log("✅ Importación completa");
        process.exit();
      });
  } catch (error) {
    console.error("❌ Error en importación:", error);
  }
}

// 🧪 verificar conexión
console.log("🔥 Proyecto Firebase:", admin.app().options.projectId);

// 🚀 ejecutar
importar();