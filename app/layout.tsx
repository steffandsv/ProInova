import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: process.env.APP_NAME || "ProInova Jaborandi",
  description: "Plataforma de inscrição, gestão e acompanhamento de projetos do ProInova.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="app-shell">
          <header className="app-header">
            <div className="brand">
              <span className="brand-dot" />
              <div>
                <div className="brand-title">{process.env.APP_NAME || "ProInova"}</div>
                <div className="brand-sub">Plataforma de projetos • transparência • entregas mensais</div>
              </div>
            </div>
            <nav className="nav">
              <a href="/">Início</a>
              <a href="/transparencia">Transparência</a>
              <a href="/cadastro">Cadastro</a>
              <a href="/login">Entrar</a>
            </nav>
          </header>
          <main className="app-main">{children}</main>
          <footer className="app-footer">© {new Date().getFullYear()} Prefeitura de Jaborandi – SP</footer>
        </div>
      </body>
    </html>
  );
}
