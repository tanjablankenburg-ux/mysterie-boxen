"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getProfil, setProfil } from "@/lib/profil";
import ProfilWahl from "@/components/ProfilWahl";

type Artikel = {
  id: string;
  bezeichnung: string;
  kategorie: string;
  zustand: string;
  preis_empfehlung: number;
  verkauft: boolean;
  annonciert: boolean;
  fotos: string[];
  box_name: string;
  created_at: string;
};

export default function Home() {
  const router = useRouter();
  const [profil, setProfil_] = useState<string>("");
  const [showProfilWahl, setShowProfilWahl] = useState(false);
  const [artikel, setArtikel] = useState<Artikel[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"alle" | "offen" | "inseriert" | "verkauft">("alle");
  const [suche, setSuche] = useState("");
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const p = getProfil();
    if (!p) { setLoading(false); return; }
    setProfil_(p);
    loadArtikel(p);
  }, []);

  async function loadArtikel(p: string) {
    setLoading(true);
    const { data } = await supabase
      .from("artikel")
      .select("*")
      .eq("profil", p)
      .order("created_at", { ascending: false });
    setArtikel(data || []);
    setLoading(false);
  }

  function handleProfil(name: string) {
    setProfil_(name);
    setProfil(name);
    loadArtikel(name);
  }

  async function startScan() {
    setScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;

      const { BrowserQRCodeReader } = await import("@zxing/browser");
      const reader = new BrowserQRCodeReader();
      const result = await reader.decodeOnceFromVideoDevice(undefined, videoRef.current!);
      stopScan();

      // QR code enthält z.B. https://.../artikel/abc123
      const url = result.getText();
      const id = url.split("/artikel/")[1];
      if (id) router.push(`/artikel/${id}`);
    } catch {
      stopScan();
    }
  }

  function stopScan() {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setScanning(false);
  }

  if (!profil || showProfilWahl) {
    return <ProfilWahl onProfil={(name) => { setShowProfilWahl(false); handleProfil(name); }} />;
  }

  const filtered = artikel.filter(a => {
    const matchFilter = filter === "alle" ? true
      : filter === "verkauft" ? a.verkauft
      : filter === "inseriert" ? a.annonciert && !a.verkauft
      : !a.verkauft && !a.annonciert;

    const matchSuche = suche.trim() === "" ? true
      : [a.bezeichnung, a.kategorie, a.box_name, a.zustand]
          .some(s => s?.toLowerCase().includes(suche.toLowerCase()));

    return matchFilter && matchSuche;
  });

  const gesamtwert = artikel.filter(a => !a.verkauft).reduce((s, a) => s + (a.preis_empfehlung || 0), 0);
  const verkauftWert = artikel.filter(a => a.verkauft).reduce((s, a) => s + (a.preis_empfehlung || 0), 0);

  return (
    <main className="min-h-screen px-4 py-6 pb-24 max-w-2xl mx-auto">
      {/* QR Scanner Modal */}
      {scanning && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: "#000" }}>
          <div className="flex items-center justify-between px-4 py-4">
            <span className="text-white font-semibold">QR-Code scannen</span>
            <button onClick={stopScan} className="text-white text-2xl">✕</button>
          </div>
          <div className="flex-1 relative">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-56 h-56 border-4 rounded-2xl" style={{ borderColor: "#f59e0b" }} />
            </div>
          </div>
          <div className="px-4 py-6 text-center" style={{ color: "#888" }}>
            Halte die Kamera auf den QR-Code des Artikels
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">📦 Mystery Box</h1>
          <button onClick={() => setShowProfilWahl(true)} className="text-sm flex items-center gap-1 mt-0.5"
            style={{ color: "#f59e0b" }}>
            👤 {profil} <span style={{ color: "#666" }}>wechseln</span>
          </button>
        </div>
        <div className="flex gap-2">
          <button onClick={startScan}
            className="px-3 py-2 rounded-xl font-semibold text-sm"
            style={{ backgroundColor: "#1a1a1a", color: "#f59e0b", border: "1px solid #333" }}>
            📷 Scan
          </button>
          <Link href="/boxen"
            className="px-3 py-2 rounded-xl font-semibold text-sm"
            style={{ backgroundColor: "#1a1a1a", color: "#f59e0b", border: "1px solid #333" }}>
            Boxen
          </Link>
          <Link href="/neu"
            className="px-4 py-2 rounded-xl font-semibold text-sm text-black"
            style={{ backgroundColor: "#f59e0b" }}>
            + Neu
          </Link>
        </div>
      </div>

      {/* Suche */}
      <div className="mb-4 relative">
        <input
          value={suche}
          onChange={e => setSuche(e.target.value)}
          placeholder="🔍 Suchen nach Artikel, Kategorie, Box..."
          className="w-full px-4 py-3 rounded-xl text-white outline-none text-sm"
          style={{ backgroundColor: "#1a1a1a", border: suche ? "1px solid #f59e0b" : "1px solid #333" }}
        />
        {suche && (
          <button onClick={() => setSuche("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-lg"
            style={{ color: "#666" }}>✕</button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-2xl p-4" style={{ backgroundColor: "#1a1a1a" }}>
          <div className="text-xs mb-1" style={{ color: "#888" }}>Lagerbestand</div>
          <div className="text-xl font-bold" style={{ color: "#f59e0b" }}>{gesamtwert} €</div>
          <div className="text-xs" style={{ color: "#888" }}>{artikel.filter(a => !a.verkauft).length} Artikel</div>
        </div>
        <div className="rounded-2xl p-4" style={{ backgroundColor: "#1a1a1a" }}>
          <div className="text-xs mb-1" style={{ color: "#888" }}>Verkauft</div>
          <div className="text-xl font-bold" style={{ color: "#22c55e" }}>{verkauftWert} €</div>
          <div className="text-xs" style={{ color: "#888" }}>{artikel.filter(a => a.verkauft).length} Artikel</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {(["alle", "offen", "inseriert", "verkauft"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-full text-sm font-medium capitalize"
            style={{
              backgroundColor: filter === f ? "#f59e0b" : "#1a1a1a",
              color: filter === f ? "#000" : "#888",
            }}>
            {f}
          </button>
        ))}
      </div>

      {/* Ergebnis-Anzahl bei Suche */}
      {suche && (
        <div className="text-xs mb-3" style={{ color: "#888" }}>
          {filtered.length} Ergebnis{filtered.length !== 1 ? "se" : ""} für „{suche}"
        </div>
      )}

      {/* Artikel Liste */}
      {loading ? (
        <div className="text-center py-12" style={{ color: "#888" }}>Laden...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">{suche ? "🔍" : "📦"}</div>
          <p style={{ color: "#888" }}>
            {suche ? `Kein Artikel gefunden für „${suche}"` : "Noch keine Artikel. Füge deinen ersten hinzu!"}
          </p>
          {!suche && (
            <Link href="/neu"
              className="inline-block mt-4 px-6 py-3 rounded-xl font-semibold text-black"
              style={{ backgroundColor: "#f59e0b" }}>
              Ersten Artikel erfassen
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(a => (
            <Link key={a.id} href={`/artikel/${a.id}`}>
              <div className="rounded-2xl p-4 flex gap-3 items-center" style={{ backgroundColor: "#1a1a1a" }}>
                {a.fotos?.[0] ? (
                  <img src={a.fotos[0]} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl"
                    style={{ backgroundColor: "#2a2a2a" }}>📷</div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{a.bezeichnung || "Unbekannt"}</div>
                  <div className="text-xs mt-0.5" style={{ color: "#888" }}>
                    {a.kategorie} · {a.zustand}
                  </div>
                  {a.box_name && (
                    <div className="text-xs mt-0.5" style={{ color: "#666" }}>Box: {a.box_name}</div>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-bold" style={{ color: "#f59e0b" }}>
                    {a.preis_empfehlung ? `${a.preis_empfehlung} €` : "–"}
                  </div>
                  {a.verkauft ? (
                    <div className="text-xs mt-1 px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: "#14532d", color: "#22c55e" }}>
                      Verkauft
                    </div>
                  ) : a.annonciert ? (
                    <div className="text-xs mt-1 px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: "#1e3a5f", color: "#60a5fa" }}>
                      Inseriert
                    </div>
                  ) : null}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
