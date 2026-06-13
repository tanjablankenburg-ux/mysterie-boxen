"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Artikel = {
  id: string;
  bezeichnung: string;
  kategorie: string;
  zustand: string;
  preis_min: number;
  preis_max: number;
  preis_empfehlung: number;
  plattform: string[];
  verkaufstext: string;
  echtheit: string;
  fotos: string[];
  verkauft: boolean;
  box_name: string;
  notizen: string;
  created_at: string;
};

export default function ArtikelPage() {
  const router = useRouter();
  const { id } = useParams();
  const [artikel, setArtikel] = useState<Artikel | null>(null);
  const [notizen, setNotizen] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeFoto, setActiveFoto] = useState(0);

  useEffect(() => {
    supabase.from("artikel").select("*").eq("id", id).single()
      .then(({ data }) => { if (data) { setArtikel(data); setNotizen(data.notizen || ""); } });
  }, [id]);

  async function toggleVerkauft() {
    if (!artikel) return;
    await supabase.from("artikel").update({ verkauft: !artikel.verkauft }).eq("id", id);
    setArtikel({ ...artikel, verkauft: !artikel.verkauft });
  }

  async function saveNotizen() {
    await supabase.from("artikel").update({ notizen }).eq("id", id);
  }

  async function loeschen() {
    if (!confirm("Artikel wirklich löschen?")) return;
    await supabase.from("artikel").delete().eq("id", id);
    router.push("/");
  }

  function copyText(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!artikel) return (
    <div className="min-h-screen flex items-center justify-center" style={{ color: "#888" }}>Laden...</div>
  );

  return (
    <main className="min-h-screen max-w-2xl mx-auto pb-24">
      {/* Fotos */}
      {artikel.fotos?.length > 0 && (
        <div className="relative">
          <img src={artikel.fotos[activeFoto]} alt="" className="w-full aspect-square object-cover" />
          {artikel.fotos.length > 1 && (
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
              {artikel.fotos.map((_, i) => (
                <button key={i} onClick={() => setActiveFoto(i)}
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: i === activeFoto ? "#f59e0b" : "#ffffff88" }} />
              ))}
            </div>
          )}
          <button onClick={() => router.back()}
            className="absolute top-4 left-4 w-9 h-9 rounded-full flex items-center justify-center font-bold"
            style={{ backgroundColor: "#000000aa", color: "#fff" }}>←</button>
          {artikel.verkauft && (
            <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-bold"
              style={{ backgroundColor: "#14532d", color: "#22c55e" }}>✓ Verkauft</div>
          )}
        </div>
      )}

      <div className="px-4 py-5 space-y-4">
        {!artikel.fotos?.length && (
          <button onClick={() => router.back()} className="text-xl mb-2">←</button>
        )}

        {/* Titel & Preis */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">{artikel.bezeichnung}</h1>
            <div className="text-sm mt-1" style={{ color: "#888" }}>
              {artikel.kategorie} · {artikel.zustand}
              {artikel.box_name && ` · ${artikel.box_name}`}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-2xl font-bold" style={{ color: "#f59e0b" }}>{artikel.preis_empfehlung} €</div>
            <div className="text-xs" style={{ color: "#666" }}>{artikel.preis_min}–{artikel.preis_max} €</div>
          </div>
        </div>

        {/* Echtheit */}
        <div className="rounded-2xl p-4" style={{ backgroundColor: "#1a1a1a" }}>
          <div className="text-xs mb-1" style={{ color: "#888" }}>Echtheit</div>
          <div className="font-semibold" style={{
            color: artikel.echtheit?.includes("Gefälscht") ? "#ef4444" :
              artikel.echtheit?.includes("Echt") ? "#22c55e" : "#f59e0b"
          }}>{artikel.echtheit}</div>
        </div>

        {/* Plattformen */}
        {artikel.plattform?.length > 0 && (
          <div className="rounded-2xl p-4" style={{ backgroundColor: "#1a1a1a" }}>
            <div className="text-xs mb-2" style={{ color: "#888" }}>Empfohlene Plattformen</div>
            <div className="flex gap-2 flex-wrap">
              {artikel.plattform.map(p => (
                <span key={p} className="px-3 py-1 rounded-full text-sm font-medium"
                  style={{ backgroundColor: "#292929", color: "#f59e0b" }}>{p}</span>
              ))}
            </div>
          </div>
        )}

        {/* Verkaufstext */}
        {artikel.verkaufstext && (
          <div className="rounded-2xl p-4" style={{ backgroundColor: "#1a1a1a" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs" style={{ color: "#888" }}>Verkaufstext</div>
              <button onClick={() => copyText(artikel.verkaufstext)}
                className="text-xs px-2 py-1 rounded-lg"
                style={{ backgroundColor: "#292929", color: copied ? "#22c55e" : "#f59e0b" }}>
                {copied ? "✓ Kopiert!" : "📋 Kopieren"}
              </button>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "#ccc" }}>{artikel.verkaufstext}</p>
          </div>
        )}

        {/* Notizen */}
        <div className="rounded-2xl p-4" style={{ backgroundColor: "#1a1a1a" }}>
          <div className="text-xs mb-2" style={{ color: "#888" }}>Notizen</div>
          <textarea
            value={notizen}
            onChange={e => setNotizen(e.target.value)}
            onBlur={saveNotizen}
            placeholder="Eigene Notizen..."
            rows={3}
            className="w-full bg-transparent text-sm outline-none resize-none"
            style={{ color: "#ccc" }}
          />
        </div>

        {/* Aktionen */}
        <div className="space-y-3 pt-2">
          <button onClick={toggleVerkauft}
            className="w-full py-3 rounded-2xl font-bold"
            style={{
              backgroundColor: artikel.verkauft ? "#1a1a1a" : "#14532d",
              color: artikel.verkauft ? "#888" : "#22c55e",
              border: artikel.verkauft ? "1px solid #333" : "none",
            }}>
            {artikel.verkauft ? "Als nicht verkauft markieren" : "✓ Als verkauft markieren"}
          </button>
          <button onClick={loeschen}
            className="w-full py-3 rounded-2xl font-semibold"
            style={{ backgroundColor: "#1a0000", color: "#ef4444", border: "1px solid #450a0a" }}>
            Artikel löschen
          </button>
        </div>
      </div>
    </main>
  );
}
