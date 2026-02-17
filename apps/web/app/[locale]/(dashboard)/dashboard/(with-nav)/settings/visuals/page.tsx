import { desc, eq } from "drizzle-orm";

import { restaurants, visualAssets, visualPromptGallery } from "@/db/schema";
import { VisualsImageEnhancer } from "@/components/settings/visuals-image-enhancer";
import { requireUser } from "@/lib/auth/server";
import { db } from "@/lib/db";

type VisualsPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function VisualsPage({ params }: VisualsPageProps) {
  const { locale } = await params;
  const user = await requireUser(locale);

  let initialGallery: Array<{
    id: string;
    imageDataUrl: string;
    originalFileName: string | null;
    createdAt: string;
  }> = [];
  let initialPromptGallery: Array<{
    id: string;
    title: string;
    prompt: string;
    styleConfig: Record<string, unknown> | null;
    previewImageDataUrl: string | null;
    sourceAssetId: string | null;
    createdAt: string;
  }> = [];

  if (db) {
    const [restaurant] = await db
      .select({ id: restaurants.id })
      .from(restaurants)
      .where(eq(restaurants.ownerUserId, user.id))
      .limit(1);

    if (restaurant) {
      const assets = await db
        .select({
          id: visualAssets.id,
          imageDataUrl: visualAssets.imageDataUrl,
          originalFileName: visualAssets.originalFileName,
          createdAt: visualAssets.createdAt,
        })
        .from(visualAssets)
        .where(eq(visualAssets.restaurantId, restaurant.id))
        .orderBy(desc(visualAssets.createdAt))
        .limit(30);

      initialGallery = assets.map((asset) => ({
        id: asset.id,
        imageDataUrl: asset.imageDataUrl,
        originalFileName: asset.originalFileName,
        createdAt: asset.createdAt.toISOString(),
      }));

      const prompts = await db
        .select({
          id: visualPromptGallery.id,
          title: visualPromptGallery.title,
          prompt: visualPromptGallery.prompt,
          styleConfig: visualPromptGallery.styleConfig,
          previewImageDataUrl: visualPromptGallery.previewImageDataUrl,
          sourceAssetId: visualPromptGallery.sourceAssetId,
          createdAt: visualPromptGallery.createdAt,
        })
        .from(visualPromptGallery)
        .where(eq(visualPromptGallery.restaurantId, restaurant.id))
        .orderBy(desc(visualPromptGallery.createdAt))
        .limit(30);

      initialPromptGallery = prompts.map((entry) => ({
        id: entry.id,
        title: entry.title,
        prompt: entry.prompt,
        styleConfig: (entry.styleConfig ?? null) as Record<string, unknown> | null,
        previewImageDataUrl: entry.previewImageDataUrl,
        sourceAssetId: entry.sourceAssetId,
        createdAt: entry.createdAt.toISOString(),
      }));
    }
  }

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-dashed border-primary/20 bg-white p-[4%] shadow-xl shadow-slate-200/60 sm:p-10 overflow-hidden">
        <header className="flex flex-col gap-[2%] sm:gap-3">
          <h2 className="text-[4.5vw] font-bold text-slate-900 sm:text-3xl">Visuales</h2>
          <p className="max-w-2xl text-[2.8vw] text-slate-500 sm:text-base">
            Mejora fotos de platos para usarlas en tu menú digital.
          </p>
        </header>

        <div className="mt-[5%] sm:mt-10">
          <VisualsImageEnhancer
            initialGallery={initialGallery}
            initialPromptGallery={initialPromptGallery}
          />
        </div>
      </div>

      <a
        href={`/${locale}/dashboard/settings`}
        className="inline-flex text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        ← Volver
      </a>
    </section>
  );
}
