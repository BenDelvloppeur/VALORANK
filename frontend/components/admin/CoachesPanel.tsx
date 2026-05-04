'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  Crown,
  Pencil,
  Trash2,
  Star,
  Sparkles,
  Search,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/coach/Avatar';
import { RankBadge } from '@/components/coach/RankBadge';
import { CoachEditDialog } from './CoachEditDialog';
import {
  useAdminCoaches,
  useDeleteCoach,
  useToggleFeatured,
} from '@/lib/api/admin';
import type { AdminCoach } from '@/types';
import { formatPrice } from '@/lib/utils/valorant';

export function CoachesPanel() {
  const { data, isLoading } = useAdminCoaches();
  const toggleFeatured = useToggleFeatured();
  const deleteCoach = useDeleteCoach();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<AdminCoach | null>(null);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (c) =>
        c.user.username.toLowerCase().includes(q) ||
        c.user.email.toLowerCase().includes(q) ||
        c.specialties.some((s) => s.toLowerCase().includes(q)),
    );
  }, [data, search]);

  async function onToggle(c: AdminCoach) {
    try {
      await toggleFeatured.mutateAsync({ id: c.id, featured: !c.featured });
      toast.success(c.featured ? 'Mis en avant retiré' : 'Coach mis en avant');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    }
  }

  async function onDelete(c: AdminCoach) {
    if (
      !confirm(
        `Supprimer le profil coach de "${c.user.username}" ?\n\n` +
          `Le compte utilisateur reste, mais le profil coach, ses créneaux et ses avis seront effacés.`,
      )
    )
      return;
    try {
      await deleteCoach.mutateAsync(c.id);
      toast.success('Profil coach supprimé');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={<Crown className="h-7 w-7" />}
        title="Aucun coach"
        description="Crée des comptes coachs pour commencer."
      />
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Coachs ({filtered.length})</CardTitle>
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Recherche par nom, email, spécialité…"
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {filtered.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-surface-2 p-4"
              >
                <Avatar src={c.user.avatarUrl} username={c.user.username} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{c.user.username}</span>
                    {c.featured && (
                      <Badge variant="warning">
                        <Sparkles className="h-3 w-3" /> Recommandé
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted">{c.user.email}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                    <RankBadge rank={c.rank} />
                    <span className="font-medium">{formatPrice(c.hourlyRate)}/h</span>
                    <Badge>
                      <Star className="h-3 w-3 fill-current" />
                      {c.rating.toFixed(1)} ({c.reviewsCount})
                    </Badge>
                    <Badge>
                      <Calendar className="h-3 w-3" />
                      {c._count.availabilities} créneaux
                    </Badge>
                    <Badge>{c._count.bookings} sessions</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onToggle(c)}
                    loading={toggleFeatured.isPending}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {c.featured ? 'Retirer' : 'Mettre en avant'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(c)}>
                    <Pencil className="h-4 w-4" />
                    Éditer
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onDelete(c)}
                    title="Supprimer le profil coach"
                  >
                    <Trash2 className="h-4 w-4 text-danger" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <CoachEditDialog coach={editing} onClose={() => setEditing(null)} />
    </>
  );
}
