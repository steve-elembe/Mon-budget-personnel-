import React, { useState, useRef, useEffect } from 'react';
import {
  TrendPoint,
  CategoryStat,
  MonthlyBreakdown
} from '../utils/statsUtils';
import { formatFCFA } from '../services/storage';
import { CategoryIcon } from './CategoryIcon';
import {
  TrendingUp,
  TrendingDown,
  Scale,
  Calendar,
  Layers,
  ChevronRight
} from 'lucide-react';

interface TrendChartProps {
  points: TrendPoint[];
  viewMode: 'balance' | 'both' | 'expense' | 'income';
  onSelectPoint?: (point: TrendPoint | null) => void;
}

export const TrendLineChart: React.FC<TrendChartProps> = ({ points, viewMode }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(320);
  const [hoveredPoint, setHoveredPoint] = useState<TrendPoint | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      if (entries[0]) {
        setWidth(Math.max(280, Math.floor(entries[0].contentRect.width)));
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  if (points.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-xs text-zinc-400">
        Aucune donnée chronologique disponible pour cette période.
      </div>
    );
  }

  const height = 220;
  const padding = { top: 24, right: 16, bottom: 32, left: 16 };
  const innerWidth = Math.max(10, width - padding.left - padding.right);
  const innerHeight = Math.max(10, height - padding.top - padding.bottom);

  // Compute values according to viewMode
  let valuesToScale: number[] = [];
  if (viewMode === 'balance') {
    valuesToScale = points.map(p => p.cumulativeBalance);
  } else if (viewMode === 'expense') {
    valuesToScale = points.map(p => p.expense);
  } else if (viewMode === 'income') {
    valuesToScale = points.map(p => p.income);
  } else {
    // both
    valuesToScale = points.flatMap(p => [p.income, p.expense]);
  }

  const minVal = Math.min(0, ...valuesToScale);
  const maxVal = Math.max(1, ...valuesToScale);
  const valRange = maxVal - minVal || 1;

  const getX = (index: number) => {
    if (points.length <= 1) return padding.left + innerWidth / 2;
    return padding.left + (index / (points.length - 1)) * innerWidth;
  };

  const getY = (val: number) => {
    return padding.top + innerHeight - ((val - minVal) / valRange) * innerHeight;
  };

  const zeroY = getY(0);

  // Build SVG path
  const buildPath = (vals: number[]) => {
    return vals
      .map((v, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(v).toFixed(1)}`)
      .join(' ');
  };

  const buildAreaPath = (vals: number[], baselineY: number) => {
    if (vals.length === 0) return '';
    const lineParts = vals
      .map((v, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(v).toFixed(1)}`)
      .join(' ');
    const lastX = getX(vals.length - 1).toFixed(1);
    const firstX = getX(0).toFixed(1);
    return `${lineParts} L ${lastX} ${baselineY.toFixed(1)} L ${firstX} ${baselineY.toFixed(1)} Z`;
  };

  const balanceArea =
    viewMode === 'balance'
      ? buildAreaPath(
          points.map(p => p.cumulativeBalance),
          Math.min(padding.top + innerHeight, Math.max(padding.top, zeroY))
        )
      : '';

  return (
    <div ref={containerRef} className="relative w-full select-none">
      <svg
        width={width}
        height={height}
        className="overflow-visible"
        onMouseLeave={() => {
          setHoveredPoint(null);
          setTooltipPos(null);
        }}
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#059669" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal reference gridlines */}
        <line
          x1={padding.left}
          y1={padding.top}
          x2={width - padding.right}
          y2={padding.top}
          stroke="currentColor"
          strokeDasharray="3 3"
          className="text-zinc-200 dark:text-zinc-800"
        />
        <line
          x1={padding.left}
          y1={padding.top + innerHeight / 2}
          x2={width - padding.right}
          y2={padding.top + innerHeight / 2}
          stroke="currentColor"
          strokeDasharray="3 3"
          className="text-zinc-200 dark:text-zinc-800"
        />
        <line
          x1={padding.left}
          y1={padding.top + innerHeight}
          x2={width - padding.right}
          y2={padding.top + innerHeight}
          stroke="currentColor"
          className="text-zinc-200 dark:text-zinc-800"
        />

        {/* Zero baseline if in range */}
        {minVal < 0 && maxVal > 0 && (
          <line
            x1={padding.left}
            y1={zeroY}
            x2={width - padding.right}
            y2={zeroY}
            stroke="#94a3b8"
            strokeWidth="1.5"
            strokeDasharray="4 2"
          />
        )}

        {/* Area fill */}
        {viewMode === 'balance' && balanceArea && (
          <path d={balanceArea} fill="url(#balanceGrad)" />
        )}
        {viewMode === 'income' && (
          <path
            d={buildAreaPath(points.map(p => p.income), padding.top + innerHeight)}
            fill="url(#incomeGrad)"
          />
        )}
        {viewMode === 'expense' && (
          <path
            d={buildAreaPath(points.map(p => p.expense), padding.top + innerHeight)}
            fill="url(#expenseGrad)"
          />
        )}

        {/* Lines */}
        {(viewMode === 'balance') && (
          <path
            d={buildPath(points.map(p => p.cumulativeBalance))}
            fill="none"
            stroke="#059669"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {(viewMode === 'both' || viewMode === 'income') && (
          <path
            d={buildPath(points.map(p => p.income))}
            fill="none"
            stroke="#10b981"
            strokeWidth={viewMode === 'both' ? '2' : '2.5'}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {(viewMode === 'both' || viewMode === 'expense') && (
          <path
            d={buildPath(points.map(p => p.expense))}
            fill="none"
            stroke="#f43f5e"
            strokeWidth={viewMode === 'both' ? '2' : '2.5'}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Dots & interaction columns */}
        {points.map((pt, i) => {
          const x = getX(i);
          const val =
            viewMode === 'balance'
              ? pt.cumulativeBalance
              : viewMode === 'expense'
              ? pt.expense
              : viewMode === 'income'
              ? pt.income
              : pt.net;
          const y = getY(val);

          const isHovered = hoveredPoint?.id === pt.id;

          // Only render text label every step to avoid overlap
          const step = Math.ceil(points.length / 6);
          const showLabel = i % step === 0 || i === points.length - 1;

          return (
            <g key={pt.id}>
              {/* Point dot */}
              {(isHovered || points.length <= 15) && (
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 5.5 : 3}
                  className={
                    viewMode === 'balance'
                      ? 'fill-emerald-600 stroke-white dark:stroke-zinc-900'
                      : viewMode === 'income'
                      ? 'fill-emerald-500 stroke-white dark:stroke-zinc-900'
                      : 'fill-rose-500 stroke-white dark:stroke-zinc-900'
                  }
                  strokeWidth="2"
                />
              )}

              {/* X Axis label */}
              {showLabel && (
                <text
                  x={x}
                  y={height - 8}
                  textAnchor="middle"
                  className="fill-zinc-400 text-[10px] font-medium"
                >
                  {pt.label}
                </text>
              )}

              {/* Invisible touch/hover target bar */}
              <rect
                x={x - (innerWidth / points.length) / 2}
                y={padding.top}
                width={Math.max(16, innerWidth / points.length)}
                height={innerHeight}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => {
                  setHoveredPoint(pt);
                  setTooltipPos({ x, y });
                }}
                onTouchStart={() => {
                  setHoveredPoint(pt);
                  setTooltipPos({ x, y });
                }}
              />
            </g>
          );
        })}

        {/* Vertical cursor line when hovering */}
        {hoveredPoint && tooltipPos && (
          <line
            x1={tooltipPos.x}
            y1={padding.top}
            x2={tooltipPos.x}
            y2={padding.top + innerHeight}
            stroke="#10b981"
            strokeWidth="1.5"
            strokeDasharray="2 2"
          />
        )}
      </svg>

      {/* Floating Tooltip */}
      {hoveredPoint && tooltipPos && (
        <div
          className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full rounded-xl border border-zinc-200 bg-white/95 px-2.5 py-1.5 shadow-lg backdrop-blur-xs transition-all dark:border-zinc-700 dark:bg-zinc-800/95"
          style={{
            left: `${Math.min(width - 70, Math.max(70, tooltipPos.x))}px`,
            top: `${Math.max(10, tooltipPos.y - 12)}px`
          }}
        >
          <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
            {hoveredPoint.label} ({hoveredPoint.dateStr})
          </p>
          {viewMode === 'balance' && (
            <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">
              Solde : {formatFCFA(hoveredPoint.cumulativeBalance)}
            </p>
          )}
          {viewMode === 'both' && (
            <div className="space-y-0.5 text-xs font-bold">
              <p className="text-emerald-600 dark:text-emerald-400">
                +{formatFCFA(hoveredPoint.income)}
              </p>
              <p className="text-rose-600 dark:text-rose-400">
                -{formatFCFA(hoveredPoint.expense)}
              </p>
            </div>
          )}
          {viewMode === 'income' && (
            <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">
              Revenu : +{formatFCFA(hoveredPoint.income)}
            </p>
          )}
          {viewMode === 'expense' && (
            <p className="text-xs font-black text-rose-600 dark:text-rose-400">
              Dépense : -{formatFCFA(hoveredPoint.expense)}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

interface IncomeExpenseComparisonProps {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  savingsRate: number;
  expenseRatio: number;
}

export const IncomeExpenseComparison: React.FC<IncomeExpenseComparisonProps> = ({
  totalIncome,
  totalExpense,
  netBalance,
  savingsRate,
  expenseRatio
}) => {
  const maxVal = Math.max(totalIncome, totalExpense, 1);
  const incomeWidth = (totalIncome / maxVal) * 100;
  const expenseWidth = (totalExpense / maxVal) * 100;
  const isSurplus = netBalance >= 0;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 sm:text-sm">
            Comparaison Revenus vs Dépenses
          </h3>
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
            isSurplus
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
          }`}
        >
          {isSurplus ? 'Excédent budgétaire' : 'Déficit budgétaire'}
        </span>
      </div>

      {/* Comparative Progress Bars */}
      <div className="mt-4 space-y-3">
        {/* Income row */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400">
              <TrendingUp className="h-3.5 w-3.5" />
              Revenus totaux
            </span>
            <span className="font-extrabold text-emerald-700 dark:text-emerald-400">
              +{formatFCFA(totalIncome)}
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-700"
              style={{ width: `${incomeWidth}%` }}
            />
          </div>
        </div>

        {/* Expense row */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1.5 font-bold text-rose-600 dark:text-rose-400">
              <TrendingDown className="h-3.5 w-3.5" />
              Dépenses totales
            </span>
            <span className="font-extrabold text-rose-600 dark:text-rose-400">
              -{formatFCFA(totalExpense)}
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-rose-500 transition-all duration-700"
              style={{ width: `${expenseWidth}%` }}
            />
          </div>
        </div>
      </div>

      {/* Metric Cards Bottom */}
      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
        <div className="text-center">
          <p className="text-[10px] text-zinc-400">Solde net</p>
          <p
            className={`text-xs font-black sm:text-sm ${
              isSurplus
                ? 'text-emerald-700 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {isSurplus ? '+' : ''}
            {formatFCFA(netBalance)}
          </p>
        </div>

        <div className="text-center">
          <p className="text-[10px] text-zinc-400">Taux d'épargne</p>
          <p className="text-xs font-black text-cyan-600 dark:text-cyan-400 sm:text-sm">
            {savingsRate}%
          </p>
        </div>

        <div className="text-center">
          <p className="text-[10px] text-zinc-400">Ratio dépenses</p>
          <p className="text-xs font-black text-amber-600 dark:text-amber-400 sm:text-sm">
            {expenseRatio}%
          </p>
        </div>
      </div>
    </div>
  );
};

interface CategoryListProps {
  categories: CategoryStat[];
  totalAmount: number;
  type: 'EXPENSE' | 'INCOME';
  emptyMessage?: string;
}

export const CategoryBreakdownList: React.FC<CategoryListProps> = ({
  categories,
  totalAmount,
  type,
  emptyMessage = 'Aucune transaction enregistrée.'
}) => {
  const isExpense = type === 'EXPENSE';

  if (categories.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-zinc-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {categories.map((item, index) => {
        return (
          <div
            key={item.category}
            className="group rounded-xl border border-zinc-100 bg-zinc-50/50 p-2.5 transition hover:border-zinc-300 dark:border-zinc-800/80 dark:bg-zinc-800/40"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white shadow-2xs"
                  style={{ backgroundColor: item.color }}
                >
                  <CategoryIcon name={item.icon} className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      {item.category}
                    </span>
                    {index === 0 && (
                      <span className="rounded-full bg-amber-100 px-1.5 py-0.2 text-[9px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        Top {index + 1}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-400">
                    {item.count} opération{item.count > 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span
                  className={`text-xs font-black sm:text-sm ${
                    isExpense
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-emerald-700 dark:text-emerald-400'
                  }`}
                >
                  {isExpense ? '-' : '+'}
                  {formatFCFA(item.amount)}
                </span>
                <span className="ml-1.5 font-mono text-[11px] font-bold text-zinc-400">
                  {item.percentage}%
                </span>
              </div>
            </div>

            {/* Visual bar */}
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, item.percentage)}%`,
                  backgroundColor: item.color
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

interface MonthlyStatsTableProps {
  breakdowns: MonthlyBreakdown[];
  year: number;
}

export const MonthlyStatsView: React.FC<MonthlyStatsTableProps> = ({ breakdowns, year }) => {
  const maxMonthValue = Math.max(
    1,
    ...breakdowns.flatMap(b => [b.income, b.expense])
  );

  return (
    <div className="space-y-4">
      {/* Visual Month Bar Chart */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 sm:text-sm">
              Histogramme Mensuel ({year})
            </h3>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-bold">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Revenus
            </span>
            <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
              <span className="h-2 w-2 rounded-full bg-rose-500" /> Dépenses
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-12 gap-1 sm:gap-2 items-end h-40 pt-4">
          {breakdowns.map(mb => {
            const incHeight = (mb.income / maxMonthValue) * 100;
            const expHeight = (mb.expense / maxMonthValue) * 100;
            const hasData = mb.income > 0 || mb.expense > 0;

            return (
              <div key={mb.monthIndex} className="flex flex-col items-center h-full justify-end group">
                <div className="flex w-full justify-center gap-0.5 items-end h-32">
                  {/* Income bar */}
                  <div
                    className="w-1/2 max-w-[12px] rounded-t-sm bg-emerald-500 transition-all group-hover:bg-emerald-400"
                    style={{ height: `${Math.max(hasData ? 3 : 0, incHeight)}%` }}
                    title={`${mb.monthName} Revenus: +${formatFCFA(mb.income)}`}
                  />
                  {/* Expense bar */}
                  <div
                    className="w-1/2 max-w-[12px] rounded-t-sm bg-rose-500 transition-all group-hover:bg-rose-400"
                    style={{ height: `${Math.max(hasData ? 3 : 0, expHeight)}%` }}
                    title={`${mb.monthName} Dépenses: -${formatFCFA(mb.expense)}`}
                  />
                </div>
                <span className="mt-1.5 text-[9px] font-medium text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200">
                  {mb.shortMonthName.slice(0, 3)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Monthly Table */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
          <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 sm:text-sm">
            Tableau détaillé des 12 mois de {year}
          </h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 text-[11px] font-semibold text-zinc-500 dark:bg-zinc-800/60 dark:text-zinc-400">
              <tr>
                <th className="px-3 py-2.5">Mois</th>
                <th className="px-3 py-2.5 text-right">Revenus</th>
                <th className="px-3 py-2.5 text-right">Dépenses</th>
                <th className="px-3 py-2.5 text-right">Solde net</th>
                <th className="px-3 py-2.5 text-right">Épargne</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {breakdowns.map(mb => {
                const isNetPositive = mb.net >= 0;
                return (
                  <tr
                    key={mb.monthIndex}
                    className="transition hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40"
                  >
                    <td className="px-3 py-2 font-bold text-zinc-800 dark:text-zinc-200">
                      {mb.monthName}
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-emerald-600 dark:text-emerald-400">
                      {mb.income > 0 ? `+${formatFCFA(mb.income)}` : '-'}
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-rose-600 dark:text-rose-400">
                      {mb.expense > 0 ? `-${formatFCFA(mb.expense)}` : '-'}
                    </td>
                    <td
                      className={`px-3 py-2 text-right font-bold ${
                        mb.net === 0
                          ? 'text-zinc-400'
                          : isNetPositive
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {mb.net !== 0 ? (isNetPositive ? '+' : '') + formatFCFA(mb.net) : '-'}
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-bold text-zinc-500 dark:text-zinc-400">
                      {mb.income > 0 ? `${mb.savingsRate}%` : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
