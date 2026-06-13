"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Box = {
  id: string;
  name: string;
  einkaufspreis: number;
  notizen: string;
  created_at: string;
  artikel_count?: number;
  verkaufswert?: number;
};

export default function BoxenPage() {
  const router = useRouter();
  const [boxen, setBoxen] = useState<Box[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBoxen();
  }, []);

  async function loadBoxen() {
    const { data: boxData } = await supabase.from("boxen").select("*").order("created_at", { ascending: false });
    const { data: artikelData } = await supabase.from("artikel").select("box_name, preis_empfehlung, verkauft");

    const enriched = (boxData || []).map((box: Box) => {
      const artikel = (artikelData || []).filter(a => a.box_name === box.name);
      return {
        ...box,
        artikel_count: artikel.length,
        verkaufswert: artikel.reduce((s: number, a: {preis_empfehlung: number}) => s + (a.preis_empfehlung || 0), 0),
      };
    });
    setBoxen(enriched);
    setLoading(false);
  }

  function exportCSV() {
    supabase.from("artikel").select("*").then(({ data }) => {
      if (!data?.length) return;
      const headers = ["Bezeichnung", "Kategorie", "Zustand", "Neupreis", "Preis Min", "Preis Max", "Empfehlung", "Plattform", "Echtheit", "Box", "Verkauft", "Verkaufstext"];
      const rows = data.map(a => [
        a.bezeichnung, a.kategorie, a.zustand, a.neupreis, a.preis_min, a.preis_max,
        a.preis_empfehlung, (a.plattform || []).join("|"), a.echtheit, a.box_name,
        a.verkauft ? "Ja" : "Nein", `"${(a.verkaufstext || "").replace(/"/g, "'")}"`
      ]);
      const csv = [headers, ...rows].map(r => r.join(";")).join("\n");
      const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "mystery-boxen-export.csv"; a.click();
    });
  }

  return (
    <main className="min-h-screen px-4 py-6 max-w-2xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={() => router.push("/")} className="text-xl mb-1">←</button>
          <h1 className="text-xl font-bold">📦 Meine Boxen</h1>
        </div>
        <Link href="/boxen/neu"
          className="px-4 py-2 rounded-xl font-semibold text-sm text-black"
          style={{ backgroundColor: "#f59e0b" }}>
          + Box
        </Link>
      </div>

      <button onClick={exportCSV}
        className="w-full py-3 rounded-xl mb-6 text-sm font-semibold"
        style={{ backgroundColor: "#1a1a1a", color: "#f59e0b", border: "1px solid #333" }}>
        📥 Alle Artikel als CSV exportieren
      </button>

      {loading ? (
        <div className="text-center py-12" style={{ color: "#888" }}>Laden...</div>
      ) : boxen.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">📦</div>
          <p style={{ color: "#888" }}>Noch keine Boxen angelegt.</p>
          <Link href="/boxen/neu" className="inline-block mt-4 px-6 py-3 rounded-xl font-semibold text-black"
            style={{ backgroundColor: "#f59e0b" }}>
            Erste Box anlegen
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {boxen.map(box => {
            const gewinn = (box.verkaufswert || 0) - (box.einkaufspreis || 0);
            return (
              <div key={box.id} className="rounded-2xl p-4" style={{ backgroundColor: "#1a1a1a" }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-bold">{box.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: "#888" }}>{box.artikel_count} Artikel</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm" style={{ color: "#888" }}>Einkauf: {box.einkaufspreis} €</div>
                    <div className="text-sm" style={{ color: "#888" }}>Warenwert: {box.verkaufswert} €</div>
                    <div className="font-bold mt-1" style={{ color: gewinn >= 0 ? "#22c55e" : "#ef4444" }}>
                      {gewinn >= 0 ? "+" : ""}{gewinn} € Gewinn
                    </div>
                  </div>
                </div>
                {box.notizen && (
                  <div className="text-xs" style={{ color: "#666" }}>{box.notizen}</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
