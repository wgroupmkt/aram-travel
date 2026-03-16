import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

export async function GET() {
  try {
    const promotersSnapshot = await db.collection("promoters").get();

    const promoters = await Promise.all(
      promotersSnapshot.docs.map(async (doc) => {

        const participantsSnapshot = await db
          .collection("promoters")
          .doc(doc.id)
          .collection("participants")
          .get();

        const participants = participantsSnapshot.docs.map((p) => {
          const data = p.data();

          return {
            name: data.name || "",
            age: data.age || data.edad || "",
            numeroSorteo:
              data.numeroSorteo ||
              data.numero ||
              data.raffleNumber ||
              "",
          };
        });

        return {
          id: doc.id,
          totalParticipants: participants.length,
          participants,
        };
      })
    );

    return NextResponse.json(promoters);

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error al obtener promotores" },
      { status: 500 }
    );
  }
}