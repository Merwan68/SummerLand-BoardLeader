import React, { useState } from 'react';

// Line Chart for Trends (e.g. Student Attendance or Academic Trend)
interface TrendDataPoint {
  label: string;
  value: number; // 0 to 100
  secondaryValue?: number;
}

interface TrendLineChartProps {
  data: TrendDataPoint[];
  primaryLabel?: string;
  secondaryLabel?: string;
  height?: number;
  emptyMessage?: string;
}

export const TrendLineChart: React.FC<TrendLineChartProps> = ({
  data,
  primaryLabel = 'Rate',
  secondaryLabel,
  height = 220,
  emptyMessage = 'No trend data recorded yet'
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div 
        style={{ height }}
        className="w-full flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 p-6"
      >
        <svg className="w-10 h-10 mb-2 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
        <span className="text-sm font-medium">{emptyMessage}</span>
      </div>
    );
  }

  const paddingX = 45;
  const paddingY = 25;
  const chartWidth = 600;
  const chartHeight = height;

  const innerWidth = chartWidth - paddingX * 2;
  const innerHeight = chartHeight - paddingY * 2;

  const points = data.map((d, index) => {
    const x = paddingX + (data.length > 1 ? (index / (data.length - 1)) * innerWidth : innerWidth / 2);
    const y = paddingY + innerHeight - (d.value / 100) * innerHeight;
    return { x, y, ...d };
  });

  const secondaryPoints = secondaryLabel ? data.map((d, index) => {
    const x = paddingX + (data.length > 1 ? (index / (data.length - 1)) * innerWidth : innerWidth / 2);
    const val = d.secondaryValue ?? 0;
    const y = paddingY + innerHeight - (val / 100) * innerHeight;
    return { x, y, val };
  }) : [];

  const pathD = points.length === 1 
    ? `M ${points[0].x - 20} ${points[0].y} L ${points[0].x + 20} ${points[0].y}`
    : points.reduce((acc, curr, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${curr.x} ${curr.y}`, '');

  const areaD = points.length > 1 
    ? `${pathD} L ${points[points.length - 1].x} ${paddingY + innerHeight} L ${points[0].x} ${paddingY + innerHeight} Z`
    : '';

  const secondaryPathD = secondaryPoints.length > 1
    ? secondaryPoints.reduce((acc, curr, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${curr.x} ${curr.y}`, '')
    : '';

  return (
    <div className="w-full relative">
      <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-blue-600 rounded"></span>
            <span className="font-medium text-slate-700">{primaryLabel}</span>
          </div>
          {secondaryLabel && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-amber-500 rounded"></span>
              <span className="font-medium text-slate-700">{secondaryLabel}</span>
            </div>
          )}
        </div>
        <span className="text-[11px] font-semibold text-slate-400">Scale: 0–100%</span>
      </div>

      <svg 
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="w-full h-auto overflow-visible select-none"
      >
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Y Gridlines */}
        {[0, 25, 50, 75, 100].map(val => {
          const y = paddingY + innerHeight - (val / 100) * innerHeight;
          return (
            <g key={val}>
              <line 
                x1={paddingX} 
                y1={y} 
                x2={chartWidth - paddingX} 
                y2={y} 
                stroke="#e2e8f0" 
                strokeDasharray="4 4" 
              />
              <text 
                x={paddingX - 10} 
                y={y + 4} 
                textAnchor="end" 
                className="text-[10px] fill-slate-400 font-mono"
              >
                {val}%
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        {areaD && (
          <path d={areaD} fill="url(#areaGradient)" />
        )}

        {/* Secondary line if provided */}
        {secondaryPathD && (
          <path 
            d={secondaryPathD} 
            fill="none" 
            stroke="#f59e0b" 
            strokeWidth="2" 
            strokeDasharray="3 3"
          />
        )}

        {/* Primary Line */}
        <path 
          d={pathD} 
          fill="none" 
          stroke="#2563eb" 
          strokeWidth="3" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />

        {/* Points */}
        {points.map((pt, i) => (
          <g key={i}>
            <circle
              cx={pt.x}
              cy={pt.y}
              r={hoverIndex === i ? 6 : 4}
              fill="#2563eb"
              stroke="#ffffff"
              strokeWidth="2"
              className="cursor-pointer transition-all duration-200"
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
            />
            {/* X Labels */}
            <text 
              x={pt.x} 
              y={chartHeight - 6} 
              textAnchor="middle" 
              className="text-[10px] fill-slate-500 font-medium"
            >
              {pt.label}
            </text>
          </g>
        ))}
      </svg>

      {/* Tooltip */}
      {hoverIndex !== null && points[hoverIndex] && (
        <div 
          className="absolute z-20 pointer-events-none -top-2 bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-lg shadow-lg transform -translate-x-1/2 flex flex-col gap-0.5"
          style={{ 
            left: `${(points[hoverIndex].x / chartWidth) * 100}%`
          }}
        >
          <span className="font-semibold text-[11px] text-slate-300">{points[hoverIndex].label}</span>
          <span className="text-blue-300 font-bold">{primaryLabel}: {points[hoverIndex].value}%</span>
          {secondaryLabel && points[hoverIndex].secondaryValue !== undefined && (
            <span className="text-amber-300 font-bold">{secondaryLabel}: {points[hoverIndex].secondaryValue}%</span>
          )}
        </div>
      )}
    </div>
  );
};

// Bar Chart for Grades / Classes / Subjects comparison
interface BarChartItem {
  label: string;
  value: number; // 0 to 100
  secondaryValue?: number;
  category?: string;
}

interface BarChartProps {
  data: BarChartItem[];
  emptyMessage?: string;
  height?: number;
  color?: string;
  valueSuffix?: string;
}

export const SimpleBarChart: React.FC<BarChartProps> = ({
  data,
  emptyMessage = 'No academic data recorded yet',
  height = 220,
  color = '#2563eb',
  valueSuffix = '%'
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div 
        style={{ height }}
        className="w-full flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 p-6"
      >
        <svg className="w-10 h-10 mb-2 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span className="text-sm font-medium">{emptyMessage}</span>
      </div>
    );
  }

  const paddingX = 40;
  const paddingY = 25;
  const chartWidth = 550;
  const chartHeight = height;
  const innerWidth = chartWidth - paddingX * 2;
  const innerHeight = chartHeight - paddingY * 2;

  const barWidth = Math.min(42, Math.max(16, (innerWidth / data.length) * 0.55));
  const slotWidth = innerWidth / data.length;

  return (
    <div className="w-full relative">
      <svg 
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="w-full h-auto overflow-visible select-none"
      >
        {/* Y Gridlines */}
        {[0, 25, 50, 75, 100].map(val => {
          const y = paddingY + innerHeight - (val / 100) * innerHeight;
          return (
            <g key={val}>
              <line 
                x1={paddingX} 
                y1={y} 
                x2={chartWidth - paddingX} 
                y2={y} 
                stroke="#e2e8f0" 
                strokeDasharray="4 4" 
              />
              <text 
                x={paddingX - 8} 
                y={y + 4} 
                textAnchor="end" 
                className="text-[10px] fill-slate-400 font-mono"
              >
                {val}{valueSuffix}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((item, i) => {
          const x = paddingX + i * slotWidth + (slotWidth - barWidth) / 2;
          const barHeight = Math.max(4, (item.value / 100) * innerHeight);
          const y = paddingY + innerHeight - barHeight;
          const isHovered = hoverIndex === i;

          // Color based on performance if not uniform
          let barFill = color;
          if (item.value >= 75) barFill = '#10b981'; // Green
          else if (item.value >= 60) barFill = '#3b82f6'; // Blue
          else if (item.value >= 50) barFill = '#f59e0b'; // Amber
          else barFill = '#ef4444'; // Red

          return (
            <g 
              key={i} 
              className="cursor-pointer"
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
            >
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={4}
                fill={barFill}
                opacity={isHovered ? 1 : 0.85}
                className="transition-all duration-150"
              />
              {/* Value on top of bar if enough space */}
              <text
                x={x + barWidth / 2}
                y={y - 6}
                textAnchor="middle"
                className="text-[10px] fill-slate-700 font-bold"
              >
                {item.value}{valueSuffix}
              </text>
              {/* X label */}
              <text
                x={x + barWidth / 2}
                y={chartHeight - 6}
                textAnchor="middle"
                className="text-[10px] fill-slate-600 font-medium"
              >
                {item.label.length > 10 ? `${item.label.substring(0, 9)}…` : item.label}
              </text>
            </g>
          );
        })}
      </svg>

      {hoverIndex !== null && data[hoverIndex] && (
        <div 
          className="absolute z-20 pointer-events-none -top-4 bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-lg shadow-lg transform -translate-x-1/2"
          style={{ 
            left: `${((paddingX + hoverIndex * slotWidth + slotWidth / 2) / chartWidth) * 100}%` 
          }}
        >
          <span className="font-semibold block">{data[hoverIndex].label}</span>
          <span className="text-emerald-400 font-bold">{data[hoverIndex].value}{valueSuffix}</span>
        </div>
      )}
    </div>
  );
};

// Donut Chart for Pass / Fail or Category Breakdown
interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  slices: DonutSlice[];
  totalLabel?: string;
  centerNumber?: string | number;
  size?: number;
  emptyMessage?: string;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  slices,
  totalLabel = 'Total',
  centerNumber,
  size = 180,
  emptyMessage = 'No data available'
}) => {
  const total = slices.reduce((acc, curr) => acc + curr.value, 0);

  if (total === 0) {
    return (
      <div 
        style={{ height: size }}
        className="w-full flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 p-4"
      >
        <span className="text-xs font-medium">{emptyMessage}</span>
      </div>
    );
  }

  const radius = 68;
  const strokeWidth = 22;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedAngle = -90;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-0">
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />
          {slices.map((slice, index) => {
            const fraction = slice.value / total;
            const strokeDasharray = `${fraction * circumference} ${circumference}`;
            const strokeDashoffset = 0;
            const transform = `rotate(${accumulatedAngle} ${center} ${center})`;
            accumulatedAngle += fraction * 360;

            return (
              <circle
                key={index}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={slice.color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                transform={transform}
                strokeLinecap="round"
                className="transition-all duration-300"
              />
            );
          })}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-black text-slate-800 tracking-tight leading-none">
            {centerNumber !== undefined ? centerNumber : total}
          </span>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
            {totalLabel}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-2">
        {slices.map((slice, index) => {
          const pct = Math.round((slice.value / total) * 100);
          return (
            <div key={index} className="flex items-center gap-2.5 text-xs">
              <span 
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: slice.color }}
              />
              <span className="text-slate-600 font-medium min-w-[80px]">{slice.label}</span>
              <span className="font-bold text-slate-800 ml-auto">{slice.value} ({pct}%)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
