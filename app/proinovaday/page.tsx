import type { Metadata, Viewport } from "next";
import { getProInovaDayData } from "@/lib/proinovaday";
import { EVENTO } from "@/constants/proinovaday";
import Landing from "./ui/Landing";

export const dynamic = "force-dynamic";

function baseUrl(): URL | undefined {
  try {
    return process.env.PUBLIC_BASE_URL ? new URL(process.env.PUBLIC_BASE_URL) : undefined;
  } catch {
    return undefined;
  }
}

const descricao =
  "28/11, 9h, no C.TECH: as startups de Jaborandi encaram, ao vivo, prefeitos da região e o Sebrae. Entrada gratuita, lugares limitados — garanta o seu em 15 segundos.";

export const metadata: Metadata = {
  metadataBase: baseUrl(),
  title: "ProInova Day Jaborandi · 28/11 no C.TECH",
  description: descricao,
  openGraph: {
    title: "🦈 ProInova Day Jaborandi — 28 de novembro, 9h, C.TECH",
    description: descricao,
    type: "website",
    locale: "pt_BR",
    siteName: EVENTO.nome,
  },
  twitter: { card: "summary_large_image", title: "ProInova Day Jaborandi", description: descricao },
};

export const viewport: Viewport = {
  themeColor: "#010409",
  colorScheme: "dark",
};

export default async function ProInovaDayPage() {
  const data = await getProInovaDayData();
  return <Landing data={data} />;
}
