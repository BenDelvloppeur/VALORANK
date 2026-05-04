import type { BookingStatus, PaymentStatus } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Check, Clock, X, Trophy, CreditCard } from 'lucide-react';

const STATUS_META: Record<
  BookingStatus,
  { label: string; variant: 'default' | 'primary' | 'accent' | 'success' | 'warning' | 'danger'; icon: typeof Check }
> = {
  PENDING: { label: 'En attente', variant: 'warning', icon: Clock },
  CONFIRMED: { label: 'Confirmé', variant: 'accent', icon: Check },
  COMPLETED: { label: 'Terminé', variant: 'success', icon: Trophy },
  CANCELLED: { label: 'Annulé', variant: 'danger', icon: X },
};

export function BookingStatusPill({ status }: { status: BookingStatus }) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return (
    <Badge variant={meta.variant}>
      <Icon className="h-3 w-3" />
      {meta.label}
    </Badge>
  );
}

export function PaymentStatusPill({ status }: { status: PaymentStatus }) {
  if (status === 'PAID') {
    return (
      <Badge variant="success">
        <CreditCard className="h-3 w-3" />
        Payé
      </Badge>
    );
  }
  if (status === 'REFUNDED') {
    return (
      <Badge variant="default">
        <CreditCard className="h-3 w-3" />
        Remboursé
      </Badge>
    );
  }
  return (
    <Badge variant="warning">
      <CreditCard className="h-3 w-3" />
      À régler
    </Badge>
  );
}
