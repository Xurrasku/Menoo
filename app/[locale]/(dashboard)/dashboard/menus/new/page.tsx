import { NewMenuScreen } from "@/components/dashboard/new-menu-screen";
import { getMenuDetailMessages } from "@/lib/dashboard/menu-detail-messages";

type NewMenuPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function NewMenuPage({ params }: NewMenuPageProps) {
  const { locale } = await params;
  const menuMessages = await getMenuDetailMessages(locale);

  return <NewMenuScreen locale={locale} menu={menuMessages} />;
}
