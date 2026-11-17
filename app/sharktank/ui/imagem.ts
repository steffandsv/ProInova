"use client";

/**
 * Reduz a foto no próprio aparelho antes de enviar (celular manda fotos de 5–10 MB).
 * Mantém a proporção, limita o lado maior e gera JPEG leve (~100–250 KB).
 */
export async function reduzirImagem(file: File, ladoMax = 1200, qualidade = 0.86): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const escala = Math.min(1, ladoMax / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * escala));
    const h = Math.max(1, Math.round(img.naturalHeight * escala));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, "image/jpeg", qualidade));
    if (!blob) throw new Error("Falha ao processar a imagem");
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}
