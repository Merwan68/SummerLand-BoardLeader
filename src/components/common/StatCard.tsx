import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number | null;
  subtitle?: string;
  icon: LucideIcon;
  colorScheme?: 'blue' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate';
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  emptyText?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  colorScheme = 'blue',
  trend,
  emptyText = 'No data recorded',
  onClick
}) => {
  const schemeStyles = {
    blue: {
      bgIcon: 'bg-blue-50 text-blue-600',
      borderHover: 'hover:border-blue-200'
    },
    indigo: {
      bgIcon: 'bg-indigo-50 text-indigo-600',
      borderHover: 'hover:border-indigo-200'
    },
    emerald: {
      bgIcon: 'bg-emerald-50 text-emerald-600',
      borderHover: 'hover:border-emerald-200'
    },
    amber: {
      bgIcon: 'bg-amber-50 text-amber-600',
      borderHover: 'hover:border-amber-200'
    },
    rose: {
      bgIcon: 'bg-rose-50 text-rose-600',
      borderHover: 'hover:border-rose-200'
    },
    slate: {
      bgIcon: 'bg-slate-100 text-slate-700',
      borderHover: 'hover:border-slate-300'
    }
  }[colorScheme];

  const hasValue = value !== null && value !== undefined;

  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs transition-all duration-200 ${
        onClick ? `cursor-pointer ${schemeStyles.borderHover} hover:shadow-md` : ''
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            {title}
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            {hasValue ? (
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {value}
              </span>
            ) : (
              <span className="text-sm font-medium text-slate-400 italic">
                {emptyText}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
          )}
        </div>

        <div className={`p-3 rounded-xl flex-shrink-0 ${schemeStyles.bgIcon}`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>

      {trend && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className={`font-semibold ${trend.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trend.value}
          </span>
          {trend.label && <span className="text-slate-400">{trend.label}</span>}
        </div>
      )}
    </div>
  );
};
