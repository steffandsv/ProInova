"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Estado de filtro guardado na URL (?chave=valor), para sobreviver a recarregar,
 * voltar e compartilhar o link. O valor padrão some da URL.
 * Quem usa precisa estar dentro de um <Suspense> (exigência do useSearchParams).
 */
export function useUrlState(key: string, fallback = "") {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const value = searchParams.get(key) ?? fallback;

  const setValue = useCallback(
    (next: string, opts: { replace?: boolean } = {}) => {
      const params = new URLSearchParams(searchParams.toString());
      if (!next || next === fallback) params.delete(key);
      else params.set(key, next);
      const qs = params.toString();
      const url = qs ? `${pathname}?${qs}` : pathname;
      if (opts.replace) router.replace(url, { scroll: false });
      else router.push(url, { scroll: false });
    },
    [key, fallback, pathname, router, searchParams]
  );

  return [value, setValue] as const;
}
