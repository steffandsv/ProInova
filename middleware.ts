import { NextResponse, type NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const COOKIE_NAME = "proinova_session";

type SessionPayload = {
  sub: string;
  role: string;
  cpf: string;
  nome: string;
};

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
  // Exact match or starts-with for public route groups
  return PUBLIC_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + "/")
  );
}

function findProtectedRule(pathname: string): string[] | null {
  // Check longest prefix match
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
  const secret = process.env.JWT_SECRET;
  if (!token || !secret) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const payload = jwt.verify(token, secret) as SessionPayload;

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
  } catch {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ message: "Sessão inválida." }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: [
    // Match all routes except static files
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
