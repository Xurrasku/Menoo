import { notFound } from "next/navigation";

import { NewMenuScreen } from "@/components/dashboard/new-menu-screen";
import { getMenuDetailMessages } from "@/lib/dashboard/menu-detail-messages";
import { getMockMenuDetail } from "@/lib/mock/menu-details";

type EditMenuPageProps = {
  params: Promise<{
    locale: string;
    menuId: string;
  }>;
};

export default async function EditMenuPage({ params }: EditMenuPageProps) {
  const { locale, menuId } = await params;
  const menuMessages = await getMenuDetailMessages(locale);
  const menuDetail = getMockMenuDetail(menuId);

  if (!menuDetail) {
    notFound();
  }

  return <NewMenuScreen locale={locale} menu={menuMessages} initialMenu={menuDetail} />;
}

