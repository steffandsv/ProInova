import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

function Base({ size = 20, children, ...rest }: P & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...rest}>
      {children}
    </svg>
  );
}

export const IconCalendar = (p: P) => <Base {...p}><rect x="3" y="4.5" width="18" height="16.5" rx="3" /><path d="M3 9.5h18M8 2.5v4M16 2.5v4" /></Base>;
export const IconClock = (p: P) => <Base {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.2 2" /></Base>;
export const IconPin = (p: P) => <Base {...p}><path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z" /><circle cx="12" cy="9" r="2.5" /></Base>;
export const IconArrow = (p: P) => <Base {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Base>;
export const IconArrowLeft = (p: P) => <Base {...p}><path d="M19 12H5M11 6l-6 6 6 6" /></Base>;
export const IconClose = (p: P) => <Base {...p}><path d="M6 6l12 12M18 6L6 18" /></Base>;
export const IconCheck = (p: P) => <Base {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></Base>;
export const IconTicket = (p: P) => <Base {...p}><path d="M3 8.5V6.5a1.5 1.5 0 0 1 1.5-1.5h15A1.5 1.5 0 0 1 21 6.5v2a3.5 3.5 0 0 0 0 7v2a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5v-2a3.5 3.5 0 0 0 0-7z" /><path d="M14 5v2.5M14 11v2M14 16.5V19" /></Base>;
export const IconRocket = (p: P) => <Base {...p}><path d="M5 15c-1.5 1.2-2 4-2 6 2 0 4.8-.5 6-2" /><path d="M9 18l-3-3c.8-4.5 4.5-11 13.5-12-1 9-7.5 12.7-12 13.5" /><circle cx="15" cy="9" r="1.8" /></Base>;
export const IconUsers = (p: P) => <Base {...p}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.6-3.6 3.3-5.5 6.5-5.5s5.9 1.9 6.5 5.5" /><path d="M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.8c1.9.7 3.2 2.4 3.5 5.2" /></Base>;
export const IconSpark = (p: P) => <Base {...p}><path d="M12 2.5l2.3 6.4 6.7 2.3-6.7 2.4L12 20l-2.3-6.4L3 11.2l6.7-2.3z" /></Base>;
export const IconEye = (p: P) => <Base {...p}><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></Base>;
export const IconHandshake = (p: P) => <Base {...p}><path d="M11 17l2 2a1.4 1.4 0 0 0 2-2l-1-1" /><path d="M14 16l2 2a1.4 1.4 0 0 0 2-2l-3.5-3.5" /><path d="M16.5 14.5l1.5 1.5a1.4 1.4 0 0 0 2-2l-5-5-2 2a2 2 0 0 1-2.8-2.8L13.5 4l7.5 7.5" /><path d="M3 11.5L8.5 6l2 1" /><path d="M3 11.5l7 7a1.4 1.4 0 0 0 2-2" /></Base>;
export const IconGift = (p: P) => <Base {...p}><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M5 12v8h14v-8M12 8v12" /><path d="M12 8c-1.5-3-5-3.5-5-1.2C7 8 9 8 12 8zM12 8c1.5-3 5-3.5 5-1.2C17 8 15 8 12 8z" /></Base>;
export const IconCamera = (p: P) => <Base {...p}><path d="M4 7.5h3l1.8-2.5h6.4L17 7.5h3a1 1 0 0 1 1 1V19a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8.5a1 1 0 0 1 1-1z" /><circle cx="12" cy="13" r="3.8" /></Base>;
export const IconWhatsapp = (p: P) => (
  <svg width={p.size || 20} height={p.size || 20} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.8 14.07c-.24.68-1.42 1.3-1.95 1.34-.5.05-.97.23-3.27-.68-2.77-1.09-4.52-3.92-4.66-4.1-.13-.18-1.11-1.48-1.11-2.82 0-1.34.7-2 .95-2.27.25-.27.54-.34.72-.34h.52c.17 0 .39-.06.61.47.24.55.79 1.9.86 2.04.07.14.11.3.02.48-.09.18-.14.3-.27.46l-.41.48c-.14.14-.28.29-.12.56.16.27.72 1.18 1.54 1.91 1.06.94 1.95 1.24 2.22 1.37.28.14.44.11.6-.07.16-.18.69-.8.88-1.08.18-.27.37-.23.62-.14.25.09 1.6.75 1.87.89.27.14.45.2.52.32.07.11.07.66-.17 1.33z" />
  </svg>
);
export const IconApple = (p: P) => (
  <svg width={p.size || 20} height={p.size || 20} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M16.37 12.6c-.02-2.16 1.77-3.2 1.85-3.25-1-1.47-2.57-1.67-3.13-1.7-1.33-.13-2.6.79-3.28.79-.68 0-1.72-.77-2.83-.75-1.45.02-2.8.85-3.55 2.15-1.52 2.63-.39 6.52 1.09 8.66.72 1.04 1.58 2.22 2.71 2.17 1.09-.04 1.5-.7 2.82-.7 1.31 0 1.68.7 2.83.68 1.17-.02 1.91-1.06 2.62-2.11.83-1.21 1.17-2.38 1.19-2.44-.03-.01-2.28-.88-2.32-3.5zM14.22 6.27c.6-.73 1-1.73.89-2.74-.86.04-1.9.57-2.52 1.3-.55.64-1.04 1.67-.91 2.65.96.07 1.94-.49 2.54-1.21z" />
  </svg>
);
export const IconGoogle = (p: P) => (
  <svg width={p.size || 20} height={p.size || 20} viewBox="0 0 24 24" aria-hidden>
    <path fill="#4285F4" d="M21.6 12.23c0-.68-.06-1.36-.18-2.02H12v3.83h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.23c1.9-1.75 2.99-4.32 2.99-7.33z" />
    <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.43l-3.23-2.5c-.9.6-2.04.95-3.39.95-2.6 0-4.81-1.76-5.6-4.12H3.07v2.58A10 10 0 0 0 12 22z" />
    <path fill="#FBBC05" d="M6.4 13.9a6 6 0 0 1 0-3.8V7.52H3.07a10 10 0 0 0 0 8.96L6.4 13.9z" />
    <path fill="#EA4335" d="M12 5.98c1.47 0 2.79.5 3.83 1.5l2.86-2.86A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.93 5.52L6.4 10.1C7.19 7.74 9.4 5.98 12 5.98z" />
  </svg>
);

/** Ícones de categoria (arte das capas e tags). */
const CATEGORIA_PATH: Record<string, string> = {
  "Educação": "M2 9.5l10-5 10 5-10 5-10-5zM6 11.5v5c0 1.4 2.7 3 6 3s6-1.6 6-3v-5M22 9.5v6",
  "Governo Digital": "M3 21h18M4.5 10h15M12 3l8.5 5h-17zM6.5 10v8M10.2 10v8M13.8 10v8M17.5 10v8",
  "Inteligência Artificial": "M6.5 6.5h11v11h-11zM10 10h4v4h-4zM9.5 3v3.5M14.5 3v3.5M9.5 17.5V21M14.5 17.5V21M3 9.5h3.5M3 14.5h3.5M17.5 9.5H21M17.5 14.5H21",
  "Economia Local": "M3.5 9l1.6-5h13.8l1.6 5M3.5 9h17v1.5a2.8 2.8 0 0 1-5.6 0 2.8 2.8 0 0 1-5.8 0 2.8 2.8 0 0 1-5.6 0zM5 12.5V20h14v-7.5M10 20v-4.5h4V20",
  "Turismo": "M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12zM12 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  "Sustentabilidade": "M5 19.5C5 10.5 11 5 20 5c0 9-5.5 14.5-14.5 14.5M5 19.5l7.5-7.5",
  "Comunicação": "M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3M8.5 21h7",
  "Saúde": "M20.8 8.6a5 5 0 0 0-8.8-3.2 5 5 0 0 0-8.8 3.2c0 5.4 8.8 11.4 8.8 11.4s8.8-6 8.8-11.4zM4 12h3.8l1.8-3 2.8 6 1.8-3H20",
  "Agro": "M12 21v-9M12 12c0-4-3-7-8-7 0 4 3 7 8 7zM12 10c0-3 2.5-6 7-6 0 3.5-2.5 6-7 6z",
  "Cidade Inteligente": "M3 21V10l5-3v14M8 21V4l8 4v13M16 21v-8l5 2v6M2 21h20M11 11h2M11 14.5h2",
  "Outro": "M12 2.5l2.3 6.4 6.7 2.3-6.7 2.4L12 20l-2.3-6.4L3 11.2l6.7-2.3z",
};

export function IconCategoria({ categoria, ...p }: P & { categoria: string }) {
  return <Base {...p}><path d={CATEGORIA_PATH[categoria] || CATEGORIA_PATH.Outro} /></Base>;
}
