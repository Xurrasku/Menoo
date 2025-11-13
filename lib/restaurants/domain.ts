function normalizeBaseUrl(base: string) {
  return base.trim().replace(/\/+$/, "");
}

function toSlug(input: string) {
  const normalized = input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized;
}

export function buildMenuDomain(name: string) {
  const trimmed = name.trim();

  if (!trimmed) {
    throw new Error("Restaurant name is required to create a menu domain");
  }

  const slug = toSlug(trimmed);

  if (!slug) {
    throw new Error("Restaurant name must include alphanumeric characters");
  }

  const base = getMenuDomainBase();

  return {
    slug,
    url: `${base}/${slug}`,
  } as const;
}

export type MenuDomain = ReturnType<typeof buildMenuDomain>;

export function getMenuDomainBase() {
  const envOverride = process.env.NEXT_PUBLIC_MENU_DOMAIN_BASE;
  if (envOverride && envOverride.trim().length > 0) {
    return normalizeBaseUrl(envOverride);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl && appUrl.trim().length > 0) {
    return normalizeBaseUrl(appUrl);
  }

  return normalizeBaseUrl("https://menoo.app");
}

