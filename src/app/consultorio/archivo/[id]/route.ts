import { hasSession } from "@/lib/consultorio/guard";
import { readStore, readUpload } from "@/lib/consultorio/store";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await hasSession())) {
    return new Response("No autorizado", { status: 401 });
  }
  const { id } = await context.params;
  const store = await readStore();
  const consent = store.patients
    .flatMap((patient) => patient.consents)
    .find((item) => item.fileId === id);
  const chartFile = store.patients
    .flatMap((patient) => patient.files ?? [])
    .find((item) => item.fileId === id);
  const mime = consent?.mime || chartFile?.mime;
  const fileName = consent?.fileName || chartFile?.fileName;
  if (!consent && !chartFile) return new Response("No encontrado", { status: 404 });

  const bytes = await readUpload(id);
  if (!bytes) return new Response("No encontrado", { status: 404 });

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": mime || "application/octet-stream",
      "Content-Disposition": disposition(fileName ?? "", mime ?? ""),
      "Cache-Control": "private, no-store",
    },
  });
}

function disposition(fileName: string, mime: string) {
  const word = mime === "application/msword" || mime.includes("wordprocessingml");
  if (!word) return "inline";
  const clean = fileName.replace(/["\r\n\\]/g, "") || "archivo";
  return `attachment; filename="${clean}"`;
}
