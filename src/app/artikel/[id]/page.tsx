"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import QRCode from "qrcode";
import { supabase } from "@/lib/supabase";

type Artikel = {
  id: string;
  bezeichnung: string;
  kategorie: string;
  zustand: string;
  preis_min: number;
  preis_max: number;
  preis_empfehlung: number;
  neupreis: number;
  neupreis_quelle: string;
  plattform: string[];
  verkaufstext: string;
  echtheit: string;
  echtheit_begruendung: string;
  fotos: string[];
  verkauft: boolean;
  annonciert: boolean;
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
  const [qrUrl, setQrUrl] = useState("");

  useEffect(() => {
    supabase.from("artikel").select("*").eq("id", id).single()
      .then(({ data }) => {
        if (data) {
          setArtikel(data);
          setNotizen(data.notizen || "");
          const url = `${window.location.origin}/artikel/${data.id}`;
          QRCode.toDataURL(url, { width: 200 }).then(setQrUrl);
        }
      });
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

  async function toggleAnnonciert() {
    if (!artikel) return;
    await supabase.from("artikel").update({ annonciert: !artikel.annonciert }).eq("id", id);
    setArtikel({ ...artikel, annonciert: !artikel.annonciert });
  }

  async function duplizieren() {
    if (!artikel) return;
    const { id: _, created_at: __, ...rest } = artikel as Record<string, unknown>;
    const { data } = await supabase.from("artikel").insert({ ...rest, verkauft: false }).select().single();
    if (data) router.push(`/artikel/${data.id}`);
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
          {/* Scrollbare Foto-Leiste */}
          <div className="flex overflow-x-auto snap-x snap-mandatory" style={{ scrollbarWidth: "none" }}>
            {artikel.fotos.map((foto, i) => (
              <div key={i} className="flex-shrink-0 w-full snap-center relative">
                <img src={foto} alt="" className="w-full aspect-square object-cover" />
                {/* Kopieren Button */}
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch(foto);
                      const blob = await res.blob();
                      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    } catch {
                      // Fallback: URL kopieren
                      navigator.clipboard.writeText(foto);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }
                  }}
                  className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl text-xs font-semibold"
                  style={{ backgroundColor: copied ? "#22c55e" : "#000000cc", color: "#fff" }}
                >
                  {copied ? "✓ Kopiert!" : "📋 Foto kopieren"}
                </button>
              </div>
            ))}
          </div>
          {artikel.fotos.length > 1 && (
            <div className="absolute bottom-12 left-0 right-0 flex justify-center gap-2 pointer-events-none">
              {artikel.fotos.map((_, i) => (
                <div key={i}
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: i === activeFoto ? "#f59e0b" : "#ffffff88" }} />
              ))}
            </div>
          )}
          <button onClick={() => router.back()}
            className="absolute top-4 left-4 w-9 h-9 rounded-full flex items-center justify-center font-bold"
            style={{ backgroundColor: "#000000aa", color: "#fff" }}>←</button>
          <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
            {artikel.verkauft && (
              <div className="px-3 py-1 rounded-full text-sm font-bold"
                style={{ backgroundColor: "#14532d", color: "#22c55e" }}>✓ Verkauft</div>
            )}
            {artikel.annonciert && !artikel.verkauft && (
              <div className="px-3 py-1 rounded-full text-sm font-bold"
                style={{ backgroundColor: "#1e3a5f", color: "#60a5fa" }}>📢 Inseriert</div>
            )}
          </div>
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

        {/* Neupreis */}
        {artikel.neupreis > 0 && (
          <div className="rounded-2xl p-4" style={{ backgroundColor: "#1a1a1a" }}>
            <div className="text-xs mb-1" style={{ color: "#888" }}>Neupreis im Handel</div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold" style={{ color: "#60a5fa" }}>{artikel.neupreis} €</span>
              {artikel.neupreis_quelle && (
                <span className="text-xs" style={{ color: "#666" }}>bei {artikel.neupreis_quelle}</span>
              )}
            </div>
            {artikel.preis_empfehlung > 0 && (
              <div className="text-xs mt-1" style={{ color: "#888" }}>
                Du verkaufst für {artikel.preis_empfehlung} € = {Math.round((artikel.preis_empfehlung / artikel.neupreis) * 100)}% vom Neupreis
              </div>
            )}
          </div>
        )}

        {/* Echtheit */}
        <div className="rounded-2xl p-4" style={{ backgroundColor: "#1a1a1a" }}>
          <div className="text-xs mb-1" style={{ color: "#888" }}>Echtheit</div>
          <div className="font-semibold" style={{
            color: artikel.echtheit?.includes("Gefälscht") ? "#ef4444" :
              artikel.echtheit?.includes("Echt") ? "#22c55e" : "#f59e0b"
          }}>{artikel.echtheit}</div>
            {artikel.echtheit_begruendung && (
              <div className="text-sm mt-1 leading-relaxed" style={{ color: "#aaa" }}>{artikel.echtheit_begruendung}</div>
            )}
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

        {/* QR Code */}
        {qrUrl && (
          <div className="rounded-2xl p-4 text-center" style={{ backgroundColor: "#1a1a1a" }}>
            <div className="text-xs mb-3" style={{ color: "#888" }}>QR-Code — zum Aufkleben auf den Artikel</div>
            <img src={qrUrl} alt="QR Code" className="mx-auto rounded-xl" style={{ width: 120, imageRendering: "pixelated" }} />
            <a href={qrUrl} download={`qr-${artikel.id}.png`}
              className="inline-block mt-3 text-xs px-3 py-1.5 rounded-lg"
              style={{ backgroundColor: "#292929", color: "#f59e0b" }}>
              📥 QR-Code speichern
            </a>
          </div>
        )}

        {/* Aktionen */}
        <div className="space-y-3 pt-2">
          <button onClick={duplizieren}
            className="w-full py-3 rounded-2xl font-semibold"
            style={{ backgroundColor: "#1a1a1a", color: "#f59e0b", border: "1px solid #333" }}>
            📋 Artikel duplizieren
          </button>
          <button onClick={toggleAnnonciert}
            className="w-full py-3 rounded-2xl font-bold"
            style={{
              backgroundColor: artikel.annonciert ? "#1c1917" : "#172554",
              color: artikel.annonciert ? "#a8a29e" : "#60a5fa",
              border: artikel.annonciert ? "1px solid #333" : "none",
            }}>
            {artikel.annonciert ? "📢 Inserat entfernen" : "📢 Als inseriert markieren"}
          </button>
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
