export async function agregarFila(data: any) {
  try {
    const res = await fetch(process.env.GOOGLE_SCRIPT_SEND_URL!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",   // ✓ JSON directo
      },
      body: JSON.stringify(data),             // ✓ sin wrapping en "data="
    });
    const text = await res.text();
    console.log("📊 Sheet response:", text);
  } catch (error) {
    console.error("❌ Error Google Sheets:", error);
  }
}