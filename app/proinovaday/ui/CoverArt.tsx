import { CATEGORIA_COR } from "@/constants/proinovaday";
import type { StartupCard } from "@/lib/proinovaday-types";
import { hash01 } from "./hooks";
import { IconCategoria } from "./Icons";

const IGNORAR = new Set(["de", "da", "do", "das", "dos", "e", "o", "a", "the"]);

export function iniciais(nome: string): string {
  const partes = nome.replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter((p) => p && !IGNORAR.has(p.toLowerCase()));
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[1][0]).toUpperCase();
}

/** Capa da startup: a foto enviada ou uma arte generativa única (cores da categoria + sonar + monograma). */
export default function CoverArt({ s, flipId }: { s: Pick<StartupCard, "id" | "nome" | "categoria" | "fotoUrl">; flipId?: string }) {
  const [c1, c2] = CATEGORIA_COR[s.categoria] || CATEGORIA_COR.Outro;
  const h1 = hash01(s.id || s.nome);
  const h2 = hash01(s.id || s.nome, 7);
  const cx = 70 + h2 * 260;
  const cy = 40 + h1 * 140;
  const estilo = { "--c1": c1, "--c2": c2, "--ang": `${Math.round(h1 * 360)}deg` } as React.CSSProperties;

  return (
    <div className="st-cover" style={estilo} data-flip-id={flipId}>
      {s.fotoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="st-cover-img" src={s.fotoUrl} alt="" loading="lazy" decoding="async" />
      ) : (
        <>
          <svg className="st-cover-sonar" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" aria-hidden>
            {[24, 52, 84, 120, 160, 205, 255].map((r, i) => (
              <circle key={r} cx={cx} cy={cy} r={r} style={{ animationDelay: `${i * -0.6}s` }} />
            ))}
            <line x1={cx} y1={cy} x2={cx + 300} y2={cy - 120} className="st-cover-sweep" />
          </svg>
          <span className="st-cover-mono">{iniciais(s.nome)}</span>
          <IconCategoria categoria={s.categoria} size={44} className="st-cover-icon" strokeWidth={1.4} />
        </>
      )}
      <span className="st-cover-shade" aria-hidden />
    </div>
  );
}
