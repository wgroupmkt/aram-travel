"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "500"],
});

export default function Registro() {
  const [form, setForm] = useState({
    numeroPasajero: "",
    name: "",
    dniParticipante: "",
    edad: "",
    email: "",
    phone: "",
    fechaNacimiento: "",
  });

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // 🔥 VALIDACIÓN
  const [existe, setExiste] = useState<boolean | null>(null);
  const [validando, setValidando] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState("");

  // 🔎 VALIDAR (SIN AUTOCOMPLETAR)
  const validarNumero = async (numero: string) => {
    if (!numero || numero.length !== 4) {
      setExiste(null);
      return;
    }

    try {
      setValidando(true);
      setErrorValidacion("");

      const res = await fetch(`/api/validar?numero=${numero}`);
      const data = await res.json();

      if (!data.existe) {
        setExiste(false);
        setErrorValidacion(data.error || "Número inválido");
      } else {
        setExiste(true);
      }
    } catch {
      setExiste(false);
      setErrorValidacion("Error al validar");
    } finally {
      setValidando(false);
    }
  };

  // ⏱️ DEBOUNCE
  useEffect(() => {
    const timeout = setTimeout(() => {
      validarNumero(form.numeroPasajero);
    }, 400);

    return () => clearTimeout(timeout);
  }, [form.numeroPasajero]);

  // 🧼 LIMPIAR FORM CUANDO CAMBIA EL NÚMERO
  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      name: "",
      dniParticipante: "",
      fechaNacimiento: "",
      email: "",
      phone: "",
    }));
  }, [form.numeroPasajero]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!existe) {
      setErrorMessage("El número de pasajero no es válido");
      return;
    }

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
          `🎉 Registro exitoso! N° de sorteo: ${data.numeroSorteo}`
        );

        setForm({
          numeroPasajero: "",
          name: "",
          dniParticipante: "",
          edad: "",
          fechaNacimiento: "",
          email: "",
          phone: "",
        });

        setExiste(null);
      } else {
        setErrorMessage(data.error || "Ocurrió un error");
      }
    } catch {
      setErrorMessage("Error de conexión con el servidor");
    }

    setLoading(false);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;

    let cleanValue = value;

    if (name === "numeroPasajero" || name === "dniParticipante") {
      cleanValue = value.replace(/\D/g, "");
    }

    setForm({
      ...form,
      [name]: cleanValue,
    });
  }

  return (
    <div
      className="relative min-h-screen flex items-center justify-center p-6 bg-cover bg-center"
      style={{ backgroundImage: "url('/img/fondo.jpeg')" }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full flex justify-center max-w-md bg-white p-5 rounded-3xl shadow-2xl flex flex-col gap-5 border-white ring-2 ring-pink-200 ring-inset"
      >
        {/* LOGO */}
        <div className="flex justify-end">
          <Image
            src="/img/logoara.png"
            alt="Registro"
            width={300}
            height={300}
            className="object-contain w-[206px]"
            priority
          />
        </div>

        {/* TITULOS */}
        <div className="flex flex-col justify-center relative top-13 mb-12 ml-6">
          <Image src="/img/registro.png" alt="" width={250} height={120} />
          <Image src="/img/participantes.png" alt="" width={250} height={120} />
        </div>

        {/* 🔵 PASAJERO */}
        <div className="flex flex-col gap-1 pl-5 pr-5">
          <h2 className={`${montserrat.className} font-medium text-cyan-700 ml-4 text-xl`}>
            PASAJERO
          </h2>

          <input
            name="numeroPasajero"
            value={form.numeroPasajero}
            onChange={handleChange}
            placeholder="Número de pasajero"
            required
            maxLength={4}
            inputMode="numeric"
            className={`
              ${montserrat.className}
              font-medium border-2 p-3 rounded-[200px] outline-none transition text-cyan-700 
              ${
                existe === null
                  ? "border-cyan-200"
                  : existe
                  ? "border-green-400"
                  : "border-red-400"
              }
            `}
          />

          {validando && (
            <p className="text-gray-500 text-sm ml-2">Verificando...</p>
          )}

          {existe === false && !validando && (
            <p className="text-red-500 text-sm ml-2">
              {errorValidacion}
            </p>
          )}

          {existe === true && !validando && (
            <p className="text-green-500 text-sm ml-2">
              Número válido ✔
            </p>
          )}
        </div>

        {/* 🟢 PARTICIPANTE */}
        <div className="flex flex-col gap-1 pl-5 pr-5">
          <h2 className={`${montserrat.className} font-medium text-pink-700 ml-4 text-xl`}>
            PARTICIPANTES
          </h2>

          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Nombre"
            required
            className={`${montserrat.className} border-2 border-pink-200 p-3 rounded-[200px] outline-none text-pink-700`}
          />

          <input
            name="dniParticipante"
            value={form.dniParticipante}
            onChange={handleChange}
            placeholder="DNI del participante"
            maxLength={8}
            className={`${montserrat.className} border-2 border-pink-200 p-3 rounded-[200px] outline-none text-pink-700`}
          />

          <input
            type="date"
            name="fechaNacimiento"
            value={form.fechaNacimiento}
            onChange={handleChange}
            className={`${montserrat.className} border-2 border-pink-200 p-3 rounded-[200px] outline-none text-pink-700`}
          />

          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            type="email"
            className={`${montserrat.className} border-2 border-pink-200 p-3 rounded-[200px] outline-none text-pink-700`}
          />

          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Teléfono"
            className={`${montserrat.className} border-2 border-pink-200 p-3 rounded-[200px] outline-none text-pink-700`}
          />
        </div>

        {/* MENSAJES */}
        {successMessage && (
          <div className="bg-green-200 text-green-800 p-3 rounded-lg text-sm text-center">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-200 text-red-700 p-3 rounded-lg text-sm">
            {errorMessage}
          </div>
        )}

        {/* BOTÓN */}
        <button
          type="submit"
          disabled={!existe || validando || loading}
          className="relative flex justify-center cursor-pointer group disabled:opacity-50"
        >
          <Image
            src="/img/registra.png"
            alt="Registrar"
            width={220}
            height={50}
            className="group-hover:opacity-0 transition"
          />

          <Image
            src="/img/registrarhov.png"
            alt="Hover"
            width={220}
            height={50}
            className="absolute opacity-0 group-hover:opacity-100 transition"
          />
        </button>
      </form>
    </div>
  );
}