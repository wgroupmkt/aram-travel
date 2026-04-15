"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Montserrat } from "next/font/google";
import fondo from "@/public/img/fondo.jpeg"

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "500"],
});

export default function Admin() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(""); // ✅ AHORA ESTÁ BIEN

  useEffect(() => {
    fetch("/api/admin")
      .then((res) => res.json())
      .then((data) => {
        console.log("DATA:", data);
        setData(data.passengers || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("ERROR FRONT:", err);
        setLoading(false);
      });
  }, []);

  // 🔍 FILTRO POR DNI + NOMBRE + N° SORTEO
  const filteredData = data.filter((p) =>
    p.id.toString().includes(search) ||
    p.participants.some((part: any) =>
      part.name?.toLowerCase().includes(search.toLowerCase()) ||
      part.numeroSorteo?.toString().includes(search)
    )
  );

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6">

      {/* 🎥 VIDEO FONDO */}
      <Image src={fondo}
       className="absolute"
      >

      </Image>

      {/* 🌫️ OVERLAY */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>

      {/* 📦 CONTENEDOR */}
      <div className="relative w-full max-w-5xl bg-blue-900/40 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 shadow-2xl">

        {/* 🧠 LOGO */}
        <div className="flex justify-end mb-4">
          <Image
            src="/img/logoara.png"
            alt="Logo"
            width={200}
            height={40}
          />
        </div>

        {/* 🏷️ TÍTULO */}
        <h1 className={`${montserrat.className} text-white text-2xl text-center mb-6`}>
          Panel Administrador
        </h1>

        {/* 🔍 BUSCADOR */}
        <div className="relative mb-6">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300">
            🔍
          </span>

          <input
            type="text"
            placeholder="Buscar por DNI, nombre o sorteo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-full bg-white/10 border border-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* 🔄 LOADING */}
        {loading && (
          <p className="text-white text-center">Cargando datos...</p>
        )}

        {/* ❌ SIN DATOS */}
        {!loading && filteredData.length === 0 && (
          <p className="text-white text-center">
            No hay resultados
          </p>
        )}

        {/* 📊 LISTA */}
        <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto">

          {filteredData.map((p) => (
            <div
              key={p.id}
              className="bg-white/10 border border-white/20 rounded-xl p-4"
            >
              {/* CABECERA */}
              <div className="flex justify-between">
                <h2 className="text-white font-medium">
                  DNI: {p.id}
                </h2>

                <span className="text-sm bg-blue-500 px-3 py-1 rounded-full text-white">
                  {p.totalParticipants} participantes
                </span>
              </div>

              {/* PARTICIPANTES */}
              <div className="mt-3 flex flex-col gap-2">

                {p.participants.length === 0 && (
                  <p className="text-gray-300 text-sm">
                    Sin participantes
                  </p>
                )}

                {p.participants.map((part: any, i: number) => (
                  <div
                    key={i}
                    className="flex justify-between bg-white/5 p-2 rounded-lg text-white text-sm"
                  >
                    <span>
                      {part.name} ({part.age})
                    </span>

                    <span className="text-blue-300">
                      #{part.numeroSorteo || "—"}
                    </span>
                  </div>
                ))}

              </div>
            </div>
          ))}

        </div>
      </div>
    </div>
  );
}