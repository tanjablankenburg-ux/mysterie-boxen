"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
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
  fotos: string[];
  box_name: string;
  created_at: string;
};

export default function Home() {
  const [profil, setProfil_] = useState<string>("");
  const [showProfilWahl, setShowProfilWahl] = useState(false);
  const [artikel, setArtikel] = useState<Artikel[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"alle" | "offen" | "inseriert" | "verkauft">("alle");

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

  function wechsleProfil() {
    setShowProfilWahl(true);
  }

  if (!profil || showProfilWahl) {
    return <ProfilWahl onProfil={(name) => { setShowProfilWahl(false); handleProfil(name); }} />;
  }

  const filtered = artikel.filter(a => {
    if (filter === "alle") return true;
    if (filter === "verkauft") return a.verkauft;
    if (filter === "inseriert") return (a as Record<string, unknown>).annonciert && !a.verkauft;
    return !a.verkauft && !(a as Record<string, unknown>).annonciert;
  });

  const gesamtwert = artikel.filter(a => !a.verkauft).reduce((s, a) => s + (a.preis_empfehlung || 0), 0);
  const verkauftWert = artikel.filter(a => a.verkauft).reduce((s, a) => s + (a.preis_empfehlung || 0), 0);

  return (
    <main className="min-h-screen px-4 py-6 pb-24 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">📦 Mystery Box</h1>
          <button onClick={wechsleProfil} className="text-sm flex items-center gap-1 mt-0.5"
            style={{ color: "#f59e0b" }}>
            👤 {profil} <span style={{ color: "#666" }}>wechseln</span>
          </button>
        </div>
        <div className="flex gap-2">
          <Link href="/boxen"
            className="px-3 py-2 rounded-xl font-semibold text-sm"
            style={{ backgroundColor: "#1a1a1a", color: "#f59e0b", border: "1px solid #333" }}>
            Boxen
          </Link>
          <Link href={`/neu?profil=${encodeURIComponent(profil)}`}
            className="px-4 py-2 rounded-xl font-semibold text-sm text-black"
            style={{ backgroundColor: "#f59e0b" }}>
            + Neu
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
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

      {/* Artikel Liste */}
      {loading ? (
        <div className="text-center py-12" style={{ color: "#888" }}>Laden...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">📦</div>
          <p style={{ color: "#888" }}>Noch keine Artikel. Füge deinen ersten hinzu!</p>
          <Link href={`/neu?profil=${encodeURIComponent(profil)}`}
            className="inline-block mt-4 px-6 py-3 rounded-xl font-semibold text-black"
            style={{ backgroundColor: "#f59e0b" }}>
            Ersten Artikel erfassen
          </Link>
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
                  ) : (a as Record<string, unknown>).annonciert ? (
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
