import { createCanvas, loadImage, registerFont } from "canvas";
import path from "path";

// 🔥 primero registrar
registerFont(
  path.join(process.cwd(), "public/fonts/Inter.ttf"),
  { family: "Inter" }
);

export async function generarImagen(numero: string) {
  const imagePath = path.join(process.cwd(), "public/img/sorteo.jpg");
  const image = await loadImage(imagePath);

  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(image, 0, 0);

  // dibujar imagen base
  ctx.drawImage(image, 0, 0);

  // estilos de texto
  ctx.font = "bold 50px Inter";
  ctx.fillStyle = "#ffffff";

  // ⚠️ CLAVE: centrado real
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // dibujar texto en el centro
  ctx.fillText(numero, canvas.width / 2, canvas.height / 2);

  // (opcional) debug para ver el centro exacto
  // ctx.fillStyle = "red";
  // ctx.fillRect(canvas.width / 2 - 5, canvas.height / 2 - 5, 10, 10);

  return canvas.toBuffer("image/jpeg");
}