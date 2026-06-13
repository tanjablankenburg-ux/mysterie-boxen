import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "API Key fehlt" }, { status: 500 });
  }

  const { images, zustand } = await req.json();

  const imageContent = images.map((base64: string) => ({
    type: "image" as const,
    source: {
      type: "base64" as const,
      media_type: "image/jpeg" as const,
      data: base64.replace(/^data:image\/\w+;base64,/, ""),
    },
  }));

  const prompt = `Du bist ein Experte für Secondhand-Verkauf und Produktbewertung. Analysiere diese Fotos eines Artikels aus einer Mystery Box.

Zustand laut Nutzer: ${zustand}

Erstelle eine JSON-Antwort mit folgenden Feldern:
{
  "bezeichnung": "Genaue Produktbezeichnung (Marke, Modell, Größe etc.)",
  "kategorie": "Eine von: Elektronik, Spielzeug, Kleidung, Schuhe, Schmuck, Haushalt, Sport, Bücher, Sammler, Sonstiges",
  "echtheit": "Echt / Gefälscht / Wahrscheinlich echt / Wahrscheinlich gefälscht / Nicht erkennbar",
  "echtheit_begruendung": "Kurze Begründung zur Echtheit",
  "zustand_bewertung": "Neuwertig / Sehr gut / Gut / Akzeptabel / Defekt",
  "preis_min": Mindestpreis in Euro als Zahl,
  "preis_max": Höchstpreis in Euro als Zahl,
  "preis_empfehlung": Realistischer Verkaufspreis als Zahl,
  "plattform": ["Beste Plattform 1", "Beste Plattform 2"],
  "plattform_begruendung": "Warum diese Plattformen",
  "verkaufstext_kurz": "Kurzer Verkaufstext für Kleinanzeigen (max 3 Sätze)",
  "verkaufstext_lang": "Ausführlicher Verkaufstext für eBay (5-8 Sätze)",
  "besonderheiten": "Wichtige Hinweise zum Artikel"
}

Antworte NUR mit dem JSON, ohne Erklärungen.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    messages: [
      {
        role: "user",
        content: [
          ...imageContent,
          { type: "text", text: prompt },
        ],
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  try {
    const json = JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
    return NextResponse.json(json);
  } catch {
    return NextResponse.json({ error: "Analyse fehlgeschlagen", raw: text }, { status: 500 });
  }
}
