"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";

/* Peças de página no padrão da lista de propostas do admin (classes no globals.css) */

export function PageHeader({
  title,
  subtitle,
  actions,
  back,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="page-header">
      <div className="page-header-text">
        {back && (
          <Link href={back.href} className="page-back">
            ← {back.label}
          </Link>
        )}
        <h1 className="h1">{title}</h1>
        {subtitle && <p className="page-header-sub">{subtitle}</p>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </div>
  );
}

export function LeiLink() {
  return (
    <a href="/LEI.pdf" target="_blank" rel="noopener noreferrer" className="lei-banner">
      <strong>Lei</strong>📋
    </a>
  );
}

export function Filters({ children }: { children: ReactNode }) {
  return <div className="filters">{children}</div>;
}

export function FilterGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="row filter-group">
      <div className="label">{label}</div>
      {children}
    </div>
  );
}

export type ChipOption = { value: string; label: string };

export function FilterChips({ options, value, onChange }: { options: ChipOption[]; value: string; onChange: (value: string) => void }) {
  return (
    <div className="filter-chips">
      {options.map((opt) => {
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            className={`btn chip${isActive ? " is-active" : " secondary"}`}
            aria-pressed={isActive}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/** Busca que só avisa depois de uma pausa na digitação; acompanha mudanças externas (voltar do navegador). */
export function SearchInput({
  value,
  onChange,
  placeholder,
  delay = 300,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  delay?: number;
}) {
  const [text, setText] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    setText(value);
  }, [value]);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <input
      type="search"
      className="input"
      placeholder={placeholder}
      value={text}
      onChange={(e) => {
        const next = e.target.value;
        setText(next);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => onChangeRef.current(next), delay);
      }}
    />
  );
}

export function StatusBadge({ label, color }: { label: string; color?: string }) {
  return (
    <span className="badge status-badge" style={{ backgroundColor: color || "var(--border)" }}>
      {label}
    </span>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="p empty-state">{children}</p>;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="error-state" role="alert">
      <span>{message}</span>
      {onRetry && (
        <button type="button" className="btn secondary chip" onClick={onRetry}>
          Tentar de novo
        </button>
      )}
    </div>
  );
}

export function StatCard({
  value,
  label,
  color,
  active,
  onClick,
}: {
  value: ReactNode;
  label: string;
  color?: string;
  active?: boolean;
  onClick?: () => void;
}) {
  const clicavel = Boolean(onClick);
  return (
    <div
      className={`card stat-card${clicavel ? " is-clickable" : ""}${active ? " is-active" : ""}`}
      style={{ ["--stat-color" as string]: color }}
      onClick={onClick}
      role={clicavel ? "button" : undefined}
      tabIndex={clicavel ? 0 : undefined}
      aria-pressed={clicavel ? Boolean(active) : undefined}
      onKeyDown={clicavel ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick?.(); } } : undefined}
    >
      <div className="stat-card-value" style={{ color }}>{value}</div>
      <div className="p stat-card-label">{label}</div>
    </div>
  );
}

export function PasswordInput({
  value,
  onChange,
  placeholder,
  autoComplete = "current-password",
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  id?: string;
}) {
  const [visivel, setVisivel] = useState(false);
  return (
    <div className="password-field">
      <input
        id={id}
        className="input"
        type={visivel ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
      <button type="button" className="password-toggle" onClick={() => setVisivel((v) => !v)} aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}>
        {visivel ? "Ocultar" : "Mostrar"}
      </button>
    </div>
  );
}

export function Spinner() {
  return <span className="spinner" aria-hidden />;
}

/** Normaliza texto para busca sem acento e sem diferença de maiúsculas. */
export function normalize(text: string | null | undefined) {
  return (text || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}
