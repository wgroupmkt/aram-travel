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
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  return (
        <div className="relative min-h-screen flex items-center justify-center bg-cover bg-center p-6">

           <video 
              className="absolute top-0 left-0 w-full h-full object-cover"
              autoPlay 
              muted 
              loop 
              playsInline
            >
              <source src="/video/wolf.mp4" type="video/mp4" />
            </video>
          

        <form onSubmit={handleSubmit}
       className="w-full flex justify-center max-w-md bg-blue-800/40 backdrop-blur-3xl border-blue-200/30 p-5 rounded-3xl shadow-2xl flex flex-col gap-5 border-3">

            <div className="flex justify-end absolute top-8 right-7">
               <Image
                 src="/img/logo.png"
                 alt="Registro de Participante"
                 width={370} height={100}
                 className="object-contain w-[106px] sm:w-[106px] md:w-[106px] lg:w-[106px]"
               />
             </div>


           <div className="flex justify-center relative top-6">
        <Image
             src="/img/registro.png"
             alt="Registro de Participante"
             width={620}
             height={120}
             className="object-contain"
           />
         </div>


        {/* 🔵 PROMOTOR */}
        <div className="flex flex-col gap-1 pl-5 pr-5">


          <h2 className="`${montserrat.className} font-medium text-white-700 ml-4 text-xl">PASAJERO</h2>

          <input
            name="sellerId"
            value={form.sellerId}
            onChange={handleChange}
            placeholder="D.N.I - Pasajero"
            required
            className="`${montserrat.className} font-light border-2 border-gray-200 p-3 rounded-[200px] focus:ring-2 focus:ring-sky-400 outline-none text-white-700"
          />
        </div>

        {/* 🟢 PARTICIPANTE */}
        <div className="flex flex-col gap-1 pl-5 pr-5">
          <h2 className="`${montserrat.className} font-medium  text-white-700 ml-4 mb-0 text-xl">PARTICIPANTES</h2>

          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Nombre"
            required
            className="`${montserrat.className} font-light border-2 rounded-[200px] border-gray-200 p-3 focus:ring-2 focus:ring-sky-400 outline-none text-white-700"
          />

          <input
            name="dni"
            value={form.dni}
            onChange={handleChange}
            placeholder="D.N.I - Participante"
            required
            className="`${montserrat.className} font-light border-2 rounded-[200px] border-gray-200 p-3 focus:ring-2 focus:ring-sky-400 outline-none text-white-700"
          />
            
          <input
            type="date"
            name="fechaNacimiento"
            value={form.fechaNacimiento}
            onChange={handleChange}
            required
            className="`${montserrat.className} font-light border-2 rounded-[200px] border-gray-200 p-3 focus:ring-2 focus:ring-sky-400 outline-none text-white-700"
           />

          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            type="email"
            className="`${montserrat.className} font-light border-2 rounded-[200px] border-gray-200 p-3 focus:ring-2 focus:ring-sky-400 outline-none text-white-700"
          />

          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Teléfono"
            className="`${montserrat.className} font-light border-2 rounded-[200px] border-gray-200 p-3 focus:ring-2 focus:ring-sky-400 outline-none text-white-700"
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
           src="/img/registrar.png"
           alt="Registrar"
           width={420}
           height={50}
           className="object-contain group-hover:opacity-0 transition duration-300"
         />

         {/* Imagen hover */}
         <Image
           src="/img/registrarhover.png"
           alt="Registrar hover"
           width={420}
           height={50}
           className="object-contain absolute top-0 left-0 opacity-0 group-hover:opacity-100 transition duration-300"
         />

       </button>
      </form>
    </div>
  );
}