import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sameSecret, sessionCookie, sessionToken } from "./session";

export function consultorioPassword() {
  return process.env.CONSULTORIO_PASSWORD ?? "";
}

export async function hasSession() {
  const password = consultorioPassword();
  if (!password) return false;
  const jar = await cookies();
  const token = jar.get(sessionCookie)?.value ?? "";
  if (!token) return false;
  return sameSecret(token, await sessionToken(password));
}

export async function requireSession() {
  if (!(await hasSession())) redirect("/consultorio/ingreso");
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
}
