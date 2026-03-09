"use client";

import { useState } from "react";

export default function Registro() {
  const [form, setForm] = useState({
    sellerId: "",
    name: "",
    dni: "",
    edad: "",
    email: "",
    phone: "",
  });

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (data.success) {
        setSuccessMessage(
          `🎉 Registro exitoso! N° de sorteo: ${data.raffleNumber}`
        );

        setForm({
          sellerId: "",
          name: "",
          dni: "",
          edad: "",
          email: "",
          phone: "",
        });
      } else {
        setErrorMessage(data.error || "Ocurrió un error");
      }
    } catch (error) {
      setErrorMessage("Error de conexión con el servidor");
    }

    setLoading(false);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-200 via-cyan-200 to-green-200 p-6">

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white/80 backdrop-blur-md border border-white/40 p-10 rounded-3xl shadow-2xl flex flex-col gap-5"
      >
        <h1 className="text-3xl font-bold text-center text-gray-800">
          Registro de Participante
        </h1>

        {/* 🔵 PROMOTOR */}
        <div className="flex flex-col gap-3">
          <h2 className="text-gray-700 font-semibold">Promotor</h2>

          <input
            name="sellerId"
            value={form.sellerId}
            onChange={handleChange}
            placeholder="DNI Promotor"
            required
            className="border border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-sky-400 outline-none text-gray-700"
          />
        </div>

        {/* 🟢 PARTICIPANTE */}
        <div className="flex flex-col gap-3">
          <h2 className="text-gray-700 font-semibold">Participante</h2>

          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Nombre"
            required
            className="border border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-sky-400 outline-none text-gray-700"
          />

          <input
            name="dni"
            value={form.dni}
            onChange={handleChange}
            placeholder="DNI Participante"
            required
            className="border border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-sky-400 outline-none text-gray-700"
          />

          <input
            name="edad"
            value={form.edad}
            onChange={handleChange}
            placeholder="Edad"
            required
            className="border border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-sky-400 outline-none text-gray-700"
          />

          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            type="email"
            className="border border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-sky-400 outline-none text-gray-700"
          />

          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Teléfono"
            className="border border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-sky-400 outline-none text-gray-700"
          />
        </div>

        {/* MENSAJES */}
        {successMessage && (
          <div className="bg-green-200 text-green-800 p-3 rounded-lg text-sm font-medium">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-200 text-red-700 p-3 rounded-lg text-sm font-medium">
            {errorMessage}
          </div>
        )}

        {/* BOTÓN */}
        <button
          type="submit"
          disabled={loading}
          className="bg-gradient-to-r from-sky-500 to-green-400 text-white font-semibold p-3 rounded-xl shadow-md hover:scale-105 hover:shadow-lg transition"
        >
          {loading ? "Registrando..." : "Registrar"}
        </button>
      </form>
    </div>
  );
}