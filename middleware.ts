import { NextResponse, type NextRequest } from "next/server";

const COOKIE_NAME = "proinova_session";

/**
 * Edge-compatible JWT payload decoder.
 * We only DECODE (not verify) in middleware for performance.
 * Real cryptographic verification happens server-side in requireAuth().
 */
function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    // Base64url decode the payload (2nd part)
    const payload = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const json = atob(payload);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Route protection rules.
 * key: route prefix → value: array of allowed roles (empty = any authenticated user).
 */
const PROTECTED_ROUTES: Record<string, string[]> = {
  "/api/admin": ["ADMIN", "TRIAGEM", "EDUCACAO", "CMAA", "PREFEITO"],
  "/admin": ["ADMIN", "TRIAGEM", "EDUCACAO", "CMAA", "PREFEITO"],
  "/api/propostas": [], // any authenticated user
  "/propostas": [],     // any authenticated user
  "/painel": [],        // any authenticated user
};

/**
 * Public routes that should never be blocked.
 */
const PUBLIC_ROUTES = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/me",
  "/api/municipes/lookup",
  "/api/health",
  "/api/transparencia",
  "/api/projeto",
  "/api/editais/abertos",
  "/login",
  "/cadastro",
  "/transparencia",
  "/projeto",
  "/",
];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + "/")
  );
}

function findProtectedRule(pathname: string): string[] | null {
  const sorted = Object.keys(PROTECTED_ROUTES).sort(
    (a, b) => b.length - a.length
  );
  for (const prefix of sorted) {
    if (pathname.startsWith(prefix)) {
      return PROTECTED_ROUTES[prefix];
    }
  }
  return null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Public routes pass through
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  const allowedRoles = findProtectedRule(pathname);
  if (allowedRoles === null) {
    // Route not in any protected group → pass through
    return NextResponse.next();
  }

  // Must be authenticated
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Decode (not verify) the JWT payload — verification happens in route handlers
  const payload = decodeJwtPayload(token);
  if (!payload || !payload.sub) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ message: "Sessão inválida." }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If no specific roles required, any authenticated user can access
  if (allowedRoles.length === 0) {
    return NextResponse.next();
  }

  // Check role
  if (!allowedRoles.includes(payload.role)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ message: "Sem permissão." }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/painel", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
