# Mystery Box Manager

Mobile-first App für Tanja Fanelli zum Verwalten von Mystery Box Artikeln.

## Besitzer & Kontext
- Entwicklerin: Tanja Fanelli (keine Programmierkenntnisse, baut mit Claude Code)
- Nutzer: Tanja (eigene Gebrauchtsachen) + Mann Mike (Mystery Boxes) — getrennte Profile
- GitHub: tanjablankenburg-ux/mysterie-boxen
- Deployed: Vercel (automatisch bei git push)

## Tech Stack
- Next.js 16 App Router, TypeScript, Tailwind CSS
- Supabase (PostgreSQL) für Datenspeicherung
- Claude API (claude-sonnet-4-6) mit Vision für Bildanalyse
- Node.js PATH immer setzen: `$env:PATH = "C:\Program Files\nodejs;$env:APPDATA\npm;$env:PATH"`

## Umgebungsvariablen (.env.local — nie in git!)
```
ANTHROPIC_API_KEY=<steht in Mysterie.txt auf dem Desktop>
NEXT_PUBLIC_SUPABASE_URL=https://kjlblvclfnmuygcaeolk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_JnG1kq58kD8hpa793IjU1g_1Er8Zcz8
```

## Supabase Tabellen
```sql
-- artikel
id, created_at, box_name, bezeichnung, kategorie, zustand, preis_min, preis_max,
preis_empfehlung, plattform text[], verkaufstext, echtheit, echtheit_begruendung,
fotos text[], verkauft boolean, annonciert boolean, notizen, neupreis integer,
neupreis_quelle text, profil text DEFAULT 'Standard'

-- boxen
id, created_at, name, einkaufspreis integer, notizen, profil text DEFAULT 'Standard'
```

## App-Funktionen
- Foto machen → Claude KI analysiert: Bezeichnung, Kategorie, Neupreis, Verkaufspreis, Echtheit, Plattformempfehlung, Verkaufstext
- Artikel-Status: Offen / Inseriert (annonciert) / Verkauft — Filter auf Startseite
- "Anzeige vorbereiten" Modal: alle Felder einzeln kopierbar + Links zu Kleinanzeigen/eBay/Vinted
- Artikel duplizieren (spart API-Kosten bei gleichen Artikeln)
- Fotos kopieren, QR-Code generieren, CSV-Export
- Boxen verwalten mit Gewinn/Verlust-Berechnung pro Box
- Multi-Profil: Auswahl per localStorage, Daten in Supabase nach profil-Spalte gefiltert

## Wichtige Dateien
- `src/app/page.tsx` — Startseite, Artikelübersicht, Filter
- `src/app/neu/page.tsx` — Neuer Artikel + KI-Analyse mit Bildkomprimierung
- `src/app/artikel/[id]/page.tsx` — Artikel-Detail, alle Aktionen inkl. Anzeige vorbereiten
- `src/app/boxen/page.tsx` — Boxen-Übersicht + CSV-Export
- `src/app/api/analyse/route.ts` — Claude Vision API Route
- `src/lib/profil.ts` — Profil-Verwaltung via localStorage
- `src/components/ProfilWahl.tsx` — Profil-Auswahl Screen

## Wichtige Eigenheiten
- Bilder werden client-seitig komprimiert (800px, JPEG 0.7) vor KI-Analyse — spart Kosten und verhindert Timeouts
- Echtheitsprüfung ist konservativ — bei Unsicherheit immer "Nicht sicher erkennbar"
- KI-Zustand wird NICHT überschrieben — Nutzereingabe hat immer Vorrang
- ANTHROPIC_API_KEY niemals im Chat erwähnen, teilen oder in git committen
