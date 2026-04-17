import fetch from "node-fetch";
import csv from "csv-parser";
import { Readable } from "stream";
import admin from "firebase-admin";
import fs from "fs";

// 🔐 Firebase
admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(fs.readFileSync("./serviceAccountKey.json", "utf8"))
  ),
});

const db = admin.firestore();

// 🔗 URL de tu Google Sheet como CSV
const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1JTNEuYdZXSyj8Dwx3KYgx5yFSElbaCBRwcNP8GvdZkk/export?format=csv";

async function importar() {
  const response = await fetch(SHEET_URL);
  const text = await response.text();

  const resultados = [];

  Readable.from(text)
    .pipe(csv())
    .on("data", (data) => resultados.push(data))
    .on("end", async () => {
      console.log("Subiendo datos...");
      
     for (const row of resultados) {
  // 🔥 limpiar número (OJO con el símbolo º)
  const numero = row["Nº PASAJERO"]?.replace(/\./g, "");

  // 🔥 obtener dni primero
  const dni = row.DNI_PASAJERO;

  // 🧠 armar nombre (puede venir incompleto)
  const nombreCompleto =
    `${row.NOMBRE || ""} ${row.APELLIDO || ""}`.trim() || "SIN NOMBRE";

  // ✅ validar SOLO lo importante
  if (!numero || !dni) {
    console.log("Fila inválida:", row);
    continue;
  }

  // 💾 guardar
  await db.collection("pasajeros").doc(numero).set({
    numeroPasajero: numero,
    nombre: nombreCompleto,
    dni: dni,
    fechaNacimiento: row.FECHA_NACIMIENTO || "",
    email: row.EMAIL || "",
    creadoEn: new Date(),
  });
}

      console.log("✅ Importación completa");
      process.exit();
    });
}

console.log("Proyecto Firebase:", admin.app().options.projectId);

importar();