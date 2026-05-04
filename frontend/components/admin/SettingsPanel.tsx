'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Settings as SettingsIcon, Calculator, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import {
  useAdminSettings,
  useRecomputeCommissions,
  useUpdateSettings,
} from '@/lib/api/admin';
import { cn } from '@/lib/utils/cn';

export function SettingsPanel() {
  const { data, isLoading } = useAdminSettings();
  const update = useUpdateSettings();
  const recompute = useRecomputeCommissions();

  const [ratePct, setRatePct] = useState<number>(20);

  useEffect(() => {
    if (data) setRatePct(Math.round(data.commissionRate * 100));
  }, [data]);

  if (isLoading || !data) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    try {
      await update.mutateAsync({ commissionRate: ratePct / 100 });
      toast.success(`Commission mise à jour : ${ratePct}%`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    }
  }

  async function onRecompute(scope: 'paid' | 'all') {
    if (
      !confirm(
        `Recalculer la commission de toutes les réservations ${scope === 'paid' ? 'payées' : ''} avec le nouveau taux ?\n\n` +
          `Cette action met à jour commissionCents et payoutCents pour l'historique. ` +
          `Les sommes déjà encaissées (Stripe) ne sont pas affectées — c'est purement un re-calcul comptable.`,
      )
    )
      return;
    try {
      const r = await recompute.mutateAsync({ scope });
      toast.success(`${r.updated} réservation(s) recalculée(s) à ${Math.round(r.rate * 100)}%`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" />
              Commission plateforme
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSave} className="space-y-5">
            <p className="text-sm text-muted">
              Cette commission est prélevée par la plateforme sur chaque réservation payée. Le
              reste est reversé au coach. Le taux est figé sur la booking au moment de la
              création — utilise le bouton « Recalculer » plus bas pour appliquer le nouveau
              taux à l'historique.
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="rate" className="text-sm font-medium">
                  Taux de commission
                </label>
                <span className="text-2xl font-bold text-gold">{ratePct}%</span>
              </div>
              <input
                id="rate"
                type="range"
                min={0}
                max={50}
                step={1}
                value={ratePct}
                onChange={(e) => setRatePct(Number(e.target.value))}
                className="w-full accent-gold"
              />
              <div className="flex justify-between text-xs text-muted">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
              </div>
            </div>

            <Example ratePct={ratePct} />

            <div className="flex justify-end">
              <Button type="submit" loading={update.isPending}>
                Enregistrer
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Recalcul de l'historique
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs text-warning">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Recalcul purement comptable : la commission et le montant reversé sont mis à jour
              dans la base, sans impact sur les paiements réels. À utiliser après un changement
              de taux pour normaliser les rapports.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => onRecompute('paid')}
              loading={recompute.isPending}
            >
              Recalculer (payées uniquement)
            </Button>
            <Button
              variant="ghost"
              onClick={() => onRecompute('all')}
              loading={recompute.isPending}
            >
              Recalculer toutes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Example({ ratePct }: { ratePct: number }) {
  const samples = [2500, 5000, 10000];
  return (
    <div className="rounded-lg border border-border bg-surface-2 p-4">
      <div className="mb-2 text-xs font-medium text-muted">Exemples sur quelques tarifs</div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-muted">
            <th className="text-left">Booking</th>
            <th className="text-right text-gold">Commission</th>
            <th className="text-right">Reversé au coach</th>
          </tr>
        </thead>
        <tbody>
          {samples.map((cents) => {
            const c = Math.round((cents * ratePct) / 100);
            return (
              <tr key={cents} className={cn('border-t border-border/60')}>
                <td className="py-1.5">{(cents / 100).toFixed(0)} €</td>
                <td className="py-1.5 text-right text-gold">
                  {(c / 100).toFixed(2)} €
                </td>
                <td className="py-1.5 text-right">{((cents - c) / 100).toFixed(2)} €</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
