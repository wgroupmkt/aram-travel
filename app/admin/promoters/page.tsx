"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";

type Promoter = {
  id: string;
  totalParticipants?: number;
};

export default function PromotersPage() {
  const [promoters, setPromoters] = useState<Promoter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/promoters")
      .then((res) => res.json())
      .then((data) => {
        setPromoters(data);
        setLoading(false);
      });
  }, []);

  const descargarExcel = () => {
    const dataFormateada = promoters.map((p) => ({
      DNI: p.id,
      "Total Participantes": p.totalParticipants || 0,
      Estado:
        (p.totalParticipants || 0) > 0
          ? "Activo"
          : "Sin participantes",
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataFormateada);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Promotores");

    XLSX.writeFile(workbook, "promotores.xlsx");
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-200 via-cyan-200 to-green-200 text-gray-700 text-lg">
        Cargando promotores...
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-200 via-cyan-200 to-green-200 flex justify-center items-start p-10">
      
      <div className="w-full max-w-5xl bg-white/80 backdrop-blur-md shadow-2xl rounded-3xl p-10 border border-white/40">

        <div className="flex justify-between items-center mb-8">

          <h1 className="text-3xl font-bold text-gray-800">
            Promotores Registrados
          </h1>

          <button
            onClick={descargarExcel}
            className="bg-gradient-to-r from-sky-500 to-green-400 text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:scale-105 hover:shadow-lg transition"
          >
            Descargar Excel
          </button>

        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-200">

          <table className="w-full border-collapse">

            <thead>
              <tr className="bg-sky-100 text-gray-700 text-sm uppercase tracking-wider">
                <th className="text-left px-6 py-4">DNI</th>
                <th className="text-left px-6 py-4">Total Participantes</th>
                <th className="text-left px-6 py-4">Estado</th>
              </tr>
            </thead>

            <tbody>
              {promoters.map((promoter) => (
                <tr
                  key={promoter.id}
                  className="border-b hover:bg-sky-50 transition"
                >

                  <td className="px-6 py-4 font-semibold text-gray-800">
                    {promoter.id}
                  </td>

                  <td className="px-6 py-4 text-gray-700">
                    {promoter.totalParticipants || 0}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`px-4 py-1 text-xs rounded-full font-semibold ${
                        (promoter.totalParticipants || 0) > 0
                          ? "bg-green-200 text-green-800"
                          : "bg-red-200 text-red-700"
                      }`}
                    >
                      {(promoter.totalParticipants || 0) > 0
                        ? "Activo"
                        : "Sin participantes"}
                    </span>
                  </td>

                </tr>
              ))}
            </tbody>

          </table>

        </div>

        <div className="mt-6 text-sm text-gray-700 font-medium">
          Total promotores: {promoters.length}
        </div>

      </div>
    </div>
  );
}