"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const ZUSTAENDE = ["Neu", "Sehr gut", "Gut", "Akzeptabel", "Defekt"];

export default function NeuPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fotos, setFotos] = useState<string[]>([]);
  const [zustand, setZustand] = useState("Gut");
  const [boxName, setBoxName] = useState("");
  const [analysing, setAnalysing] = useState(false);
  const [ergebnis, setErgebnis] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleFotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        setFotos(prev => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  }

  async function handleAnalyse() {
    if (fotos.length === 0) { setError("Bitte mindestens ein Foto aufnehmen."); return; }
    setError("");
    setAnalysing(true);
    try {
      const res = await fetch("/api/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: fotos, zustand }),
      });
      const data = await res.json();
      if (data.error) { setError("Analyse fehlgeschlagen. Nochmal versuchen."); }
      else { setErgebnis(data); }
    } catch {
      setError("Verbindungsfehler. Bitte nochmal versuchen.");
    }
    setAnalysing(false);
  }

  async function handleSpeichern() {
    if (!ergebnis) return;
    setSaving(true);
    const { data, error: err } = await supabase.from("artikel").insert({
      box_name: boxName,
      bezeichnung: ergebnis.bezeichnung,
      kategorie: ergebnis.kategorie,
      zustand: ergebnis.zustand_bewertung,
      preis_min: ergebnis.preis_min,
      preis_max: ergebnis.preis_max,
      preis_empfehlung: ergebnis.preis_empfehlung,
      plattform: ergebnis.plattform,
      verkaufstext: ergebnis.verkaufstext_lang,
      echtheit: ergebnis.echtheit,
      fotos: fotos,
      verkauft: false,
    }).select().single();

    if (err) { setError("Speichern fehlgeschlagen."); setSaving(false); return; }
    router.push(`/artikel/${data.id}`);
  }

  return (
    <main className="min-h-screen px-4 py-6 max-w-2xl mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-xl">←</button>
        <h1 className="text-xl font-bold">Neuer Artikel</h1>
      </div>

      {/* Box Name */}
      <div className="mb-4">
        <label className="text-sm font-medium mb-1 block" style={{ color: "#888" }}>Box-Name (optional)</label>
        <input
          value={boxName}
          onChange={e => setBoxName(e.target.value)}
          placeholder="z.B. Amazon Box Mai"
          className="w-full px-4 py-3 rounded-xl text-white outline-none"
          style={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }}
        />
      </div>

      {/* Zustand */}
      <div className="mb-4">
        <label className="text-sm font-medium mb-2 block" style={{ color: "#888" }}>Zustand</label>
        <div className="flex gap-2 flex-wrap">
          {ZUSTAENDE.map(z => (
            <button key={z} onClick={() => setZustand(z)}
              className="px-3 py-1.5 rounded-full text-sm font-medium"
              style={{
                backgroundColor: zustand === z ? "#f59e0b" : "#1a1a1a",
                color: zustand === z ? "#000" : "#888",
              }}>
              {z}
            </button>
          ))}
        </div>
      </div>

      {/* Fotos */}
      <div className="mb-6">
        <label className="text-sm font-medium mb-2 block" style={{ color: "#888" }}>Fotos</label>
        <input ref={fileRef} type="file" accept="image/*" multiple capture="environment"
          onChange={handleFotos} className="hidden" />

        <div className="grid grid-cols-3 gap-2 mb-3">
          {fotos.map((f, i) => (
            <div key={i} className="relative aspect-square">
              <img src={f} alt="" className="w-full h-full object-cover rounded-xl" />
              <button onClick={() => setFotos(prev => prev.filter((_, j) => j !== i))}
                className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: "#ef4444", color: "#fff" }}>×</button>
            </div>
          ))}
          <button onClick={() => fileRef.current?.click()}
            className="aspect-square rounded-xl flex flex-col items-center justify-center gap-1 text-sm"
            style={{ backgroundColor: "#1a1a1a", color: "#888", border: "2px dashed #333" }}>
            <span className="text-2xl">📷</span>
            <span>Foto</span>
          </button>
        </div>
      </div>

      {error && <div className="mb-4 p-3 rounded-xl text-sm" style={{ backgroundColor: "#450a0a", color: "#f87171" }}>{error}</div>}

      {/* Analyse Button */}
      {!ergebnis && (
        <button onClick={handleAnalyse} disabled={analysing || fotos.length === 0}
          className="w-full py-4 rounded-2xl font-bold text-black text-lg mb-4"
          style={{ backgroundColor: fotos.length > 0 ? "#f59e0b" : "#333", color: fotos.length > 0 ? "#000" : "#666" }}>
          {analysing ? "🔍 KI analysiert..." : "🔍 KI-Analyse starten"}
        </button>
      )}

      {/* Ergebnis */}
      {ergebnis && (
        <div className="space-y-4">
          <div className="rounded-2xl p-4" style={{ backgroundColor: "#1a1a1a" }}>
            <div className="text-xs mb-1" style={{ color: "#888" }}>Bezeichnung</div>
            <div className="font-bold text-lg">{ergebnis.bezeichnung as string}</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl p-4" style={{ backgroundColor: "#1a1a1a" }}>
              <div className="text-xs mb-1" style={{ color: "#888" }}>Kategorie</div>
              <div className="font-semibold">{ergebnis.kategorie as string}</div>
            </div>
            <div className="rounded-2xl p-4" style={{ backgroundColor: "#1a1a1a" }}>
              <div className="text-xs mb-1" style={{ color: "#888" }}>Zustand</div>
              <div className="font-semibold">{ergebnis.zustand_bewertung as string}</div>
            </div>
          </div>

          <div className="rounded-2xl p-4" style={{ backgroundColor: "#1a1a1a" }}>
            <div className="text-xs mb-1" style={{ color: "#888" }}>Echtheit</div>
            <div className="font-semibold" style={{
              color: (ergebnis.echtheit as string).includes("Gefälscht") ? "#ef4444" :
                (ergebnis.echtheit as string).includes("Echt") ? "#22c55e" : "#f59e0b"
            }}>
              {ergebnis.echtheit as string}
            </div>
            <div className="text-xs mt-1" style={{ color: "#888" }}>{ergebnis.echtheit_begruendung as string}</div>
          </div>

          <div className="rounded-2xl p-4" style={{ backgroundColor: "#1a1a1a" }}>
            <div className="text-xs mb-2" style={{ color: "#888" }}>Preis</div>
            <div className="flex items-center gap-3">
              <div className="text-sm" style={{ color: "#888" }}>{ergebnis.preis_min as number}–{ergebnis.preis_max as number} €</div>
              <div className="text-2xl font-bold" style={{ color: "#f59e0b" }}>{ergebnis.preis_empfehlung as number} €</div>
            </div>
          </div>

          <div className="rounded-2xl p-4" style={{ backgroundColor: "#1a1a1a" }}>
            <div className="text-xs mb-2" style={{ color: "#888" }}>Beste Plattformen</div>
            <div className="flex gap-2 flex-wrap">
              {(ergebnis.plattform as string[]).map((p: string) => (
                <span key={p} className="px-3 py-1 rounded-full text-sm font-medium"
                  style={{ backgroundColor: "#292929", color: "#f59e0b" }}>{p}</span>
              ))}
            </div>
            <div className="text-xs mt-2" style={{ color: "#666" }}>{ergebnis.plattform_begruendung as string}</div>
          </div>

          <div className="rounded-2xl p-4" style={{ backgroundColor: "#1a1a1a" }}>
            <div className="text-xs mb-2" style={{ color: "#888" }}>Verkaufstext (Kleinanzeigen)</div>
            <p className="text-sm leading-relaxed">{ergebnis.verkaufstext_kurz as string}</p>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setErgebnis(null)}
              className="flex-1 py-3 rounded-2xl font-semibold border"
              style={{ borderColor: "#333", color: "#888" }}>
              Neu analysieren
            </button>
            <button onClick={handleSpeichern} disabled={saving}
              className="flex-1 py-3 rounded-2xl font-bold text-black"
              style={{ backgroundColor: "#f59e0b" }}>
              {saving ? "Speichert..." : "💾 Speichern"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
