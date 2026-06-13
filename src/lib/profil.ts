export const PROFIL_KEY = "mysterie_profil";

export function getProfil(): string {
  if (typeof window === "undefined") return "Standard";
  return localStorage.getItem(PROFIL_KEY) || "";
}

export function setProfil(name: string) {
  localStorage.setItem(PROFIL_KEY, name);
}
