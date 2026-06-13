import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mystery Box Manager",
  description: "Artikel aus Mystery Boxen erfassen, bewerten und verkaufen",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="min-h-screen" style={{ backgroundColor: "#0f0f0f" }}>
        {children}
      </body>
    </html>
  );
}
