"use client";

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
import {
  HOJAS_EDITABLES,
  NOMBRE_HOJA,
  hojaPropiaPorWhatsapp,
  practiceOf,
  retiredConsentSheets,
  textoDeFabrica,
} from "@/lib/consultorio/consents";
import { BotonWhatsapp } from "@/components/consultorio/boton-whatsapp";
import { ApartadosDelTexto } from "@/components/consultorio/texto-consentimiento";
import { abrirWhatsapp, enlaceWhatsapp } from "@/lib/consultorio/whatsapp";
import { edadEn, edadEscrita, fechaDeInicio, fechaEnPalabras, horaFirmada, todayInArgentina } from "@/lib/consultorio/fecha";
import { piezasDe } from "@/lib/consultorio/odontograma";
import { presupuestoNuevo } from "@/lib/consultorio/presupuesto";
import type { ChartFile, FeeItem, Patient, PreguntaMedica, PrestacionCatalogo } from "@/lib/consultorio/types";
import { BotonAtras } from "@/components/consultorio/boton-atras";

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
  enlaces,
  tabInicial,
  nuevoPresupuesto = false,
}: {
  initial: Patient;
  preguntas: PreguntaMedica[];
  catalogo: PrestacionCatalogo[];
  precios: FeeItem[];
  volver: string;
  /** Enlaces para firmar en el teléfono que todavía sirven, por hoja. */
  enlaces: EnlacesVigentes;
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
      <BotonAtras href={volver} scroll={false} />
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
        <p className="fixed inset-x-0 bottom-20 z-30 bg-sand py-3 text-center text-forest print:hidden" role="status">
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
        <div className="mt-6 grid max-w-2xl gap-4 print:hidden">
          {HOJAS_EDITABLES.map((kind) => (
            <TarjetaConsentimiento
              key={kind}
              kind={kind}
              patient={patient}
              enlace={enlaces[kind]}
              volver={`/consultorio/pacientes/${patient.id}?${new URLSearchParams({ tab: "firmas", volver })}`}
              onPhoto={(file) => void onPhoto(kind, file)}
            />
          ))}
        </div>
        <GeneralImpreso patient={patient} />
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

type Nota = { label: string; texto: string };
type HojaDeEnlace = "general" | "ortodoncia" | "ortopedia";
export type EnlacesVigentes = Partial<Record<HojaDeEnlace, { url: string; notas: Nota[] }>>;

function whatsappDeLaFirma(path: string, contacto: string, practica?: string) {
  const absoluta = new URL(path, window.location.origin).href;
  const de = practica ? ` de ${practica}` : "";
  return enlaceWhatsapp(contacto, `Hola, te dejo el consentimiento informado${de} para firmar:\n${absoluta}`);
}

/**
 * Crea el enlace para firmar en el teléfono y abre WhatsApp con el mensaje.
 * La pestaña se abre antes de pedir el enlace para que el navegador no la bloquee.
 */
async function compartirEnlace(opciones: {
  patientId: string;
  kind: HojaDeEnlace;
  notas: Nota[];
  contacto: string;
  practica?: string;
}): Promise<{ url: string } | { error: string }> {
  const ventana = window.open("", "_blank");
  try {
    const result = await crearEnlaceFirma(opciones.patientId, opciones.kind, opciones.notas);
    if ("error" in result) {
      ventana?.close();
      return result;
    }
    const url = whatsappDeLaFirma(result.url, opciones.contacto, opciones.practica);
    if (ventana) ventana.location.href = url;
    else abrirWhatsapp(url);
    return result;
  } catch {
    ventana?.close();
    return { error: "No se pudo crear el enlace. Probá de nuevo." };
  }
}

type NombreIcono = "diagnostico" | "editar" | "imprimir" | "foto" | "enlace" | "listo";

/** Íconos de línea de "Más opciones", del mismo trazo que los del menú. */
function IconoOpcion({ nombre }: { nombre: NombreIcono }) {
  const trazos: Record<NombreIcono, React.ReactNode> = {
    diagnostico: (
      <>
        <path strokeLinejoin="round" d="M7 4.2h7.2L18.8 9v10.3a1.2 1.2 0 0 1-1.2 1.2H7a1.2 1.2 0 0 1-1.2-1.2V5.4A1.2 1.2 0 0 1 7 4.2Z" />
        <path strokeLinecap="round" d="M12.3 11.5v6M9.3 14.5h6" />
      </>
    ),
    editar: (
      <>
        <path strokeLinejoin="round" d="M4.5 19.5h3.8L18.6 9.2a2.1 2.1 0 0 0-3-3L5.3 16.5l-.8 3Z" />
        <path d="m13.8 8 2.9 2.9" />
      </>
    ),
    imprimir: (
      <>
        <path strokeLinejoin="round" d="M7 9V4h10v5" />
        <path strokeLinejoin="round" d="M7 17H4.8A1.3 1.3 0 0 1 3.5 15.7v-5.4A1.3 1.3 0 0 1 4.8 9h14.4a1.3 1.3 0 0 1 1.3 1.3v5.4a1.3 1.3 0 0 1-1.3 1.3H17" />
        <path strokeLinejoin="round" d="M7 13.5h10V20H7z" />
      </>
    ),
    foto: (
      <>
        <path strokeLinejoin="round" d="M3.8 8.6a1.4 1.4 0 0 1 1.4-1.4h2.6l1.6-2.2h5.2l1.6 2.2h2.6a1.4 1.4 0 0 1 1.4 1.4v9.2a1.4 1.4 0 0 1-1.4 1.4H5.2a1.4 1.4 0 0 1-1.4-1.4V8.6Z" />
        <circle cx="12" cy="12.8" r="3.2" />
      </>
    ),
    enlace: (
      <>
        <path strokeLinecap="round" d="M10.2 13.8a3.6 3.6 0 0 0 5.1 0l3-3a3.6 3.6 0 0 0-5.1-5.1l-1 1" />
        <path strokeLinecap="round" d="M13.8 10.2a3.6 3.6 0 0 0-5.1 0l-3 3a3.6 3.6 0 0 0 5.1 5.1l1-1" />
      </>
    ),
    listo: <path strokeLinecap="round" strokeLinejoin="round" d="m5 12.5 4.5 4.5L19 7.5" />,
  };
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-6 w-6 shrink-0 text-forest/70"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      {trazos[nombre]}
    </svg>
  );
}

/** Uno de los tres consentimientos en la ficha: estado, WhatsApp y, si se quiere, más opciones. */
function TarjetaConsentimiento({
  kind,
  patient,
  enlace,
  volver,
  onPhoto,
}: {
  kind: HojaDeEnlace;
  patient: Patient;
  enlace?: { url: string; notas: Nota[] };
  volver: string;
  onPhoto: (file: File) => void;
}) {
  const propia = kind === "general" ? undefined : hojaPropiaPorWhatsapp(kind);
  const signed = patient.consents.find((item) => item.kind === kind);
  const [enlaceActual, setEnlaceActual] = useState(enlace?.url ?? "");
  const [mas, setMas] = useState(false);
  const [conDiagnostico, setConDiagnostico] = useState(false);
  const [textos, setTextos] = useState<Record<string, string>>(() =>
    Object.fromEntries((enlace?.notas ?? []).map((nota) => [nota.label, nota.texto])),
  );
  const [enviando, setEnviando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [error, setError] = useState("");
  const porTelefono = signed?.source === "pantalla";
  const verFirmada = `/consultorio/consentimientos/${kind}?${new URLSearchParams({ paciente: patient.id, volver })}`;
  const imprimir = `/consultorio/consentimientos/${kind}?${new URLSearchParams({
    nombre: patient.name,
    dni: patient.document,
    nacimiento: patient.birthDate.split("-").reverse().join("/"),
    volver,
  })}`;
  const opcionMenu =
    "flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-xl px-2 py-1.5 text-left text-forest hover:bg-cream";

  let estado = "Sin firmar";
  if (signed) {
    const quien = signed.aclaracion
      ? ` por ${signed.aclaracion}${signed.firmante === "representante" ? " (madre, padre o representante)" : ""}`
      : "";
    estado = `✓ Firmado el ${signed.signedOn.split("-").reverse().join("/")}${quien}${signed.source === "papel" ? " · foto del papel" : ""}`;
  } else if (enlaceActual) {
    estado = "Enviado por WhatsApp, falta que firme";
  }

  async function enviar() {
    if (enviando) return;
    setEnviando(true);
    setError("");
    setCopiado(false);
    const notas =
      propia && conDiagnostico
        ? propia.blanks
            .map((blank) => ({ label: blank.label, texto: (textos[blank.label] ?? "").trim() }))
            .filter((nota) => nota.texto)
        : [];
    const result = await compartirEnlace({
      patientId: patient.id,
      kind,
      notas,
      contacto: patient.contact,
      practica: kind === "general" ? undefined : NOMBRE_HOJA[kind],
    });
    setEnviando(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setEnlaceActual(result.url);
    setConDiagnostico(false);
  }

  return (
    <article aria-labelledby={`consentimiento-${kind}`} className="rounded-2xl border border-sand bg-white p-4 sm:p-5">
      <h3 id={`consentimiento-${kind}`} className="font-serif text-2xl text-forest">
        {NOMBRE_HOJA[kind]}
      </h3>
      <p className={`mt-1 ${signed ? "text-[#1a7a3e]" : "text-muted"}`}>{estado}</p>

      {propia && conDiagnostico ? (
        <div className="mt-4 grid gap-3">
          {propia.blanks.map((blank) => (
            <label key={blank.label} className="block text-forest">
              {blank.label} <span className="text-muted">(opcional)</span>
              <textarea
                value={textos[blank.label] ?? ""}
                maxLength={500}
                rows={blank.lines}
                onChange={(event) => setTextos((actual) => ({ ...actual, [blank.label]: event.target.value }))}
                className="mt-1 min-h-12 w-full rounded-xl border border-sand bg-white px-3 py-2 text-lg text-forest field-sizing-content"
              />
            </label>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
        <BotonWhatsapp onClick={() => void enviar()} disabled={enviando} className="w-full sm:w-auto">
          {enviando
            ? "Abriendo WhatsApp…"
            : conDiagnostico
              ? "Enviar con diagnóstico"
              : signed || enlaceActual
                ? "Enviar de nuevo"
                : "Enviar por WhatsApp"}
        </BotonWhatsapp>
        {signed?.fileId ? (
          <a href={porTelefono ? verFirmada : `/consultorio/archivo/${signed.fileId}`} className="min-h-11 content-center text-lg text-forest underline underline-offset-4">
            Ver
          </a>
        ) : null}
        {conDiagnostico ? (
          <button type="button" onClick={() => setConDiagnostico(false)} className="min-h-11 cursor-pointer text-forest">
            Cancelar
          </button>
        ) : null}
      </div>
      {error ? <p className="mt-3 text-[#6b2e2a]">{error}</p> : null}

      <button
        type="button"
        aria-expanded={mas}
        onClick={() => setMas((actual) => !actual)}
        className="mt-3 inline-flex min-h-11 cursor-pointer items-center gap-1 text-muted"
      >
        Más opciones
        <span aria-hidden="true" className={`inline-block transition-transform ${mas ? "rotate-90" : ""}`}>
          ›
        </span>
      </button>
      {mas ? (
        <div className="mt-1 grid gap-0.5 border-t border-sand pt-2">
          {propia && !conDiagnostico ? (
            <button type="button" className={opcionMenu} onClick={() => setConDiagnostico(true)}>
              <IconoOpcion nombre="diagnostico" />
              Agregar diagnóstico antes de enviar
            </button>
          ) : null}
          <a className={opcionMenu} href={`/consultorio/consentimientos/${kind}?${new URLSearchParams({ volver })}`}>
            <IconoOpcion nombre="editar" />
            Ver o editar el texto
          </a>
          <a className={opcionMenu} href={imprimir}>
            <IconoOpcion nombre="imprimir" />
            Imprimir para firmar en papel
          </a>
          <label className={`${opcionMenu} has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-forest`}>
            <IconoOpcion nombre="foto" />
            Subir foto del papel firmado
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
          {enlaceActual && !signed ? (
            <button
              type="button"
              className={opcionMenu}
              onClick={() => {
                const absoluta = new URL(enlaceActual, window.location.origin).href;
                void navigator.clipboard.writeText(absoluta).then(
                  () => setCopiado(true),
                  () => setCopiado(false),
                );
              }}
            >
              <IconoOpcion nombre={copiado ? "listo" : "enlace"} />
              {copiado ? "Enlace copiado" : "Copiar enlace"}
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

/** Al imprimir la ficha, el consentimiento general sale completo (en pantalla está en "Ver"). */
function GeneralImpreso({ patient }: { patient: Patient }) {
  const signed = patient.consents.find((item) => item.kind === "general");
  const fabrica = textoDeFabrica("general");
  const texto = signed?.texto ?? (signed?.textVersion === fabrica.version ? fabrica : null);
  const hora = horaFirmada(signed?.signedAt);
  return (
    <article className="mt-6 hidden break-inside-avoid print:block">
      <h3 className="font-serif text-2xl">{NOMBRE_HOJA.general}</h3>
      {signed ? (
        <>
          <p className="mt-2">
            Firmó el {signed.signedOn.split("-").reverse().join("/")}
            {hora ? ` a las ${hora}` : ""}
            {signed.source === "papel" ? " · foto del papel" : ""}
          </p>
          {signed.aclaracion ? <p className="mt-2">Aclaración: {signed.aclaracion}</p> : null}
          {texto ? <ApartadosDelTexto texto={texto} compacto /> : null}
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
              className="mt-4 max-h-48 w-full object-contain"
            />
          ) : null}
        </>
      ) : (
        <p className="mt-2">Sin firmar.</p>
      )}
    </article>
  );
}

function esImagen(file: ChartFile) {
  return file.mime.startsWith("image/") || /\.(png|jpe?g|webp)$/i.test(file.fileName);
}

function esWord(file: ChartFile) {
  return file.mime.includes("word") || /\.docx?$/i.test(file.fileName);
}

