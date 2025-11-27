import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Eye, MoreHorizontal, UtensilsCrossed } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MenuNameEditor } from "@/components/dashboard/menu-name-editor";
import { requireUser } from "@/lib/auth/server";
import { getRestaurantByOwnerId } from "@/lib/restaurants/service";
import { listMenus } from "@/lib/menus/service";
import { resolveLocaleFromParams, type LocaleParamsInput } from "./locale";

type MenusPageProps = {
  params: LocaleParamsInput;
};

export default async function MenusPage({ params }: MenusPageProps) {
  const locale = await resolveLocaleFromParams(params);
  const tDashboard = await getTranslations({
    locale,
    namespace: "dashboard",
  });
  const tNavigation = await getTranslations({
    locale,
    namespace: "navigation",
  });
  const tRowActions = await getTranslations({
    locale,
    namespace: "dashboard.rowActions",
  });
  const tAvailability = await getTranslations({
    locale,
    namespace: "dashboard.availability",
  });
  const tVisibility = await getTranslations({
    locale,
    namespace: "dashboard.visibility",
  });
  const user = await requireUser(locale);
  const restaurant = await getRestaurantByOwnerId(user.id);

  if (!restaurant) {
    redirect(`/${locale}/dashboard/restaurant`);
  }

  const menusData = await listMenus(restaurant.id);

  return (
    <div className="flex flex-col gap-6">
      <Card className="border-0 bg-white shadow-xl shadow-slate-200/60">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-slate-100 px-8 py-6">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold uppercase tracking-widest text-primary">
              {tDashboard("menusTitle")}
            </span>
            <span className="text-sm text-slate-500">
              {tDashboard("menusSubtitle")}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              asChild
              variant="ghost"
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50"
            >
              <Link href={`/${restaurant.slug}`} target="_blank" rel="noreferrer">
                <Eye className="h-4 w-4" />
                {tNavigation("viewMenu")}
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  {tNavigation("actions")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>{tRowActions("edit")}</DropdownMenuItem>
                <DropdownMenuItem>{tRowActions("duplicate")}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  {tRowActions("archive")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button asChild className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90">
              <Link href={`/${locale}/dashboard/menus/new`}>
                {tNavigation("newMenu")}
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-100 bg-slate-50/60">
                <TableHead className="w-[40%] px-8 py-5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {tDashboard("table.name")}
                </TableHead>
                <TableHead className="w-[100px] px-6 py-5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  
                </TableHead>
                <TableHead className="px-8 py-5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {tDashboard("table.items")}
                </TableHead>
                <TableHead className="px-8 py-5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {tDashboard("table.availability")}
                </TableHead>
                <TableHead className="px-8 py-5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {tDashboard("table.visibility")}
                </TableHead>
                <TableHead className="px-6 py-5" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {menusData.map((menu) => (
                <TableRow key={menu.id} className="group bg-white">
                  <TableCell className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <UtensilsCrossed className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col">
                        <MenuNameEditor
                          menuId={menu.id}
                          initialValue={menu.name}
                          className="w-full"
                          isEditable={false}
                        />
                        {typeof menu.categories === "number" && (
                          <span className="text-xs font-medium text-slate-400">
                            {tDashboard("menuCategories", {
                              count: menu.categories,
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-6">
                    <Button
                      asChild
                      variant="outline"
                      className="w-[80px] justify-center rounded-full border border-slate-300 px-4 py-1 text-sm font-medium text-slate-600 opacity-0 transition group-hover:opacity-100"
                    >
                      <Link href={`/${locale}/dashboard/menus/${menu.id}/edit`}>
                        {tRowActions("edit")}
                      </Link>
                    </Button>
                  </TableCell>
                  <TableCell className="px-8 py-6 text-base font-semibold text-slate-700">
                    {menu.items}
                  </TableCell>
                  <TableCell className="px-8 py-6 text-sm font-medium text-slate-500">
                    {tAvailability("everyday")}
                  </TableCell>
                  <TableCell className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <Switch defaultChecked={true} />
                      <span className="text-sm font-medium text-slate-500">
                        {tVisibility("visible")}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-6 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full border border-slate-200 text-slate-500 hover:text-slate-900"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem asChild>
                          <Link href={`/${locale}/dashboard/menus/${menu.id}/edit`}>
                            {tRowActions("edit")}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>{tRowActions("duplicate")}</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          {tRowActions("archive")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

