"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";

type Participant = {
name: string;
age: number;
numeroSorteo: number;
};

type Promoter = {
id: string;
participants: Participant[];
};

export default function PromotersPage() {
const [promoters, setPromoters] = useState<Promoter[]>([]);
const [search, setSearch] = useState("");

useEffect(() => {
fetch("/api/promoters")
.then((res) => res.json())
.then((data) => {
setPromoters(data);
});
}, []);

// FILTRO POR DNI
const filteredPromoters = promoters.filter((p) =>
p.id.toLowerCase().includes(search.toLowerCase())
);

// EXCEL POR PROMOTOR
const descargarExcelPromotor = (promoter: Promoter) => {
const rows = promoter.participants.map((p) => ({
Promotor: promoter.id,
Nombre: p.name,
Edad: p.age,
NumeroSorteo: p.numeroSorteo,
}));

};

// EXCEL GENERAL
const descargarExcelGeneral = () => {

  const rows = [];

  promoters.forEach((promoter) => {

    promoter.participants?.forEach((p) => {

      rows.push({
        DNI: promoter.id,
        Nombre: p.name,
        Edad: p.age,
        NumeroSorteo: p.numeroSorteo
      });

    });

  });

  if (rows.length === 0) {
    alert("No hay datos para exportar");
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Participantes");

  XLSX.writeFile(workbook, "participantes.xlsx");

};

return ( <div className="min-h-screen bg-gradient-to-br from-sky-200 via-cyan-200 to-green-200 p-10">

```
  <div className="max-w-6xl mx-auto">

    <div className="flex justify-between items-center mb-8">

      <h1 className="text-3xl font-bold text-gray-800">
        Pasajeros Registrados
      </h1>

      <button
        onClick={descargarExcelGeneral}
        className="bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:scale-105 transition"
      >
        Descargar Excel General
      </button>

    </div>

    {/* BUSCADOR */}

    <input
      type="text"
      placeholder="Buscar por DNI..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="w-100 mb-8 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-400 text-gray-700"
    />

    {/* TARJETAS PROMOTORES */}

    <div className="grid md:grid-cols-2 gap-8">

      {filteredPromoters.map((promoter) => (

        <div
          key={promoter.id}
          className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-6"
        >

          <div className="flex justify-between items-center mb-4">

            <div>

              <h2 className="text-xl font-bold text-gray-800">
                DNI: {promoter.id}
              </h2>

              <p className="text-sm text-gray-600">
                Participantes: {promoter.participants.length}
              </p>

            </div>

            <button
              onClick={() => descargarExcelPromotor(promoter)}
              className="bg-sky-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:scale-105 transition"
            >
              Excel
            </button>

          </div>

          <table className="w-full text-sm">

            <thead>
              <tr className="bg-sky-100 text-gray-700">
                <th className="px-4 py-2 text-left">Nombre</th>
                <th className="px-4 py-2 text-left">Edad</th>
                <th className="px-4 py-2 text-left">Nº Sorteo</th>
              </tr>
            </thead>

            <tbody>

              {promoter.participants.map((p, index) => (

                <tr key={index} className="border-b">

                  <td className="px-4 py-2 text-gray-700">{p.name}</td>

                  <td className="px-4 py-2 text-gray-700">{p.age}</td>

                  <td className="px-4 py-2 font-semibold text-sky-700">
                    {p.numeroSorteo}
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      ))}

    </div>

  </div>

</div>
);
}
