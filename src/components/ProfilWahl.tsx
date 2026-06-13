"use client";
import { useState, useEffect } from "react";
import { getProfil, setProfil } from "@/lib/profil";

export default function ProfilWahl({ onProfil }: { onProfil: (name: string) => void }) {
  const [input, setInput] = useState("");
  const [profile, setProfile] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("mysterie_alle_profile");
    if (saved) setProfile(JSON.parse(saved));
  }, []);

  function waehle(name: string) {
    setProfil(name);
    onProfil(name);
  }

  function neu() {
    if (!input.trim()) return;
    const alle = [...profile.filter(p => p !== input.trim()), input.trim()];
    localStorage.setItem("mysterie_alle_profile", JSON.stringify(alle));
    setProfile(alle);
    waehle(input.trim());
    setInput("");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ backgroundColor: "#0f0f0f" }}>
      <div className="w-full max-w-sm">
        <div className="text-4xl mb-4 text-center">📦</div>
        <h1 className="text-2xl font-bold text-center mb-2 text-white">Mystery Box</h1>
        <p className="text-center mb-8 text-sm" style={{ color: "#888" }}>Wähle dein Profil</p>

        {profile.length > 0 && (
          <div className="space-y-2 mb-6">
            {profile.map(p => (
              <button key={p} onClick={() => waehle(p)}
                className="w-full py-4 rounded-2xl font-semibold text-left px-5 flex items-center gap-3"
                style={{ backgroundColor: "#1a1a1a", color: "#fff" }}>
                <span className="text-xl">👤</span>
                <span>{p}</span>
                <span className="ml-auto" style={{ color: "#f59e0b" }}>→</span>
              </button>
            ))}
          </div>
        )}

        <div className="rounded-2xl p-4" style={{ backgroundColor: "#1a1a1a" }}>
          <div className="text-sm mb-2" style={{ color: "#888" }}>
            {profile.length > 0 ? "Neues Profil anlegen" : "Wie heißt du?"}
          </div>
          <div className="flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && neu()}
              placeholder="Name eingeben..."
              className="flex-1 px-4 py-3 rounded-xl outline-none text-white"
              style={{ backgroundColor: "#2a2a2a" }}
            />
            <button onClick={neu} disabled={!input.trim()}
              className="px-4 py-3 rounded-xl font-bold text-black"
              style={{ backgroundColor: input.trim() ? "#f59e0b" : "#333", color: input.trim() ? "#000" : "#666" }}>
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
