import type { ReactNode } from 'react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils/cn';

interface StatCardProps {
  icon?: ReactNode;
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  accent?: 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'gold';
}

const accents = {
  primary: 'text-primary-200 bg-primary/10 border-primary/20',
  accent: 'text-accent-400 bg-accent/10 border-accent/20',
  success: 'text-success bg-success/10 border-success/20',
  warning: 'text-warning bg-warning/10 border-warning/20',
  danger: 'text-danger bg-danger/10 border-danger/20',
  gold: 'text-gold bg-gold/10 border-gold/20',
};

export function StatCard({ icon, label, value, sub, accent = 'primary' }: StatCardProps) {
  return (
    <Card className="overflow-hidden p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium uppercase tracking-wide text-muted">
            {label}
          </div>
          <div className="mt-1 truncate text-2xl font-bold tracking-tight">{value}</div>
          {sub !== undefined && (
            <div className="mt-1 text-xs text-muted">{sub}</div>
          )}
        </div>
        {icon && (
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border',
              accents[accent],
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
