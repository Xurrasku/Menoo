export type LocaleParams = {
  locale: string;
};

export type LocaleParamsInput = LocaleParams | Promise<LocaleParams>;

export async function resolveLocaleFromParams(
  params: LocaleParamsInput,
): Promise<string> {
  const { locale } = await params;

  return locale;
}








