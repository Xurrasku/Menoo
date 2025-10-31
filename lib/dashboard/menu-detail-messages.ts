import { getTranslations } from "next-intl/server";

import type { MenuDetailMessages } from "@/components/dashboard/new-menu-screen";

export async function getMenuDetailMessages(locale: string): Promise<MenuDetailMessages> {
  const tMenuDetail = await getTranslations({
    locale,
    namespace: "dashboard.menuDetail",
  });

  return {
    back: tMenuDetail("back"),
    title: tMenuDetail("title"),
    untitledCategory: tMenuDetail("untitledCategory"),
    collapse: tMenuDetail("collapse"),
    emptyDescription: tMenuDetail("emptyDescription"),
    newDish: tMenuDetail("newDish"),
    newCategory: tMenuDetail("newCategory"),
    categoryModal: {
      title: tMenuDetail("categoryModal.title"),
      nameLabel: tMenuDetail("categoryModal.nameLabel"),
      descriptionLabel: tMenuDetail("categoryModal.descriptionLabel"),
      save: tMenuDetail("categoryModal.save"),
      cancel: tMenuDetail("categoryModal.cancel"),
    },
    dishModal: {
      title: tMenuDetail("dishModal.title"),
      nameLabel: tMenuDetail("dishModal.nameLabel"),
      descriptionLabel: tMenuDetail("dishModal.descriptionLabel"),
      priceLabel: tMenuDetail("dishModal.priceLabel"),
      priceHint: tMenuDetail("dishModal.priceHint"),
      imageUpload: tMenuDetail("dishModal.imageUpload"),
      imageHelper: tMenuDetail("dishModal.imageHelper"),
      labelsTitle: tMenuDetail("dishModal.labelsTitle"),
      allergensTitle: tMenuDetail("dishModal.allergensTitle"),
      save: tMenuDetail("dishModal.save"),
      cancel: tMenuDetail("dishModal.cancel"),
    },
  } as const;
}

