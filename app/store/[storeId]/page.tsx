"use client";

import React, { useEffect, useState } from "react";
import { useAppSelector } from "@/lib/store/hooks";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { createApiClient } from "@/lib/apiClient";
import { store } from "@/lib/store";
import { API_ENDPOINTS } from "@/app/api/endpoints";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  IndianRupee,
  Calendar,
  AlertCircle,
  HelpCircle,
  Percent,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function StoreDashboardPage() {
  const { activeStore } = useAppSelector((state) => state.stores);
  const { user } = useAppSelector((state) => state.auth);
  const { t, language } = useLanguage();

  const storeId = activeStore?.id;
  const storeName = activeStore?.name || t("dashboard.storeOwner");

  // Local dashboard data states
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeChartType, setActiveChartType] = useState<"line" | "bar">("line");

  useEffect(() => {
    if (!storeId) return;

    const fetchSummary = async () => {
      setLoading(true);
      try {
        const client = createApiClient(store.getState);
        const data = await client.get<any>(API_ENDPOINTS.backend.dashboard.summary);

        // Safe sanitization of 90-character decimal strings into normal floats
        setSummary({
          total_sales: data.total_sales ? Number(data.total_sales) : 0,
          total_purchases: data.total_purchases ? Number(data.total_purchases) : 0,
          total_expenses: data.total_expenses ? Number(data.total_expenses) : 0,
          net_profit: data.net_profit ? Number(data.net_profit) : 0,
          cogs: data.cogs ? Number(data.cogs) : 0,
          total_receivables: data.total_receivables ? Number(data.total_receivables) : 0,
          total_payables: data.total_payables ? Number(data.total_payables) : 0,
          weekly_sales: Array.isArray(data.weekly_sales)
            ? data.weekly_sales.map((ws: any) => ({
              date: ws.date,
              sales: ws.sales ? Number(ws.sales) : 0,
            }))
            : [],
          top_products: Array.isArray(data.top_products)
            ? data.top_products.map((tp: any) => ({
              product_id: tp.product_id,
              product_name: tp.product_name || "Unknown Product",
              quantity_sold: tp.quantity_sold ? Number(tp.quantity_sold) : 0,
              revenue: tp.revenue ? Number(tp.revenue) : 0,
            }))
            : [],
          top_debtors: Array.isArray(data.top_debtors)
            ? data.top_debtors.map((td: any) => ({
              party_id: td.party_id,
              party_name: td.party_name || "Unknown Debtor",
              balance: td.balance ? Number(td.balance) : 0,
              phone: td.phone || "",
            }))
            : [],
        });
      } catch (err) {
        console.error("Failed to load dashboard summary stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [storeId]);

  if (loading || !summary) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-1/3 bg-slate-200 rounded-lg" />
        <div className="h-44 w-full bg-slate-200 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-slate-200 rounded-xl" />
          <div className="h-72 bg-slate-200 rounded-xl" />
        </div>
      </div>
    );
  }

  // Calculate gross margin %
  const grossMargin = summary.total_sales > 0
    ? ((summary.total_sales - summary.cogs) / summary.total_sales) * 100
    : 0;

  // Custom SVG Sparkline Calculation
  const getSvgCoordinates = () => {
    const height = 150;
    const paddingBottom = 20;
    const points = summary.weekly_sales;
    if (points.length === 0) return { linePath: "", areaPath: "", coordinates: [], maxVal: 1000, height, paddingBottom };

    const maxVal = Math.max(...points.map((p: any) => p.sales), 1000);
    const width = 500;
    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 20;

    const usableWidth = width - paddingLeft - paddingRight;
    const usableHeight = height - paddingTop - paddingBottom;

    const coordinates = points.map((p: any, idx: number) => {
      const x = paddingLeft + (idx / Math.max(1, points.length - 1)) * usableWidth;
      const y = height - paddingBottom - (p.sales / maxVal) * usableHeight;
      return { x, y, sales: p.sales, date: p.date };
    });

    const linePath = coordinates.reduce(
      (path: string, pt: any, idx: number) =>
        idx === 0 ? `M ${pt.x} ${pt.y}` : `${path} L ${pt.x} ${pt.y}`,
      ""
    );

    const areaPath = coordinates.length > 0
      ? `${linePath} L ${coordinates[coordinates.length - 1].x} ${height - paddingBottom} L ${coordinates[0].x} ${height - paddingBottom} Z`
      : "";

    return { linePath, areaPath, coordinates, maxVal, height, paddingBottom };
  };

  const { linePath, areaPath, coordinates, maxVal, height, paddingBottom } = getSvgCoordinates();

  return (
    <div className="flex flex-col gap-6 font-sans">

      {/* Top Welcome Titlebar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-extrabold text-[#151328] tracking-tight">
            {t("dashboard.title")}
          </h1>
          <p className="mt-0.5 text-xs font-semibold text-[#65637D] flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping inline-block" />
            {t("dashboard.todayAt")} <span className="font-bold text-[#151328]">{storeName}</span> —
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2">
          <div className="h-9.5 px-3 rounded-lg border border-[#E4E4F0] bg-white text-xs font-bold text-[#65637D] flex items-center gap-1.5 cursor-pointer shadow-xs">
            <Calendar className="h-3.5 w-3.5" />
            {t("dashboard.thisMonth")}
          </div>

          <Link
            href={`/store/${storeId}/sales`}
            className="h-9.5 px-4 bg-[#FF6B5B] hover:bg-[#E05344] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            {t("dashboard.quickActionRecordSale")}
          </Link>

          <Link
            href={`/store/${storeId}/purchases/import`}
            className="h-9.5 px-4 bg-[#4338CA] hover:bg-[#372f9f] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Upload className="h-3.5 w-3.5" />
            {language === "hi" ? "खरीद इम्पोर्ट / Import Purchase" : "Import Purchase"}
          </Link>
        </div>
      </div>

      {/* SECTION 1: Net Profit breakdown card (Hero card) */}
      <div className="bg-white rounded-xl border border-[#E4E4F0] p-6 shadow-sm relative overflow-hidden">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              {t("dashboard.netProfitTitle")}
            </span>
            <div className="flex items-baseline gap-2.5 mt-1.5">
              <h2 className="text-3xl font-extrabold text-[#151328] tracking-tight font-mono">
                ₹{summary.net_profit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </h2>
              <span className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border font-mono",
                summary.net_profit >= 0
                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                  : "bg-red-50 text-red-700 border-red-100"
              )}>
                {summary.net_profit >= 0 ? "▲" : "▼"}{summary.total_sales > 0 ? ((summary.net_profit / summary.total_sales) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Breakdown formula strip */}
        <div className="border-t border-[#F1F1F5] pt-4.5 mt-5 flex flex-wrap items-center gap-y-3 gap-x-6 text-xs font-semibold text-[#65637D]">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">{t("dashboard.totalSales")}:</span>
            <span className="font-bold font-mono text-[#151328]">₹{summary.total_sales.toFixed(2)}</span>
          </div>
          <span className="text-[#4338CA] font-bold shrink-0">−</span>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">{t("dashboard.cogs")}:</span>
            <span className="font-bold font-mono text-[#151328]">₹{summary.cogs.toFixed(2)}</span>
          </div>
          <span className="text-[#4338CA] font-bold shrink-0">−</span>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">{t("dashboard.expenses")}:</span>
            <span className="font-bold font-mono text-[#151328]">₹{summary.total_expenses.toFixed(2)}</span>
          </div>
          <span className="text-[#4338CA] font-bold shrink-0">＝</span>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
            <span className="text-[#4338CA] font-bold">{t("dashboard.netProfitFormula")}:</span>
            <span className="font-extrabold font-mono text-[#151328]">₹{summary.net_profit.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* SECTION 2: Key Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

        {/* Total Purchases */}
        <div className="bg-white rounded-xl border border-[#E4E4F0] p-4.5 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            {t("dashboard.totalPurchases")}
          </span>
          <h3 className="text-lg font-extrabold font-mono text-[#151328] mt-1.5">
            ₹{summary.total_purchases.toFixed(2)}
          </h3>
          <span className="text-[10px] font-semibold text-[#65637D]/60 mt-1 block">
            {t("dashboard.thisMonth")}
          </span>
        </div>

        {/* Receivables */}
        <div className="bg-white rounded-xl border border-[#E4E4F0] p-4.5 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            {t("dashboard.receivables")}
          </span>
          <h3 className="text-lg font-extrabold font-mono text-emerald-600 mt-1.5">
            ₹{summary.total_receivables.toFixed(2)}
          </h3>
          <span className="text-[10px] font-semibold text-[#65637D]/60 mt-1 block">
            {t("dashboard.receivablesSub")}
          </span>
        </div>

        {/* Payables */}
        <div className="bg-white rounded-xl border border-[#E4E4F0] p-4.5 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            {t("dashboard.payables")}
          </span>
          <h3 className="text-lg font-extrabold font-mono text-amber-600 mt-1.5">
            ₹{summary.total_payables.toFixed(2)}
          </h3>
          <span className="text-[10px] font-semibold text-[#65637D]/60 mt-1 block">
            {t("dashboard.payablesSub")}
          </span>
        </div>

        {/* Gross Margin % */}
        <div className="bg-white rounded-xl border border-[#E4E4F0] p-4.5 shadow-sm flex items-center justify-between gap-3">
          <div className="flex flex-col justify-between h-full">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {t("dashboard.grossMargin")}
            </span>
            <h3 className="text-lg font-extrabold font-mono text-[#151328] mt-1.5">
              {grossMargin.toFixed(1)}%
            </h3>
            <span className="text-[10px] font-semibold text-[#65637D]/60 mt-1 block">
              {t("dashboard.thisMonth")}
            </span>
          </div>

          {/* Progress Ring */}
          <div className="relative h-12 w-12 shrink-0">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="18"
                className="stroke-slate-100 fill-none"
                strokeWidth="4.5"
              />
              <circle
                cx="24"
                cy="24"
                r="18"
                className="stroke-[#4338CA] fill-none transition-all duration-300"
                strokeWidth="4.5"
                strokeDasharray={`${2 * Math.PI * 18}`}
                strokeDashoffset={`${2 * Math.PI * 18 * (1 - grossMargin / 100)}`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-extrabold text-[#4338CA]">
              %
            </div>
          </div>
        </div>

      </div>

      {/* SECTION 3 & 4: Sales chart + Debtors Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Sales trend chart (60% width) */}
        <div className="bg-white rounded-xl border border-[#E4E4F0] p-5 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b pb-3 mb-4">
            <h2 className="text-sm font-bold text-[#151328]">{t("dashboard.salesTrend")}</h2>
            <div className="flex bg-[#F7F7FB] border border-[#E4E4F0] p-0.5 rounded-lg text-xs font-bold text-[#65637D]">
              <button
                onClick={() => setActiveChartType("line")}
                className={cn("px-2.5 py-1 rounded-md cursor-pointer", activeChartType === "line" && "bg-white shadow-xs text-brand")}
              >
                {t("dashboard.line")}
              </button>
              <button
                onClick={() => setActiveChartType("bar")}
                className={cn("px-2.5 py-1 rounded-md cursor-pointer", activeChartType === "bar" && "bg-white shadow-xs text-brand")}
              >
                {t("dashboard.bar")}
              </button>
            </div>
          </div>

          {/* SVG Chart Plotting Area */}
          <div className="flex-1 w-full min-h-[160px] flex items-center justify-center">
            {summary.weekly_sales.length === 0 ? (
              <span className="text-xs text-slate-400 font-semibold">No sales logged this week</span>
            ) : (
              <svg viewBox={`0 0 500 150`} className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4338CA" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#4338CA" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Y-axis guidelines */}
                {[0, 0.5, 1].map((r, i) => (
                  <line
                    key={i}
                    x1="35"
                    y1={20 + r * 110}
                    x2="480"
                    y2={20 + r * 110}
                    stroke="#F1F1F5"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                ))}

                {/* Y-axis labels */}
                <text x="5" y="25" fill="#98A2B3" className="text-[9px] font-semibold font-mono">₹{maxVal >= 1000 ? `${(maxVal / 1000).toFixed(0)}k` : maxVal}</text>
                <text x="5" y="78" fill="#98A2B3" className="text-[9px] font-semibold font-mono">₹{maxVal >= 1000 ? `${(maxVal / 2000).toFixed(0)}k` : (maxVal / 2).toFixed(0)}</text>
                <text x="5" y="132" fill="#98A2B3" className="text-[9px] font-semibold font-mono">₹0</text>

                {activeChartType === "line" ? (
                  <>
                    {/* Area fill */}
                    {areaPath && (
                      <path d={areaPath} fill="url(#chartGrad)" />
                    )}
                    {/* Line stroke */}
                    {linePath && (
                      <path d={linePath} fill="none" stroke="#4338CA" strokeWidth="2.5" strokeLinecap="round" />
                    )}
                    {/* Interactive dots */}
                    {coordinates.map((pt: any, idx: number) => (
                      <circle
                        key={idx}
                        cx={pt.x}
                        cy={pt.y}
                        r="3.5"
                        className="fill-white stroke-[#4338CA] stroke-2 hover:r-5 cursor-pointer transition-all"
                      />
                    ))}
                  </>
                ) : (
                  // Custom bar columns
                  coordinates.map((pt: any, idx: number) => {
                    const barWidth = 18;
                    const barHeight = height - paddingBottom - pt.y;
                    return (
                      <g key={idx} className="group cursor-pointer">
                        <rect
                          x={pt.x - barWidth / 2}
                          y={pt.y}
                          width={barWidth}
                          height={Math.max(4, barHeight)}
                          rx="3"
                          className="fill-[#4338CA] opacity-80 group-hover:opacity-100 transition-all"
                        />
                      </g>
                    );
                  })
                )}

                {/* X-axis date labels */}
                {coordinates.map((pt: any, idx: number) => (
                  <text
                    key={idx}
                    x={pt.x}
                    y="148"
                    textAnchor="middle"
                    fill="#98A2B3"
                    className="text-[9px] font-bold uppercase font-mono tracking-wide"
                  >
                    {pt.date}
                  </text>
                ))}
              </svg>
            )}
          </div>
        </div>

        {/* Payments Due / Top Debtors panel (40% width) */}
        <div className="bg-white rounded-xl border border-[#E4E4F0] p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between border-b pb-3 mb-3">
            <h2 className="text-sm font-bold text-[#151328] flex items-center gap-1.5">
              {t("dashboard.paymentsDue")}
              <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-100">
                {summary.top_debtors.length}
              </span>
            </h2>
            <Link
              href={`/store/${storeId}/ledgers`}
              className="text-xs font-bold text-brand hover:underline"
            >
              {t("dashboard.viewAll")}
            </Link>
          </div>

          {/* Debtors List */}
          <div className="flex-1 overflow-y-auto max-h-[160px] divide-y divide-[#F1F1F5] pr-1">
            {summary.top_debtors.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400">
                <span className="text-xs font-semibold">{t("dashboard.noPendingPayments")}</span>
              </div>
            ) : (
              summary.top_debtors.map((debtor: any) => {
                const initial = debtor.party_name.trim().charAt(0).toUpperCase() || "C";
                return (
                  <Link
                    key={debtor.party_id}
                    href={`/store/${storeId}/ledgers`}
                    className="py-2.5 flex items-center justify-between group hover:bg-[#F7F7FB] px-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8.5 w-8.5 rounded-full bg-indigo-50 border border-brand-light text-brand text-xs font-bold flex items-center justify-center">
                        {initial}
                      </div>
                      <div>
                        <span className="font-bold text-[#151328] block text-xs group-hover:underline">{debtor.party_name}</span>
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{debtor.phone || "No phone"}</span>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <span className="font-bold font-mono text-xs text-[#151328]">
                        ₹{Math.abs(debtor.balance).toFixed(2)}
                      </span>
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* SECTION 5: Top Selling Products */}
      <div className="bg-white rounded-xl border border-[#E4E4F0] p-5 shadow-sm">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-sm font-bold text-[#151328]">{t("dashboard.topSellingProducts")}</h2>
          <Link
            href={`/store/${storeId}/catalog`}
            className="text-xs font-bold text-brand hover:underline"
          >
            {t("dashboard.viewAllProducts")}
          </Link>
        </div>

        {summary.top_products.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <p className="text-xs font-semibold">No product data logged yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-[#F1F1F5] text-slate-400 uppercase font-bold text-[9px] tracking-wider">
                  <th className="py-2.5 pb-2">{t("dashboard.productName")}</th>
                  <th className="py-2.5 pb-2 text-right">{t("dashboard.quantitySold")}</th>
                  <th className="py-2.5 pb-2 text-right">{t("dashboard.revenue")}</th>
                  <th className="py-2.5 pb-2 w-44">{t("dashboard.revenueContribution")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F1F5]">
                {summary.top_products.map((prod: any, idx: number) => {
                  const maxRevenue = Math.max(...summary.top_products.map((p: any) => p.revenue), 1);
                  const contributionPercent = (prod.revenue / maxRevenue) * 100;

                  return (
                    <tr key={idx} className="group hover:bg-[#F7F7FB] transition-colors">
                      <td className="py-3 font-bold text-[#151328]">{prod.product_name}</td>
                      <td className="py-3 font-mono text-right font-semibold text-slate-600">{prod.quantity_sold}</td>
                      <td className="py-3 font-mono text-right font-bold text-[#151328]">₹{prod.revenue.toFixed(2)}</td>
                      <td className="py-3 pr-2">
                        <div className="w-full bg-[#E4E4F0] h-2 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${contributionPercent}%` }}
                            className="bg-brand h-full rounded-full transition-all duration-500"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

