import { VisualsImageEnhancer } from "@/components/settings/visuals-image-enhancer";

type VisualsPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function VisualsPage({ params }: VisualsPageProps) {
  const { locale } = await params;

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
          <VisualsImageEnhancer />
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
