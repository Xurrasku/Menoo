import { mockMenus } from "./menus";

import type { MenuCategory, MenuDetail } from "@/lib/types/menu";

const menuCategories: Record<string, MenuCategory[]> = {
  "menu-1": [
    {
      id: "menu-1-cat-1",
      name: "Entrants",
      description: "Plats per obrir l'apetit amb productes de temporada.",
    },
    {
      id: "menu-1-cat-2",
      name: "Plats principals",
      description: "Especialitats de la casa cuinades lentament.",
    },
  ],
  "menu-2": [],
};

export const mockMenuDetails: Record<string, MenuDetail> = Object.fromEntries(
  mockMenus.map((menu) => [
    menu.id,
    {
      id: menu.id,
      name: menu.name,
      categories: menuCategories[menu.id] ?? [],
    },
  ]),
);

export function getMockMenuDetail(menuId: string): MenuDetail | null {
  return mockMenuDetails[menuId] ?? null;
}

