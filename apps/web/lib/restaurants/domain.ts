function normalizeBaseUrl(base: string) {
  return base.trim().replace(/\/+$/, "");
}

export function toSlug(input: string) {
  const normalized = input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[\u2019'’]/g, "")
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

  return {
    slug,
    url: buildMenuUrlFromSlug(slug),
  } as const;
}

export type MenuDomain = ReturnType<typeof buildMenuDomain>;

export function buildMenuUrlFromSlug(slugInput: string) {
  const normalizedSlug = slugInput.trim().replace(/^\/+|\/+$/g, "");

  if (!normalizedSlug) {
    throw new Error("Restaurant slug is required to build a menu URL");
  }

  return `${getMenuDomainBase()}/menu/${normalizedSlug}`;
}

export function getMenuDomainBase() {
  const candidates = [
    process.env.NEXT_PUBLIC_MENU_DOMAIN_BASE,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_VERCEL_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : undefined,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  ];

  for (const candidate of candidates) {
    if (candidate && candidate.trim().length > 0) {
      return normalizeBaseUrl(candidate);
    }
  }

  return normalizeBaseUrl("https://menoo.app");
}

