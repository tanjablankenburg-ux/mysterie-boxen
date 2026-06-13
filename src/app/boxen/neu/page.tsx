"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getProfil } from "@/lib/profil";

export default function NeueBoxPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [preis, setPreis] = useState("");
  const [notizen, setNotizen] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSpeichern() {
    if (!name) return;
    setSaving(true);
    await supabase.from("boxen").insert({
      name,
      einkaufspreis: parseInt(preis) || 0,
      notizen,
      profil: getProfil() || "Standard",
    });
    router.push("/boxen");
  }

  return (
    <main className="min-h-screen px-4 py-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-xl">←</button>
        <h1 className="text-xl font-bold">Neue Box anlegen</h1>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block" style={{ color: "#888" }}>Box-Name *</label>
          <input value={name} onChange={e => setName(e.target.value)}
            placeholder="z.B. Amazon Box Juni 2024"
            className="w-full px-4 py-3 rounded-xl text-white outline-none"
            style={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }} />
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block" style={{ color: "#888" }}>Einkaufspreis (€)</label>
          <input value={preis} onChange={e => setPreis(e.target.value)}
            type="number" placeholder="0"
            className="w-full px-4 py-3 rounded-xl text-white outline-none"
            style={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }} />
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block" style={{ color: "#888" }}>Notizen</label>
          <textarea value={notizen} onChange={e => setNotizen(e.target.value)}
            placeholder="Woher, wann, besondere Hinweise..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl text-white outline-none resize-none"
            style={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }} />
        </div>

        <button onClick={handleSpeichern} disabled={!name || saving}
          className="w-full py-4 rounded-2xl font-bold text-black mt-4"
          style={{ backgroundColor: name ? "#f59e0b" : "#333", color: name ? "#000" : "#666" }}>
          {saving ? "Speichert..." : "📦 Box speichern"}
        </button>
      </div>
    </main>
  );
}
