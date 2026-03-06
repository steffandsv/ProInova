import type { Metadata } from "next";
import "./globals.css";
import AppHeader from "./AppHeader";

export const metadata: Metadata = {
  title: process.env.APP_NAME || "ProInova Jaborandi",
  description: "Plataforma de inscrição, gestão e acompanhamento de projetos do ProInova.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="app-shell">
          <AppHeader />
          <main className="app-main">{children}</main>
          <footer className="app-footer">© {new Date().getFullYear()} Prefeitura de Jaborandi – SP</footer>
        </div>
      </body>
    </html>
  );
}
