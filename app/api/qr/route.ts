import { NextRequest } from "next/server";
import QRCode from "qrcode";
import { z } from "zod";

export const runtime = "nodejs";

const qrSchema = z.object({
  url: z.string().url(),
  format: z.enum(["png", "svg"]).default("png"),
  width: z.number().int().min(128).max(1024).optional().default(512),
  margin: z.number().int().min(0).max(8).optional().default(1),
});

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);
  const result = qrSchema.safeParse(payload);

  if (!result.success) {
    return Response.json(
      { error: result.error.flatten() },
      { status: 400 }
    );
  }

  const { url, format, width, margin } = result.data;

  if (format === "svg") {
    const svg = await QRCode.toString(url, {
      type: "svg",
      margin,
      width,
    });

    return new Response(svg, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  const pngBuffer = await QRCode.toBuffer(url, {
    type: "png",
    margin,
    width,
  });

  const pngBytes = new Uint8Array(pngBuffer);

  return new Response(pngBytes, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

