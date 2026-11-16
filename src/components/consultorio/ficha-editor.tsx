"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { crearEnlaceFirma, deletePatient, guardarFirma, quitarArchivoFicha, savePatientFields, subirArchivoFicha } from "@/app/consultorio/actions";
import { AntecedentesMedicos } from "@/components/consultorio/antecedentes-medicos";
import { CalendarioCampo } from "@/components/consultorio/calendario-campo";
import { Confirmacion } from "@/components/consultorio/confirmacion";
import { OdontogramaLectura } from "@/components/consultorio/firma-pad";
import { OdontogramaEditor } from "@/components/consultorio/odontograma-editor";
import { OdontogramaPiezasLectura } from "@/components/consultorio/odontograma-lectura";
import { PlanTratamiento } from "@/components/consultorio/plan-tratamiento";
import { PresupuestosPaciente } from "@/components/consultorio/presupuestos-paciente";
import { consentSheets, generalConsent, practiceOf, retiredConsentSheets } from "@/lib/consultorio/consents";
import { abrirWhatsapp, enlaceWhatsapp } from "@/lib/consultorio/whatsapp";
import { edadEn, edadEscrita, fechaDeInicio, fechaEnPalabras, todayInArgentina } from "@/lib/consultorio/fecha";
import { piezasDe } from "@/lib/consultorio/odontograma";
import { presupuestoNuevo } from "@/lib/consultorio/presupuesto";
import type { ChartFile, FeeItem, Patient, PreguntaMedica, PrestacionCatalogo } from "@/lib/consultorio/types";

const tabs = [
  { id: "datos", label: "Datos" },
  { id: "odontograma", label: "Odontograma" },
  { id: "historia", label: "Historia clínica" },
  { id: "estudios", label: "Estudios" },
  { id: "firmas", label: "Consentimientos informados" },
  { id: "presupuestos", label: "Presupuestos" },
] as const;

type Tab = (typeof tabs)[number]["id"];

function esTab(value: unknown): value is Tab {
  return tabs.some((item) => item.id === value);
}

const accion =
  "inline-flex h-10 cursor-pointer items-center justify-center rounded-full border border-forest bg-white px-4 text-base text-forest";

function ready(patient: Patient): Patient {
  const resto = { ...patient };
  delete resto.teeth;
  return {
    ...resto,
    document: patient.document ?? "",
    birthDate: patient.birthDate ?? "",
    age: patient.age ?? "",
    ageSetOn: patient.ageSetOn ?? "",
    contact: patient.contact ?? "",
    address: patient.address ?? "",
    familyContact: patient.familyContact ?? "",
    background: patient.background ?? "",
    medicalAnswers: patient.medicalAnswers ?? {},
    reason: patient.reason ?? "",
    startedOn: fechaDeInicio(patient),
    evolution: patient.evolution ?? [],
    piezas: piezasDe(patient),
    plan: patient.plan ?? [],
    presupuestos: patient.presupuestos ?? [],
    consents: patient.consents ?? [],
    files: patient.files ?? [],
  };
}

function draftOf(patient: Patient) {
  return JSON.stringify({
    name: patient.name,
    document: patient.document ?? "",
    birthDate: patient.birthDate ?? "",
    age: patient.age ?? "",
    ageSetOn: patient.ageSetOn ?? "",
    contact: patient.contact,
    address: patient.address ?? "",
    familyContact: patient.familyContact ?? "",
    background: patient.background,
    medicalAnswers: patient.medicalAnswers ?? {},
    reason: patient.reason,
    startedOn: fechaDeInicio(patient),
    evolution: patient.evolution,
    piezas: piezasDe(patient),
    plan: patient.plan ?? [],
    presupuestos: patient.presupuestos ?? [],
  });
}

export function FichaEditor({
  initial,
  preguntas,
  catalogo,
  precios,
  volver,
  enlaceInicial,
  tabInicial,
  nuevoPresupuesto = false,
}: {
  initial: Patient;
  preguntas: PreguntaMedica[];
  catalogo: PrestacionCatalogo[];
  precios: FeeItem[];
  volver: string;
  enlaceInicial: string;
  tabInicial?: string;
  /** Se llegó desde "Nuevo presupuesto": la ficha abre con uno ya creado. */
  nuevoPresupuesto?: boolean;
}) {
  // El presupuesto nuevo no está en "saved", así que el autoguardado lo guarda solo.
  const [inicio] = useState(() => {
    const base = ready(initial);
    if (!nuevoPresupuesto || base.presupuestos.length >= 50) return { patient: base, nuevoId: "" };
    const presupuesto = presupuestoNuevo();
    return { patient: { ...base, presupuestos: [presupuesto, ...base.presupuestos] }, nuevoId: presupuesto.id };
  });
  const [patient, setPatient] = useState(inicio.patient);
  const [tab, setTab] = useState<Tab>(esTab(tabInicial) ? tabInicial : "historia");
  const [notice, setNotice] = useState("");
  const [confirmName, setConfirmName] = useState("");
  const [askDelete, setAskDelete] = useState(false);
  const [quitar, setQuitar] = useState<string | null>(null);
  const [foto, setFoto] = useState<ChartFile | null>(null);
  const saved = useRef(draftOf(ready(initial)));
  const latest = useRef(draftOf(ready(initial)));

  const draft = draftOf(patient);
  latest.current = draft;

  useEffect(() => {
    if (!foto) return;
    const y = window.scrollY;
    const body = document.body;
    const previo = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
    };
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${y}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setFoto(null);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      body.style.overflow = previo.overflow;
      body.style.position = previo.position;
      body.style.top = previo.top;
      body.style.left = previo.left;
      body.style.right = previo.right;
      body.style.width = previo.width;
      window.scrollTo({ top: y, behavior: "instant" });
      window.removeEventListener("keydown", onKey);
    };
  }, [foto]);

  // Lleva la pantalla al presupuesto nuevo o al pedido en la dirección (#presupuesto-…).
  // Se quita "nuevo" de la dirección para que recargar no cree otro.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has("nuevo")) {
      url.searchParams.delete("nuevo");
      window.history.replaceState(window.history.state, "", url);
    }
    const destino = inicio.nuevoId ? `presupuesto-${inicio.nuevoId}` : decodeURIComponent(url.hash.slice(1));
    if (destino.startsWith("presupuesto-")) document.getElementById(destino)?.scrollIntoView({ block: "start" });
  }, [inicio.nuevoId]);

  useEffect(() => {
    if (draft === saved.current) {
      setNotice((current) => (current === "Guardando…" ? "" : current));
      return;
    }
    if (!patient.name.trim()) {
      setNotice("Escribí el nombre antes de guardar.");
      return;
    }
    setNotice("Guardando…");
    const sent = draft;
    const timer = setTimeout(async () => {
      const result = await savePatientFields(patient);
      if (latest.current !== sent) return;
      if ("error" in result) {
        setNotice("No se pudo guardar. Revisá la conexión.");
        return;
      }
      saved.current = sent;
      setNotice("Guardado");
    }, 700);
    return () => clearTimeout(timer);
  }, [draft, patient]);

  async function onPhoto(kind: Patient["consents"][number]["kind"], file: File) {
    if (file.size > 4 * 1024 * 1024) {
      setNotice("El archivo tiene que pesar menos de 4 MB.");
      return;
    }
    setNotice("Guardando…");
    const data = new FormData();
    data.set("patientId", patient.id);
    data.set("kind", kind);
    data.set("scan", file);
    try {
      const result = await guardarFirma(data);
      if ("error" in result) {
        setNotice(result.error);
        return;
      }
      setPatient(ready(result.patient));
      saved.current = draftOf(ready(result.patient));
      setNotice("Guardado");
    } catch {
      setNotice("No se pudo subir el archivo. Probá de nuevo.");
    }
  }

  async function onFile(file: File) {
    if (file.size > 4 * 1024 * 1024) {
      setNotice("El archivo tiene que pesar menos de 4 MB.");
      return;
    }
    setNotice("Guardando…");
    const data = new FormData();
    data.set("patientId", patient.id);
    data.set("file", file);
    try {
      const result = await subirArchivoFicha(data);
      if ("error" in result) {
        setNotice(result.error);
        return;
      }
      setPatient(ready(result.patient));
      saved.current = draftOf(ready(result.patient));
      setNotice("Guardado");
    } catch {
      setNotice("No se pudo subir el archivo. Probá de nuevo.");
    }
  }

  async function onQuitar(fileId: string) {
    setQuitar(null);
    setNotice("Guardando…");
    const result = await quitarArchivoFicha(patient.id, fileId);
    if ("error" in result) {
      setNotice(result.error);
      return;
    }
    setPatient(ready(result.patient));
    saved.current = draftOf(ready(result.patient));
    setNotice("Guardado");
  }

  const firmadasRetiradas = patient.consents.filter((item) =>
    retiredConsentSheets.some((sheet) => sheet.kind === item.kind),
  );
  const edadCalculada = edadEn(patient.birthDate);
  const edadVisible = patient.age || (edadCalculada === null ? "" : String(edadCalculada));

  function guardarEdad(input: HTMLInputElement) {
    const escrita = input.value.trim();
    if (!escrita || escrita === String(edadCalculada)) {
      setPatient((current) => ({ ...current, age: "", ageSetOn: "" }));
      input.value = edadCalculada === null ? "" : String(edadCalculada);
      return;
    }
    const age = edadEscrita(escrita);
    if (!age) {
      setNotice("Escribí la edad en años, de 0 a 130.");
      input.value = edadVisible;
      return;
    }
    input.value = age;
    if (age === patient.age) return;
    setPatient((current) => ({ ...current, age, ageSetOn: todayInArgentina() }));
  }

  return (
    <div>
      <Link href={volver} scroll={false} aria-label="Atrás" className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-sand bg-white text-forest print:hidden">
        <BackArrow />
      </Link>
      <h1 className="mt-3 font-serif text-4xl text-forest md:text-5xl">{patient.name || "Sin nombre"}</h1>
      <p className="mt-2 hidden text-muted print:block">Od. Jesica Brenda Goroso · Odontología</p>
      <div className="mt-6 grid grid-cols-2 gap-2 print:hidden sm:grid-cols-3 lg:grid-cols-6" role="tablist">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={`min-h-12 rounded-xl px-1 text-sm leading-tight text-forest lg:text-lg ${tab === item.id ? "bg-sand" : "bg-white"}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {notice ? (
        <p className="fixed inset-x-0 bottom-20 z-30 bg-sand py-3 text-center text-forest print:hidden md:bottom-0" role="status">
          {notice}
        </p>
      ) : null}

      <section className={tab === "datos" ? "mt-8" : "mt-8 hidden print:block"}>
        <h2 className="font-serif text-3xl">Datos</h2>
        <div className="mt-6 grid gap-4">
          <label className="block">
            Nombre
            <input
              value={patient.name}
              onChange={(event) => setPatient({ ...patient, name: event.target.value })}
              className="mt-2 min-h-12 w-full rounded-xl border border-sand bg-white px-4 text-lg"
            />
          </label>
          <label className="block">
            Documento
            <input
              value={patient.document ?? ""}
              onChange={(event) => setPatient({ ...patient, document: event.target.value })}
              className="mt-2 min-h-12 w-full rounded-xl border border-sand bg-white px-4 text-lg"
            />
          </label>
          <label className="block">
            Fecha de nacimiento
            <CalendarioCampo
              nacimiento
              value={patient.birthDate ?? ""}
              onChange={(birthDate) =>
                setPatient((current) =>
                  birthDate === current.birthDate ? current : { ...current, birthDate, age: "", ageSetOn: "" },
                )
              }
              className="mt-2"
            />
          </label>
          <div>
            <label className="block">
              Edad (años)
              <input
                key={`edad-${edadVisible}`}
                defaultValue={edadVisible}
                inputMode="numeric"
                maxLength={3}
                onBlur={(event) => guardarEdad(event.target)}
                className="mt-2 min-h-12 w-full rounded-xl border border-sand bg-white px-4 text-lg"
              />
            </label>
            {patient.age ? (
              <div className="mt-1 flex flex-wrap items-center gap-x-4 print:hidden">
                <p className="text-muted">
                  {patient.ageSetOn ? `Escrita a mano el ${fechaEnPalabras(patient.ageSetOn)}.` : "Escrita a mano."}
                </p>
                {edadCalculada !== null ? (
                  <button
                    type="button"
                    className="inline-flex min-h-10 items-center text-forest underline underline-offset-4"
                    onClick={() => setPatient((current) => ({ ...current, age: "", ageSetOn: "" }))}
                  >
                    Usar la calculada
                  </button>
                ) : null}
              </div>
            ) : (
              <p className="mt-1 text-muted print:hidden">
                {edadCalculada !== null ? "Calculada con la fecha de nacimiento." : "Cargá la fecha de nacimiento o escribí la edad."}
              </p>
            )}
          </div>
          <label className="block">
            Teléfono
            <input
              value={patient.contact}
              onChange={(event) => setPatient({ ...patient, contact: event.target.value })}
              inputMode="tel"
              className="mt-2 min-h-12 w-full rounded-xl border border-sand bg-white px-4 text-lg"
            />
          </label>
          <label className="block">
            Domicilio
            <input
              value={patient.address ?? ""}
              onChange={(event) => setPatient({ ...patient, address: event.target.value })}
              className="mt-2 min-h-12 w-full rounded-xl border border-sand bg-white px-4 text-lg"
            />
          </label>
          <label className="block">
            Contacto familiar
            <input
              value={patient.familyContact ?? ""}
              onChange={(event) => setPatient({ ...patient, familyContact: event.target.value })}
              placeholder="Nombre y teléfono"
              className="mt-2 min-h-12 w-full rounded-xl border border-sand bg-white px-4 text-lg"
            />
          </label>
          <p className="text-forest">Ficha empezada el {fechaEnPalabras(fechaDeInicio(patient))}</p>
          <label className="block">
            Motivo de consulta
            <textarea
              value={patient.reason}
              onChange={(event) => setPatient({ ...patient, reason: event.target.value })}
              rows={3}
              className="mt-2 w-full rounded-xl border border-sand bg-white px-4 py-3 text-lg"
            />
          </label>
        </div>
      </section>

      <section className={tab === "odontograma" ? "mt-8" : "mt-8 hidden print:block"}>
        <h2 className="font-serif text-3xl">Odontograma</h2>
        <div className="mt-6">
          <AntecedentesMedicos
            preguntas={preguntas}
            respuestas={patient.medicalAnswers}
            background={patient.background}
            patientId={patient.id}
            onRespuestas={(medicalAnswers) => setPatient((current) => ({ ...current, medicalAnswers }))}
            onBackground={(background) => setPatient((current) => ({ ...current, background }))}
          />
        </div>
        <div className="mt-6">
          <OdontogramaEditor
            piezas={patient.piezas}
            catalogo={catalogo}
            patientId={patient.id}
            onChange={(piezas) => setPatient((current) => ({ ...current, piezas }))}
          />
        </div>
        <div className="mt-8">
          <PlanTratamiento plan={patient.plan} onChange={(plan) => setPatient((current) => ({ ...current, plan }))} />
        </div>
      </section>

      <section className={tab === "historia" ? "mt-8" : "mt-8 hidden print:block"}>
        <h2 className="font-serif text-3xl">Historia clínica</h2>
        <button
          type="button"
          className="mt-6 inline-flex h-12 items-center rounded-full bg-forest px-5 text-lg text-cream print:hidden"
          onClick={() =>
            setPatient({
              ...patient,
              evolution: [{ id: crypto.randomUUID(), date: todayInArgentina(), text: "" }, ...patient.evolution],
            })
          }
        >
          Agregar visita de hoy
        </button>
        <div className="mt-6 space-y-4">
          {patient.evolution.length === 0 ? <p className="text-forest">Todavía no hay visitas.</p> : null}
          {[...patient.evolution]
            .sort((a, b) => b.date.localeCompare(a.date))
            .map((note) =>
              note.date === todayInArgentina() ? (
                <div key={note.id} className="rounded-2xl border border-sand bg-white p-4">
                  <p className="text-forest">{fechaEnPalabras(note.date)}</p>
                  <textarea
                    value={note.text}
                    onChange={(event) =>
                      setPatient({
                        ...patient,
                        evolution: patient.evolution.map((item) =>
                          item.id === note.id ? { ...item, text: event.target.value } : item,
                        ),
                      })
                    }
                    rows={3}
                    placeholder="Qué se hizo"
                    className="mt-3 w-full rounded-xl border border-sand px-3 py-3 text-lg"
                  />
                  <button
                    type="button"
                    className="mt-2 inline-flex h-12 items-center text-forest print:hidden"
                    onClick={() =>
                      setPatient({
                        ...patient,
                        evolution: patient.evolution.filter((item) => item.id !== note.id),
                      })
                    }
                  >
                    Quitar visita
                  </button>
                </div>
              ) : (
                <div key={note.id} className="rounded-2xl border border-sand bg-white p-4">
                  <p className="text-forest">{fechaEnPalabras(note.date)}</p>
                  <p className="mt-3 whitespace-pre-wrap text-lg text-forest">{note.text || "Sin anotación."}</p>
                </div>
              ),
            )}
        </div>
      </section>

      <section className={tab === "estudios" ? "mt-8 print:hidden" : "hidden"}>
        <h2 className="font-serif text-3xl">Estudios</h2>
        <p className="mt-3 text-forest">Una imagen, un PDF o un Word. Hasta 4 MB.</p>
        <label className="mt-6 inline-flex h-12 cursor-pointer items-center justify-center rounded-full bg-forest px-5 text-lg text-cream">
          Subir archivo
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void onFile(file);
            }}
          />
        </label>
        {patient.files.length === 0 ? (
          <p className="mt-6 text-muted">Todavía no hay estudios.</p>
        ) : (
          <ul className="mt-6 space-y-4">
            {patient.files.map((file) => (
              <li key={file.id} className="rounded-2xl border border-sand bg-white p-4">
                <p className="font-semibold text-forest">{file.fileName}</p>
                <p className="mt-1 text-muted">{fechaEnPalabras(file.addedOn)}</p>
                <div className="mt-4 flex items-center justify-between gap-4">
                  {esImagen(file) ? (
                    <button type="button" className="inline-flex h-12 items-center justify-center rounded-full bg-forest px-5 text-cream" onClick={() => setFoto(file)}>
                      Abrir
                    </button>
                  ) : (
                    <a
                      className="inline-flex h-12 items-center justify-center rounded-full bg-forest px-5 text-cream"
                      href={`/consultorio/archivo/${file.fileId}`}
                      {...(esWord(file) ? {} : { target: "_blank", rel: "noopener noreferrer" })}
                    >
                      {esWord(file) ? "Descargar" : "Abrir"}
                    </a>
                  )}
                  <button type="button" className="text-[#6b2e2a]" onClick={() => setQuitar(file.id)}>
                    Quitar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={tab === "firmas" ? "mt-8" : "mt-8 hidden print:block"}>
        <h2 className="font-serif text-3xl">Consentimientos informados</h2>
        <p className="mt-3 text-forest print:hidden">
          El consentimiento general lo firma el paciente con un enlace. Las otras hojas se pueden imprimir y subir en foto.
        </p>
        <GeneralFirmado
          patient={patient}
          enlaceInicial={enlaceInicial}
          onPhoto={(file) => void onPhoto("general", file)}
        />
        <h3 className="mt-10 font-serif text-2xl print:hidden">Otras hojas</h3>
        <ul className="mt-2 print:hidden">
          {consentSheets.map((sheet) => {
            const signed = patient.consents.find((item) => item.kind === sheet.kind);
            return (
              <li key={sheet.kind} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-sand py-3">
                <p>
                  {sheet.practice}
                  {signed?.fileId ? (
                    <span className="text-muted"> · {signed.signedOn.split("-").reverse().join("/")}</span>
                  ) : null}
                  {sheet.draft ? <span className="block text-sm font-semibold text-[#b3261e]">Borrador: falta el texto de Jesica</span> : null}
                </p>
                <p className="flex flex-wrap gap-2">
                  {signed?.fileId ? (
                    <a className={accion} href={`/consultorio/archivo/${signed.fileId}`}>
                      Ver
                    </a>
                  ) : null}
                  <a
                    className={accion}
                    href={`/consultorio/consentimientos/${sheet.kind}?${new URLSearchParams({
                      nombre: patient.name,
                      dni: patient.document,
                      nacimiento: patient.birthDate.split("-").reverse().join("/"),
                      volver: `/consultorio/pacientes/${patient.id}?${new URLSearchParams({ tab: "firmas", volver })}`,
                    })}`}
                  >
                    Imprimir
                  </a>
                  <label className={accion}>
                    Subir foto
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        event.target.value = "";
                        if (file) void onPhoto(sheet.kind, file);
                      }}
                    />
                  </label>
                </p>
              </li>
            );
          })}
        </ul>
        {firmadasRetiradas.length > 0 ? (
          <>
            <h3 className="mt-10 font-serif text-2xl print:hidden">Hojas que ya no se usan</h3>
            <p className="mt-1 text-muted print:hidden">Ya estaban firmadas en esta ficha. Se conservan para consulta.</p>
            <ul className="mt-2 print:hidden">
              {firmadasRetiradas.map((item) => (
                <li key={item.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-sand py-3">
                  <p>
                    {practiceOf(item.kind)}
                    <span className="text-muted"> · {item.signedOn.split("-").reverse().join("/")}</span>
                  </p>
                  {item.fileId ? (
                    <a className={accion} href={`/consultorio/archivo/${item.fileId}`}>
                      Ver
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </section>

      <section className={tab === "presupuestos" ? "mt-8 print:hidden" : "hidden"}>
        <h2 className="font-serif text-3xl">Presupuestos</h2>
        <PresupuestosPaciente
          patientId={patient.id}
          presupuestos={patient.presupuestos}
          precios={precios}
          paciente={{ name: patient.name, contact: patient.contact }}
          onChange={(presupuestos) => setPatient((current) => ({ ...current, presupuestos }))}
        />
      </section>

      <div className="mt-12 print:hidden">
        {askDelete ? (
          <div className="rounded-2xl border border-sand p-4">
            <p>Para eliminar la ficha, escribí el nombre: {patient.name}</p>
            <input
              value={confirmName}
              onChange={(event) => setConfirmName(event.target.value)}
              className="mt-3 min-h-12 w-full rounded-xl border border-sand bg-white px-4 text-lg"
            />
            <button
              type="button"
              disabled={confirmName.trim() !== patient.name.trim() || !patient.name.trim()}
              onClick={() => deletePatient(patient.id)}
              className="mt-3 inline-flex h-12 items-center text-[#6b2e2a] disabled:opacity-40"
            >
              Eliminar ficha
            </button>
          </div>
        ) : (
          <button type="button" className="text-muted" onClick={() => setAskDelete(true)}>
            Eliminar ficha
          </button>
        )}
      </div>
      {quitar ? (
        <Confirmacion
          title="Quitar archivo"
          text="Se borra de la ficha."
          confirm="Sí, quitar"
          onConfirm={() => void onQuitar(quitar)}
          onClose={() => setQuitar(null)}
        />
      ) : null}
      {foto ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest/40 px-4 py-6" onClick={() => setFoto(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="foto-titulo"
            className="max-h-full w-full max-w-3xl overflow-y-auto rounded-[22px] border border-sand bg-white p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h2 id="foto-titulo" className="font-serif text-3xl leading-tight text-forest">
                {foto.fileName}
              </h2>
              <button type="button" className="h-12 shrink-0 px-2 text-forest" onClick={() => setFoto(null)}>
                Cerrar
              </button>
            </div>
            <img src={`/consultorio/archivo/${foto.fileId}`} alt={foto.fileName} className="mt-4 w-full rounded-xl" />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function horaFirmada(iso: string | undefined) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(date);
  const texto = (tipo: Intl.DateTimeFormatPartTypes) =>
    (parts.find((part) => part.type === tipo)?.value ?? "").replace(/[\u00A0\u202F]/g, " ").replace(/\s+/g, " ").trim();
  const hour = texto("hour");
  const minute = texto("minute");
  const period = texto("dayPeriod");
  if (!hour || !minute) return "";
  return period ? `${hour}:${minute} ${period}` : `${hour}:${minute}`;
}

function whatsappDeLaFirma(path: string, contacto: string) {
  const absoluta = new URL(path, window.location.origin).href;
  return enlaceWhatsapp(contacto, `Hola, te dejo el consentimiento informado para firmar:\n${absoluta}`);
}

function GeneralFirmado({
  patient,
  enlaceInicial,
  onPhoto,
}: {
  patient: Patient;
  enlaceInicial: string;
  onPhoto: (file: File) => void;
}) {
  const [enlace, setEnlace] = useState(enlaceInicial);
  const [direccion, setDireccion] = useState(enlaceInicial);
  const [creando, setCreando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [errorEnlace, setErrorEnlace] = useState("");
  useEffect(() => {
    if (!enlace) return;
    setDireccion(new URL(enlace, window.location.origin).href);
  }, [enlace]);
  const signed = patient.consents.find((item) => item.kind === "general");
  const hora = horaFirmada(signed?.signedAt);
  const version = signed?.textVersion === generalConsent.version ? generalConsent.paragraphs : null;
  return (
    <article className="mt-6 break-inside-avoid rounded-2xl border border-sand bg-white p-4">
      <h3 className="font-serif text-2xl">{generalConsent.practice}</h3>
      {signed ? (
        <>
          <p className="mt-2 text-forest">
            Firmó el {signed.signedOn.split("-").reverse().join("/")}
            {hora ? ` a las ${hora}` : ""}
            {signed.source === "papel" ? " · foto del papel" : ""}
          </p>
          {signed.aclaracion ? <p className="mt-2">Aclaración: {signed.aclaracion}</p> : null}
          {version ? (
            <div className="mt-4 space-y-3 text-base leading-6">
              {version.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          ) : signed.textVersion ? (
            <p className="mt-3 text-muted">Firmado con una versión anterior del texto ({signed.textVersion}).</p>
          ) : null}
          {signed.piezasSnapshot ? (
            <div className="mt-4">
              <p className="text-muted">Odontograma al firmar</p>
              <div className="mt-2">
                <OdontogramaPiezasLectura piezas={signed.piezasSnapshot} />
              </div>
            </div>
          ) : signed.teethSnapshot ? (
            <div className="mt-4">
              <p className="text-muted">Odontograma al firmar</p>
              <div className="mt-2">
                <OdontogramaLectura teeth={signed.teethSnapshot} />
              </div>
            </div>
          ) : null}
          {signed.fileId ? (
            <img
              src={`/consultorio/archivo/${signed.fileId}`}
              alt={signed.source === "papel" ? "Foto del consentimiento firmado" : "Firma del paciente"}
              className="mt-4 max-h-48 w-full rounded-xl border border-sand object-contain"
            />
          ) : null}
        </>
      ) : (
        <p className="mt-2 text-muted">Todavía no está firmado.</p>
      )}
      <div className="mt-4 print:hidden">
        <button
          type="button"
          disabled={creando}
          onClick={() => {
            setErrorEnlace("");
            setCopiado(false);
            if (enlace) {
              abrirWhatsapp(whatsappDeLaFirma(enlace, patient.contact));
              return;
            }
            const ventana = window.open("", "_blank");
            setCreando(true);
            void crearEnlaceFirma(patient.id).then((result) => {
              setCreando(false);
              if ("error" in result) {
                ventana?.close();
                setErrorEnlace(result.error);
                return;
              }
              setEnlace(result.url);
              const url = whatsappDeLaFirma(result.url, patient.contact);
              if (ventana) ventana.location.href = url;
              else abrirWhatsapp(url);
            });
          }}
          className="inline-flex h-12 w-full items-center justify-center rounded-full bg-forest px-5 text-lg text-cream disabled:opacity-40"
        >
          {creando ? "Abriendo WhatsApp…" : "Compartir por WhatsApp"}
        </button>
        <p className="mt-2 text-muted">Se abre WhatsApp con el enlace. El paciente lo firma en su teléfono.</p>
        {errorEnlace ? <p className="mt-2 text-[#6b2e2a]">{errorEnlace}</p> : null}
        {enlace ? (
          <div className="mt-3">
            <p className="break-all text-forest">{direccion}</p>
            <button
              type="button"
              className={`${accion} mt-3`}
              onClick={() => {
                const absoluta = new URL(enlace, window.location.origin).href;
                void navigator.clipboard.writeText(absoluta).then(
                  () => setCopiado(true),
                  () => setCopiado(false),
                );
              }}
            >
              {copiado ? "Copiado" : "Copiar"}
            </button>
          </div>
        ) : null}
        <p className="mt-3 flex flex-wrap gap-2">
          <label className={accion}>
            Subir foto del papel
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) onPhoto(file);
              }}
            />
          </label>
          <button type="button" className={accion} onClick={() => window.print()}>
            Imprimir
          </button>
        </p>
      </div>
    </article>
  );
}

function esImagen(file: ChartFile) {
  return file.mime.startsWith("image/") || /\.(png|jpe?g|webp)$/i.test(file.fileName);
}

function esWord(file: ChartFile) {
  return file.mime.includes("word") || /\.docx?$/i.test(file.fileName);
}

function BackArrow() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}
