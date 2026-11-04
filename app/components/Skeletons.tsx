import type { CSSProperties } from "react";

/* Skeletons no padrão da lista de propostas do admin (classes .skeleton-* do globals.css) */

export function SkeletonLine({ width = "100%", height = 16, radius = 4, style }: { width?: number | string; height?: number; radius?: number; style?: CSSProperties }) {
  return <div className="skeleton-line" style={{ width, height, borderRadius: radius, ...style }} />;
}

export type SkeletonCell = "short" | "text" | "two" | "text-tag" | "meta" | "badge" | "button";

export type SkeletonColumn = {
  label: string;
  width?: string;
  align?: "left" | "right" | "center";
  cell?: SkeletonCell;
};

function Cell({ kind }: { kind: SkeletonCell }) {
  switch (kind) {
    case "short":
      return <SkeletonLine width={60} />;
    case "two":
      return (
        <>
          <SkeletonLine width={140} style={{ marginBottom: 6 }} />
          <SkeletonLine width={90} height={12} />
        </>
      );
    case "text-tag":
      return (
        <>
          <SkeletonLine width={160} style={{ marginBottom: 6 }} />
          <SkeletonLine width={80} radius={8} />
        </>
      );
    case "meta":
      return (
        <>
          <SkeletonLine width={110} height={14} style={{ marginBottom: 6 }} />
          <SkeletonLine width={80} height={14} />
        </>
      );
    case "badge":
      return <div className="skeleton-line skeleton-badge" style={{ width: 90, height: 24, borderRadius: 6 }} />;
    case "button":
      return <div className="skeleton-line skeleton-button" style={{ width: 110, height: 30, borderRadius: 8, display: "inline-block" }} />;
    default:
      return <SkeletonLine width={160} />;
  }
}

/** Tabela com o cabeçalho real e linhas de carregamento. */
export function TableSkeleton({ columns, rows = 5 }: { columns: SkeletonColumn[]; rows?: number }) {
  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.label} style={{ width: c.width, textAlign: c.align }}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, r) => (
            <tr key={r}>
              {columns.map((c) => (
                <td key={c.label} className="data-table-skeleton-cell" style={{ textAlign: c.align }}>
                  <Cell kind={c.cell ?? "text"} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Página de lista: título, chips de filtro, busca e tabela. Usado como fallback do Suspense. */
export function ListPageSkeleton({ columns, chips = 4 }: { columns: SkeletonColumn[]; chips?: number }) {
  return (
    <div className="grid wide-layout" style={{ gap: 14 }}>
      <div className="card">
        <div className="skeleton-line skeleton-title" style={{ width: "38%", marginBottom: 22 }} />
        {chips > 0 && (
          <div className="filter-chips" style={{ marginBottom: 18 }}>
            {Array.from({ length: chips }, (_, i) => (
              <div key={i} className="skeleton-line" style={{ width: 96, height: 30, borderRadius: 10 }} />
            ))}
          </div>
        )}
        <div className="skeleton-line" style={{ height: 44, borderRadius: 14, marginBottom: 24 }} />
        <TableSkeleton columns={columns} />
      </div>
    </div>
  );
}

/** Números de destaque (ex.: totais de pagamento). */
export function StatsSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="stats-grid">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="card stat-card">
          <SkeletonLine width={110} height={34} radius={8} style={{ margin: "0 auto 10px" }} />
          <SkeletonLine width={150} height={14} style={{ margin: "0 auto" }} />
        </div>
      ))}
    </div>
  );
}

/** Grade de cards (ex.: propostas do painel). */
export function CardsSkeleton({ count = 3, single = false }: { count?: number; single?: boolean }) {
  return (
    <div className={`cards-skeleton${single ? " single" : ""}`}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="card">
          <div className="skeleton-line skeleton-badge" style={{ marginBottom: 14 }} />
          <SkeletonLine width="80%" height={20} style={{ marginBottom: 10 }} />
          <SkeletonLine width="55%" height={14} style={{ marginBottom: 18 }} />
          <div className="skeleton-line skeleton-button" />
        </div>
      ))}
    </div>
  );
}

/** Página de detalhe: título, badges e blocos de conteúdo. */
export function DetailSkeleton({ sections = 3, wide = false }: { sections?: number; wide?: boolean }) {
  return (
    <div className={`grid${wide ? " wide-layout" : ""}`} style={{ gap: 14 }}>
      <div className="card">
        <SkeletonLine width={120} height={14} style={{ marginBottom: 14 }} />
        <div className="skeleton-line skeleton-title" />
        <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
          <div className="skeleton-line skeleton-badge" />
          <div className="skeleton-line skeleton-badge" style={{ width: 80 }} />
        </div>
      </div>
      {Array.from({ length: sections }, (_, i) => (
        <div key={i} className="card">
          <SkeletonLine width="30%" height={20} style={{ marginBottom: 16 }} />
          <SkeletonLine style={{ marginBottom: 10 }} />
          <SkeletonLine width="92%" style={{ marginBottom: 10 }} />
          <SkeletonLine width="70%" />
        </div>
      ))}
    </div>
  );
}

/** Blocos de texto (ex.: conteúdo de modais). */
export function LinesSkeleton({ blocks = 3 }: { blocks?: number }) {
  return (
    <div className="grid" style={{ gap: 22 }}>
      {Array.from({ length: blocks }, (_, i) => (
        <div key={i}>
          <SkeletonLine width="35%" height={18} style={{ marginBottom: 12 }} />
          <SkeletonLine style={{ marginBottom: 8 }} />
          <SkeletonLine width="90%" style={{ marginBottom: 8 }} />
          <SkeletonLine width="65%" />
        </div>
      ))}
    </div>
  );
}

/** Formulário: rótulos e campos. */
export function FormSkeleton({ fields = 6 }: { fields?: number }) {
  return (
    <div className="card">
      <div className="skeleton-line skeleton-title" />
      <div className="form-skeleton">
        {Array.from({ length: fields }, (_, i) => (
          <div key={i}>
            <SkeletonLine width={120} height={13} style={{ marginBottom: 8 }} />
            <div className="skeleton-line" style={{ height: 44, borderRadius: 14 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
