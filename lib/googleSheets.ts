export async function agregarFila(data: any) {
  try {
    const res = await fetch(process.env.GOOGLE_SCRIPT_URL!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const text = await res.text();

    console.log("📊 Sheet response:", text);

  } catch (error) {
    console.error("❌ Error Google Sheets:", error);
  }
}