export type MenuAvailabilityKey = "everyday";

export type MenuRow = {
  id: string;
  name: string;
  items: number;
  availabilityKey: MenuAvailabilityKey;
  isVisible: boolean;
  categories?: number;
};

export const mockMenus: MenuRow[] = [
  {
    id: "menu-1",
    name: "Entrants i plats principals",
    items: 3,
    availabilityKey: "everyday",
    isVisible: true,
    categories: 2,
  },
  {
    id: "menu-2",
    name: "Nuestro menú",
    items: 0,
    availabilityKey: "everyday",
    isVisible: true,
    categories: 0,
  },
];

