"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITENS = [
  { href: "/admin/propostas", label: "Propostas", roles: ["ADMIN", "TRIAGEM", "EDUCACAO", "CMAA", "PREFEITO"] },
  { href: "/admin/editais", label: "Editais", roles: ["ADMIN"] },
  { href: "/admin/pagamentos", label: "Pagamentos", roles: ["ADMIN"] },
  { href: "/admin/lancamento", label: "Inscrições", roles: ["ADMIN", "TRIAGEM", "EDUCACAO", "CMAA", "PREFEITO"] },
  { href: "/admin/proinovaday", label: "ProInova Day", roles: ["ADMIN", "TRIAGEM", "EDUCACAO", "CMAA", "PREFEITO"] },
  { href: "/admin/usuarios", label: "Usuários", roles: ["ADMIN"] },
];

export default function AdminNav({ role }: { role: string }) {
  const pathname = usePathname();
  const itens = ITENS.filter((item) => item.roles.includes(role));
  if (itens.length <= 1) return null;

  return (
    <nav className="admin-nav" aria-label="Administração">
      {itens.map((item) => (
        <Link key={item.href} href={item.href} className={pathname.startsWith(item.href) ? "is-active" : undefined}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
