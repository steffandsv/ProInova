import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

const COOKIE_NAME = "proinova_session";

export type SessionPayload = {
  sub: string; // user id
  role: string;
  cpf: string;
  nome: string;
};

export function signSession(payload: SessionPayload): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET não configurado");
  return jwt.sign(payload, secret, { expiresIn: "7d" });
}

export function setSessionCookie(token: string) {
  const jar = cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearSessionCookie() {
  const jar = cookies();
  jar.set(COOKIE_NAME, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export function readSession(): SessionPayload | null {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  const jar = cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, secret) as SessionPayload;
  } catch {
    return null;
  }
}

export function requireAuth(): SessionPayload {
  const session = readSession();
  if (!session) throw new Error("Não autenticado.");
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
