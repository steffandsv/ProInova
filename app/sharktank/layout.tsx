import { JetBrains_Mono, Manrope, Unbounded } from "next/font/google";
import "./sharktank.css";

// Identidade própria do evento: Unbounded (títulos), Manrope (texto), JetBrains Mono (detalhes técnicos)
const display = Unbounded({ subsets: ["latin"], weight: ["400", "600", "800", "900"], variable: "--st-font-display", display: "swap" });
const body = Manrope({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--st-font-body", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "600"], variable: "--st-font-mono", display: "swap" });

export default function SharkTankLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`st-fonts ${display.variable} ${body.variable} ${mono.variable}`}>
      {children}
    </div>
  );
}
