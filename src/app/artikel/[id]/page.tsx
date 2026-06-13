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
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showInserat, setShowInserat] = useState(false);
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

  function copyField(text: string, field: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
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
            <div className="flex gap-2 flex-wrap mb-3">
              {artikel.plattform.map(p => (
                <span key={p} className="px-3 py-1 rounded-full text-sm font-medium"
                  style={{ backgroundColor: "#292929", color: "#f59e0b" }}>{p}</span>
              ))}
            </div>
            <button onClick={() => setShowInserat(true)}
              className="w-full py-3 rounded-xl text-sm font-bold"
              style={{ backgroundColor: "#f59e0b", color: "#000" }}>
              📋 Anzeige vorbereiten
            </button>
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
      {/* Anzeige vorbereiten Modal */}
      {showInserat && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: "#0f0f0f" }}>
          <div className="flex items-center gap-3 px-4 py-5 border-b" style={{ borderColor: "#222" }}>
            <button onClick={() => setShowInserat(false)} className="text-xl">←</button>
            <h2 className="text-lg font-bold">Anzeige vorbereiten</h2>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-10">
            <p className="text-sm" style={{ color: "#888" }}>
              Öffne eBay / Kleinanzeigen / Vinted im Browser, dann kopiere Feld für Feld hier raus und füge es ein.
            </p>

            {[
              { label: "Titel", value: artikel.bezeichnung, field: "titel" },
              { label: "Preis (€)", value: String(artikel.preis_empfehlung), field: "preis" },
              { label: "Zustand", value: artikel.zustand, field: "zustand" },
              { label: "Kategorie", value: artikel.kategorie, field: "kategorie" },
            ].map(({ label, value, field }) => (
              <div key={field} className="rounded-2xl p-4" style={{ backgroundColor: "#1a1a1a" }}>
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs font-medium" style={{ color: "#888" }}>{label}</div>
                  <button onClick={() => copyField(value, field)}
                    className="text-xs px-3 py-1 rounded-lg font-semibold"
                    style={{
                      backgroundColor: copiedField === field ? "#14532d" : "#292929",
                      color: copiedField === field ? "#22c55e" : "#f59e0b"
                    }}>
                    {copiedField === field ? "✓ Kopiert!" : "Kopieren"}
                  </button>
                </div>
                <div className="font-semibold">{value}</div>
              </div>
            ))}

            <div className="rounded-2xl p-4" style={{ backgroundColor: "#1a1a1a" }}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-medium" style={{ color: "#888" }}>Beschreibung (kurz)</div>
                <button onClick={() => copyField(artikel.verkaufstext?.slice(0, 300) || "", "kurz")}
                  className="text-xs px-3 py-1 rounded-lg font-semibold"
                  style={{
                    backgroundColor: copiedField === "kurz" ? "#14532d" : "#292929",
                    color: copiedField === "kurz" ? "#22c55e" : "#f59e0b"
                  }}>
                  {copiedField === "kurz" ? "✓ Kopiert!" : "Kopieren"}
                </button>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "#ccc" }}>{artikel.verkaufstext?.slice(0, 300)}</p>
            </div>

            <div className="rounded-2xl p-4" style={{ backgroundColor: "#1a1a1a" }}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-medium" style={{ color: "#888" }}>Beschreibung (lang, für eBay)</div>
                <button onClick={() => copyField(artikel.verkaufstext || "", "lang")}
                  className="text-xs px-3 py-1 rounded-lg font-semibold"
                  style={{
                    backgroundColor: copiedField === "lang" ? "#14532d" : "#292929",
                    color: copiedField === "lang" ? "#22c55e" : "#f59e0b"
                  }}>
                  {copiedField === "lang" ? "✓ Kopiert!" : "Kopieren"}
                </button>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "#ccc" }}>{artikel.verkaufstext}</p>
            </div>

            {artikel.fotos?.length > 0 && (
              <div className="rounded-2xl p-4" style={{ backgroundColor: "#1a1a1a" }}>
                <div className="text-xs font-medium mb-3" style={{ color: "#888" }}>Fotos</div>
                <div className="grid grid-cols-3 gap-2">
                  {artikel.fotos.map((foto, i) => (
                    <div key={i} className="relative">
                      <img src={foto} alt="" className="w-full aspect-square object-cover rounded-xl" />
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch(foto);
                            const blob = await res.blob();
                            await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
                            setCopiedField(`foto-${i}`);
                            setTimeout(() => setCopiedField(null), 2000);
                          } catch {
                            setCopiedField(`foto-${i}`);
                            setTimeout(() => setCopiedField(null), 2000);
                          }
                        }}
                        className="absolute bottom-1 right-1 text-xs px-2 py-1 rounded-lg font-semibold"
                        style={{
                          backgroundColor: copiedField === `foto-${i}` ? "#14532d" : "#000000cc",
                          color: copiedField === `foto-${i}` ? "#22c55e" : "#fff"
                        }}>
                        {copiedField === `foto-${i}` ? "✓" : "📋"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              {artikel.plattform?.some(p => p.toLowerCase().includes("kleinanzeigen")) && (
                <a href="https://www.kleinanzeigen.de/anzeige-aufgeben" target="_blank" rel="noreferrer"
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-center"
                  style={{ backgroundColor: "#1a2e1a", color: "#4ade80", border: "1px solid #166534" }}>
                  Kleinanzeigen öffnen →
                </a>
              )}
              {artikel.plattform?.some(p => p.toLowerCase().includes("ebay")) && (
                <a href="https://www.ebay.de/sell" target="_blank" rel="noreferrer"
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-center"
                  style={{ backgroundColor: "#1a1a2e", color: "#818cf8", border: "1px solid #3730a3" }}>
                  eBay öffnen →
                </a>
              )}
              {artikel.plattform?.some(p => p.toLowerCase().includes("vinted")) && (
                <a href="https://www.vinted.de/items/new" target="_blank" rel="noreferrer"
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-center"
                  style={{ backgroundColor: "#0d1f1a", color: "#34d399", border: "1px solid #065f46" }}>
                  Vinted öffnen →
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
