import { parrafos, type TextoConsentimiento } from "@/lib/consultorio/consents";

/**
 * Los apartados de un consentimiento: título numerado (si tiene) y sus párrafos.
 * Lo usan el teléfono del paciente, la hoja para imprimir y la ficha.
 */
export function ApartadosDelTexto({ texto, compacto = false }: { texto: TextoConsentimiento; compacto?: boolean }) {
  // Solo se numeran los apartados con título.
  const numeros: number[] = [];
  let contador = 0;
  for (const apartado of texto.apartados) {
    if (apartado.titulo) contador += 1;
    numeros.push(contador);
  }
  return (
    <>
      {texto.apartados.map((apartado, index) => {
        const numero = numeros[index];
        return (
          <section key={index} className="break-inside-avoid-page">
            {apartado.titulo ? (
              <h2 className={`font-serif text-xl ${compacto ? "mt-7 print:mt-4" : "mt-7"}`}>
                {numero}. {apartado.titulo}
              </h2>
            ) : null}
            <div className={apartado.titulo ? "" : index === 0 ? "mt-6 print:mt-3" : "mt-2"}>
              {parrafos(apartado.texto).map((parrafo, linea) => (
                <p
                  key={linea}
                  className={`text-base leading-6 ${apartado.titulo || linea > 0 ? "mt-2" : ""} ${
                    compacto ? "print:mt-1 print:text-[11pt] print:leading-[1.4]" : ""
                  }`}
                >
                  {parrafo}
                </p>
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}
