import { getTranslations } from "next-intl/server";
import { Eye, TrendingUp, Calendar, BarChart3 } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getDashboardSession } from "@/lib/dashboard/session";
import { getMenuViewStats } from "@/lib/analytics/service";
import { resolveLocaleFromParams, type LocaleParams } from "../menus/locale";

type StatisticsPageProps = {
  params: Promise<LocaleParams>;
};

export default async function StatisticsPage({
  params,
}: StatisticsPageProps) {
  const locale = await resolveLocaleFromParams(params);
  const [tDashboard, tNavigation] = await Promise.all([
    getTranslations({
      locale,
      namespace: "dashboard",
    }),
    getTranslations({
      locale,
      namespace: "navigation",
    }),
  ]);

  const { restaurant } = await getDashboardSession(locale);
  const stats = await getMenuViewStats(restaurant.id);

  return (
    <div className="flex flex-col gap-[4%] sm:gap-6">
      <Card className="border-0 bg-white shadow-xl shadow-slate-200/60">
        <CardHeader className="border-b border-slate-100 px-[4%] py-[3.5%] sm:px-8 sm:py-6">
          <div className="flex flex-col gap-[1%]">
            <span className="text-[3vw] font-semibold uppercase tracking-widest text-primary sm:text-sm">
              {tNavigation("statistics")}
            </span>
            <span className="text-[2.5vw] text-slate-500 sm:text-sm">
              {tDashboard("analyticsSubtitle")}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-[4%] sm:p-8">
          <div className="grid grid-cols-1 gap-[3%] sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={Eye}
              label={tDashboard("analytics.totalViews")}
              value={stats.totalViews}
              className="bg-primary/10 text-primary"
            />
            <StatCard
              icon={Calendar}
              label={tDashboard("analytics.viewsToday")}
              value={stats.viewsToday}
              className="bg-blue-500/10 text-blue-600"
            />
            <StatCard
              icon={TrendingUp}
              label={tDashboard("analytics.viewsThisWeek")}
              value={stats.viewsThisWeek}
              className="bg-green-500/10 text-green-600"
            />
            <StatCard
              icon={BarChart3}
              label={tDashboard("analytics.viewsThisMonth")}
              value={stats.viewsThisMonth}
              className="bg-purple-500/10 text-purple-600"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

type StatCardProps = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  className?: string;
};

function StatCard({ icon: Icon, label, value, className }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-[3%] shadow-sm sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-[1%]">
          <p className="text-[2.5vw] font-medium text-slate-500 sm:text-sm">{label}</p>
          <p className="text-[5vw] font-bold text-slate-900 sm:text-3xl">{value.toLocaleString()}</p>
        </div>
        <div className={`flex h-[10vw] w-[10vw] items-center justify-center rounded-lg sm:h-14 sm:w-14 ${className ?? ""}`}>
          <Icon className="h-[5vw] w-[5vw] sm:h-7 sm:w-7" />
        </div>
      </div>
    </div>
  );
}

