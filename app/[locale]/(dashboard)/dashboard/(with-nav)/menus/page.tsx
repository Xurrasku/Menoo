import Link from "next/link";
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
import { ClickableMenuRow } from "@/components/dashboard/clickable-menu-row";
import { listMenus } from "@/lib/menus/service";
import { buildMenuUrlFromSlug } from "@/lib/restaurants/domain";
import { getDashboardSession } from "@/lib/dashboard/session";
import { resolveLocaleFromParams, type LocaleParams } from "./locale";

type MenusPageProps = {
  params: Promise<LocaleParams>;
};

export default async function MenusPage({ params }: MenusPageProps) {
  const locale = await resolveLocaleFromParams(params);
  const translationPromise = Promise.all([
    getTranslations({
      locale,
      namespace: "dashboard",
    }),
    getTranslations({
      locale,
      namespace: "navigation",
    }),
    getTranslations({
      locale,
      namespace: "dashboard.rowActions",
    }),
    getTranslations({
      locale,
      namespace: "dashboard.availability",
    }),
    getTranslations({
      locale,
      namespace: "dashboard.visibility",
    }),
  ]);
  const sessionPromise = getDashboardSession(locale);
  const menusPromise = sessionPromise.then(({ restaurant }) =>
    listMenus(restaurant.id)
  );

  const [
    [tDashboard, tNavigation, tRowActions, tAvailability, tVisibility],
    { restaurant },
    menusData,
  ] = await Promise.all([translationPromise, sessionPromise, menusPromise]);

  return (
    <div className="flex flex-col gap-[4%] sm:gap-6">
      <Card className="border-0 bg-white shadow-xl shadow-slate-200/60">
        <CardHeader className="flex flex-col gap-[3%] border-b border-slate-100 px-[3%] py-[3%] sm:flex-row sm:items-center sm:justify-between sm:space-y-0 sm:px-8 sm:py-6">
          <div className="flex flex-col gap-[1%]">
            <span className="text-[4vw] font-display font-bold uppercase tracking-widest text-primary md:text-xl">
              {tDashboard("menusTitle")}
            </span>
            <span className="text-[2.5vw] italic text-slate-500 sm:text-sm">
              {tDashboard("menusSubtitle")}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-[2%] sm:gap-3">
            <Button
              asChild
              variant="ghost"
              className="flex items-center gap-[1.5%] rounded-full border border-slate-200 bg-white px-[2.5%] py-[1.5%] text-[2.5vw] font-semibold text-slate-600 shadow-sm hover:bg-slate-50 sm:px-4 sm:text-sm"
            >
              <a
                href={buildMenuUrlFromSlug(restaurant.slug)}
                target="_blank"
                rel="noreferrer"
              >
                <Eye className="h-[3vw] w-[3vw] sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">{tNavigation("viewMenu")}</span>
                <span className="sm:hidden">View</span>
              </a>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-[1.5%] rounded-full border border-slate-200 bg-white px-[2.5%] py-[1.5%] text-[2.5vw] font-semibold text-slate-600 shadow-sm hover:bg-slate-50 sm:px-4 sm:text-sm"
                >
                  <MoreHorizontal className="h-[3vw] w-[3vw] sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">{tNavigation("actions")}</span>
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
            <Button asChild className="rounded-full bg-primary px-[3%] py-[1.5%] text-[2.5vw] font-semibold text-white shadow-sm hover:bg-primary/90 sm:px-5 sm:text-sm">
              <Link href={`/${locale}/dashboard/menus/new`}>
                {tNavigation("newMenu")}
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-100 bg-slate-50/60">
                <TableHead className="w-[40%] px-[3%] py-[3%] text-[2.5vw] font-semibold uppercase tracking-wide text-slate-500 sm:px-8 sm:py-5 sm:text-xs">
                  {tDashboard("table.name")}
                </TableHead>
                <TableHead className="hidden w-[100px] px-6 py-5 text-xs font-semibold uppercase tracking-wide text-slate-500 md:table-cell">
                  
                </TableHead>
                <TableHead className="px-[3%] py-[3%] text-[2.5vw] font-semibold uppercase tracking-wide text-slate-500 sm:px-8 sm:py-5 sm:text-xs">
                  {tDashboard("table.items")}
                </TableHead>
                <TableHead className="hidden px-8 py-5 text-xs font-semibold uppercase tracking-wide text-slate-500 lg:table-cell">
                  {tDashboard("table.availability")}
                </TableHead>
                <TableHead className="px-[3%] py-[3%] text-[2.5vw] font-semibold uppercase tracking-wide text-slate-500 sm:px-8 sm:py-5 sm:text-xs">
                  {tDashboard("table.visibility")}
                </TableHead>
                <TableHead className="px-[3%] py-[3%] sm:px-6 sm:py-5" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {menusData.map((menu) => (
                <ClickableMenuRow
                  key={menu.id}
                  menuId={menu.id}
                  locale={locale}
                  className="group cursor-pointer bg-white transition hover:bg-slate-50"
                >
                  <TableCell className="px-[3%] py-[3%] sm:px-8 sm:py-6">
                    <div className="flex items-center gap-[2.5%] sm:gap-4">
                      <div className="flex h-[8vw] w-[8vw] flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary sm:h-12 sm:w-12 sm:rounded-xl">
                        <UtensilsCrossed className="h-[4vw] w-[4vw] sm:h-5 sm:w-5" />
                      </div>
                      <div className="min-w-0 flex-1 flex-col">
                        <MenuNameEditor
                          menuId={menu.id}
                          initialValue={menu.name}
                          className="w-full"
                          isEditable={false}
                        />
                        {typeof menu.categories === "number" && (
                          <span className="text-[2vw] font-medium text-slate-400 sm:text-xs">
                            {tDashboard("menuCategories", {
                              count: menu.categories,
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden px-6 py-6 md:table-cell">
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
                  <TableCell className="px-[3%] py-[3%] text-[3vw] font-semibold text-slate-700 sm:px-8 sm:py-6 sm:text-base">
                    {menu.items}
                  </TableCell>
                  <TableCell className="hidden px-8 py-6 text-sm font-medium text-slate-500 lg:table-cell">
                    {tAvailability("everyday")}
                  </TableCell>
                  <TableCell className="px-[3%] py-[3%] sm:px-8 sm:py-6">
                    <div className="flex items-center gap-[1.5%] sm:gap-3">
                      <Switch defaultChecked={true} />
                      <span className="text-[2.5vw] font-medium text-slate-500 sm:text-sm">
                        {tVisibility("visible")}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-[3%] py-[3%] text-right sm:px-6 sm:py-6">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-[5.5vw] w-[5.5vw] rounded-full border border-slate-200 text-slate-500 hover:text-slate-900 sm:h-8 sm:w-8"
                        >
                          <MoreHorizontal className="h-[3vw] w-[3vw] sm:h-4 sm:w-4" />
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
                </ClickableMenuRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

