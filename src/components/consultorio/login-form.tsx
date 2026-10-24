"use client";

import { useActionState, useState } from "react";
import { login } from "@/app/consultorio/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, null);
  const [visible, setVisible] = useState(false);

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col justify-center px-6 py-16">
      <form action={action}>
        <p className="font-serif text-5xl text-forest">Consultorio</p>
        <span className="mt-4 block h-0.5 w-16 bg-gold" />
        <p className="mt-6 text-forest">
          Este espacio es solo tuyo. Los pacientes no ven las fichas ni los precios.
        </p>
        <label className="mt-8 block text-forest" htmlFor="password">
          Clave
        </label>
        <input
          id="password"
          name="password"
          type={visible ? "text" : "password"}
          autoComplete="current-password"
          required
          className="mt-2 min-h-12 w-full rounded-xl border border-sand bg-white px-4 text-lg text-forest"
        />
        <button
          type="button"
          className="mt-3 inline-flex h-12 items-center text-forest underline"
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? "Ocultar clave" : "Ver clave"}
        </button>
        {state?.error ? <p className="mt-3 text-[#6b2e2a]">{state.error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-full bg-forest px-6 text-lg text-cream disabled:opacity-60"
        >
          {pending ? "Entrando…" : "Entrar"}
        </button>
      </form>
      <section className="mt-12">
        <h1 className="font-serif text-3xl text-forest">Dejar el ícono en el celular</h1>
        <ol className="mt-4 list-decimal space-y-3 pl-6 text-forest">
          <li>Abrí esta página en el celular.</li>
          <li>En el menú del navegador, elegí «Agregar a inicio».</li>
          <li>Queda un ícono que dice Consultorio. La próxima vez entrás por ahí.</li>
        </ol>
      </section>
    </main>
  );
}
