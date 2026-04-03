import { createCanvas, loadImage, registerFont } from "canvas";
import path from "path";

// 🔥 primero registrar
registerFont(
  path.join(process.cwd(), "public/fonts/Inter.ttf"),
  { family: "Inter" }
);

export async function generarImagen(numero: string) {
  const imagePath = path.join(process.cwd(), "public/img/sorteo.jpeg");
  const image = await loadImage(imagePath);

  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(image, 0, 0);

  // 🔥 usar la fuente registrada
  ctx.font = "bold 50px Inter";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillText(numero, image.width / 2, image.height * 0.64);

  return canvas.toBuffer("image/jpeg");
}