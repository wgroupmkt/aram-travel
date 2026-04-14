"use client";

import { useState } from "react";
import Image from "next/image";
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "500"], // 300 = Light, 500 = Medium
});

export default function Registro() {
  const [form, setForm] = useState({
  sellerId: "",
  name: "",
  dni: "",
  edad: "",
  email: "",
  phone: "",
  fechaNacimiento: ""
})


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
          `🎉 Registro exitoso! N° de sorteo: ${data.numeroSorteo}`
        );

         setForm({
          sellerId: "",
          name: "",
          dni: "",
          edad: "",
          fechaNacimiento: "",
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
  const { name, value } = e.target;

  let cleanValue = value;

  // 👉 solo para los campos DNI
  if (name === "dni" || name === "sellerId") {
    cleanValue = value.replace(/\D/g, ""); // elimina todo lo que no sea número
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

          

        <form onSubmit={handleSubmit}
       className="w-full flex justify-center max-w-md bg-white backdrop-blur-3xl p-5 rounded-3xl shadow-2xl flex flex-col gap-5 border-white ring-2 ring-pink-200 ring-inset">

            <div className="flex justify-end absolute top-8 right-7">
               <Image
                 src="/img/logoara.png"
                 alt="Registro de Participante"
                 width={300} height={300}
                 className="object-contain w-[206px] sm:w-[206px] md:w-[206px] lg:w-[206px]"
               />
             </div>


           <div className="flex flex-col justify-center relative top-13 mb-12 ml-6">
         <Image
             src="/img/registro.png"
             alt="Registro de Participante"
             width={250}
             height={120}
             className="object-contain"
           />
       
          <Image
             src="/img/participantes.png"
             alt="Registro de Participante"
             width={250}
             height={120}
             className="object-contain"
           />
           </div>


        {/* 🔵 PROMOTOR */}
        <div className="flex flex-col gap-1 pl-5 pr-5">


          <h2 className="`${montserrat.className} font-medium text-cyan-700 ml-4 text-xl">PASAJERO</h2>

          <input
              name="sellerId"
              value={form.sellerId}
              onChange={handleChange}
              onKeyDown={(e) => {
                if (e.key === "." || e.key === "," || e.key === "e" || e.key === "-") {
                  e.preventDefault();
                }
              }}
              onPaste={(e) => {
                const paste = e.clipboardData.getData("text");
                if (!/^\d+$/.test(paste)) {
                  e.preventDefault();
                }
              }}
              placeholder="DNI del pasajero"
              required
              maxLength={8}
              inputMode="numeric"
              pattern="[0-9]*"
              className={`${montserrat.className} input-rosado font-light border-2 border-pink-200 p-3 rounded-[200px] focus:ring-2 focus:ring-pink-400 outline-none text-pink-700`}
            />
        </div>

        {/* 🟢 PARTICIPANTE */}
        <div className="flex flex-col gap-1 pl-5 pr-5">
          <h2 className="`${montserrat.className} font-medium  text-pink-700 ml-4 mb-0 text-xl">PARTICIPANTES</h2>

          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Nombre"
            required
           className={`${montserrat.className} input-rosado font-light border-2 border-pink-200 p-3 rounded-[200px] focus:ring-2 focus:ring-pink-400 outline-none text-pink-700`}
          />

           <input
             name="dni"
             value={form.dni}
             onChange={handleChange}
             onKeyDown={(e) => {
               if (e.key === "." || e.key === "," || e.key === "e" || e.key === "-") {
                 e.preventDefault();
               }
             }}
             onPaste={(e) => {
               const paste = e.clipboardData.getData("text");
               if (!/^\d+$/.test(paste)) {
                 e.preventDefault();
               }
            }}
             placeholder="DNI del participante (sin puntos)"
             required
             maxLength={8}
             inputMode="numeric"
             pattern="[0-9]*"
             className={`${montserrat.className} input-rosado font-light border-2 border-pink-200 p-3 rounded-[200px] focus:ring-2 focus:ring-pink-400 outline-none text-pink-700`}
          />
            
          <input
            type="date"
            name="fechaNacimiento"
            value={form.fechaNacimiento}
            onChange={handleChange}
            required
            className={`${montserrat.className} input-rosado font-light border-2 border-pink-200 p-3 rounded-[200px] focus:ring-2 focus:ring-pink-400 outline-none text-pink-700`}
           />

          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            type="email"
           className={`${montserrat.className} input-rosado font-light border-2 border-pink-200 p-3 rounded-[200px] focus:ring-2 focus:ring-pink-400 outline-none text-pink-700`}
          />

          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Teléfono"
            className={`${montserrat.className} input-rosado font-light border-2 border-pink-200 p-3 rounded-[200px] focus:ring-2 focus:ring-pink-400 outline-none text-pink-700`}
          />
        </div>

        {/* MENSAJES */}
        {successMessage && (
          <div className="mx-auto bg-green-200 text-green-800 text-center p-3 rounded-lg text-sm font-medium w-full max-w-xs">
               {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-200 text-red-700 p-3 rounded-lg text-sm font-medium">
            {errorMessage}
          </div>
        )}

        {/* BOTÓN */}
      <button className="relative flex justify-center cursor-pointer group">

         {/* Imagen normal */}
         <Image
           src="/img/registra.png"
           alt="Registrar"
           width={220}
           height={50}
           className="object-contain group-hover:opacity-0 transition duration-300"
         />

         {/* Imagen hover */}
         <Image
           src="/img/registrarhov.png"
           alt="Registrar hover"
           width={220}
           height={50}
           className="object-contain absolute top-0 left-23.5 opacity-0 group-hover:opacity-100 transition duration-300"
         />

       </button>
      </form>
    </div>
  );
}