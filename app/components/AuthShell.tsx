import type { ReactNode } from "react";

/* Moldura das telas de entrada e cadastro: apresentação do programa à esquerda, formulário à direita */
export default function AuthShell({ asideTitle, children }: { asideTitle: string; children: ReactNode }) {
  return (
    <div className="auth-shell">
      <aside className="auth-aside">
        <div className="auth-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brasao.png" alt="Brasão de Jaborandi" width={52} height={52} />
          <div>
            <div className="auth-brand-title">ProInova Jaborandi</div>
            <div className="auth-brand-sub">Programa Municipal de Fomento à Inovação</div>
          </div>
        </div>

        <h2 className="auth-aside-title">{asideTitle}</h2>

        <ul className="auth-points">
          <li>
            <span aria-hidden>📥</span>
            <span>Inscreva seu projeto e acompanhe cada etapa da avaliação.</span>
          </li>
          <li>
            <span aria-hidden>📅</span>
            <span>Envie as entregas mensais e receba a bolsa por marco cumprido.</span>
          </li>
          <li>
            <span aria-hidden>🔎</span>
            <span>Tudo com transparência, conforme a Lei Municipal do ProInova.</span>
          </li>
        </ul>

        <a href="/LEI.pdf" target="_blank" rel="noopener noreferrer" className="auth-lei">
          Ler a Lei do ProInova →
        </a>
      </aside>

      <section className="auth-panel">{children}</section>
    </div>
  );
}
