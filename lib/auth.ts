import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

const COOKIE_NAME = "proinova_session";

export type SessionPayload = {
  sub: string; // user id
  userId: string; // alias for sub (convenience)
  role: string;
  cpf: string;
  nome: string;
};

export function signSession(payload: Omit<SessionPayload, "userId">): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET não configurado");
  return jwt.sign(payload, secret, { expiresIn: "365d" });
}

export function setSessionCookie(token: string) {
  const jar = cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export function clearSessionCookie() {
  const jar = cookies();
  jar.set(COOKIE_NAME, "", { httpOnly: true, path: "/", maxAge: 0 });
}

/**
 * Read session from next/headers cookies() — for Server Components / Route Handlers
 * that DON'T receive a Request object.
 */
export function readSession(): SessionPayload | null {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  const jar = cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const raw = jwt.verify(token, secret) as any;
    return { ...raw, userId: raw.sub };
  } catch {
    return null;
  }
}

/**
 * Read session from a raw Request's Cookie header.
 * Used by API routes that receive the Request object.
 */
function readSessionFromRequest(request: Request): SessionPayload | null {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (!match) return null;
  try {
    const raw = jwt.verify(match[1], secret) as any;
    return { ...raw, userId: raw.sub };
  } catch {
    return null;
  }
}

/**
 * requireAuth() — no args → reads from next/headers (Server Components)
 * requireAuth(request) — reads from Request cookie header (API routes)
 */
export function requireAuth(request?: Request): SessionPayload {
  const session = request ? readSessionFromRequest(request) : readSession();
  if (!session) throw new Error("No session");
  return session;
}

export function requireRole(session: SessionPayload, ...roles: string[]): void {
  if (roles.length > 0 && !roles.includes(session.role)) {
    throw new Error("Sem permissão para esta ação.");
  }
}

export async function hashPassword(password: string): Promise<string> {
  const pepper = process.env.PASSWORD_PEPPER || "";
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password + pepper, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const pepper = process.env.PASSWORD_PEPPER || "";
  return bcrypt.compare(password + pepper, hash);
}

