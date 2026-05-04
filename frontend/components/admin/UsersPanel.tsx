'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  KeyRound,
  Search,
  Shield,
  Sparkles,
  Trash2,
  UserMinus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Avatar } from '@/components/coach/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { Dialog } from '@/components/ui/Dialog';
import { RankBadge } from '@/components/coach/RankBadge';
import {
  useAdminUsers,
  useDeleteCoach,
  useDeleteUser,
  useResetUserPassword,
  useToggleFeatured,
  useUpdateUserRole,
} from '@/lib/api/admin';
import { formatPrice, type ValorantRank } from '@/lib/utils/valorant';
import type { Role, User } from '@/types';

const ROLE_FILTERS: { id: 'all' | Role; label: string }[] = [
  { id: 'all', label: 'Tous' },
  { id: 'CLIENT', label: 'Clients' },
  { id: 'COACH', label: 'Coachs' },
  { id: 'ADMIN', label: 'Admins' },
];

interface Props {
  myId: string;
}

export function UsersPanel({ myId }: Props) {
  const { data: users, isLoading } = useAdminUsers();
  const updateRole = useUpdateUserRole();
  const deleteCoach = useDeleteCoach();
  const deleteUser = useDeleteUser();
  const toggleFeatured = useToggleFeatured();
  const resetPassword = useResetUserPassword();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | Role>('all');
  const [resetUser, setResetUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const filtered = useMemo(() => {
    if (!users) return [];
    let rows = users;
    if (roleFilter !== 'all') rows = rows.filter((u) => u.role === roleFilter);
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (u) =>
          u.username.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q),
      );
    }
    return rows;
  }, [users, roleFilter, search]);

  async function changeRole(id: string, role: Role) {
    try {
      await updateRole.mutateAsync({ id, role });
      toast.success('Rôle mis à jour');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    }
  }

  async function removeCoach(id: string, username: string) {
    if (!confirm(`Supprimer le profil coach de "${username}" ? L'utilisateur reste actif.`))
      return;
    try {
      await deleteCoach.mutateAsync(id);
      toast.success('Profil coach supprimé');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    }
  }

  async function toggleCoachFeatured(coachId: string, current: boolean) {
    try {
      await toggleFeatured.mutateAsync({ id: coachId, featured: !current });
      toast.success(!current ? 'Coach mis en avant' : 'Mise en avant retirée');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    }
  }

  async function removeUser(id: string, username: string) {
    if (
      !confirm(
        `Supprimer définitivement l'utilisateur "${username}" ?\n\n` +
          `Toutes ses données (réservations, avis, messages, profil coach) seront effacées.\n` +
          `Le compte Supabase Auth sera également supprimé.`,
      )
    )
      return;
    try {
      await deleteUser.mutateAsync(id);
      toast.success('Utilisateur supprimé');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    }
  }

  async function submitReset() {
    if (!resetUser) return;
    if (newPassword.length < 8) {
      toast.error('Minimum 8 caractères');
      return;
    }
    try {
      await resetPassword.mutateAsync({ id: resetUser.id, password: newPassword });
      toast.success(`Mot de passe réinitialisé pour ${resetUser.username}`);
      setResetUser(null);
      setNewPassword('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Utilisateurs ({filtered.length})</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Pseudo ou email…"
                  className="w-56 pl-9"
                />
              </div>
              <div className="flex gap-1 rounded-lg border border-border bg-surface-2 p-1">
                {ROLE_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setRoleFilter(f.id)}
                    className={`rounded-md px-3 py-1 text-xs font-medium ${
                      roleFilter === f.id
                        ? 'bg-primary/15 text-primary-200'
                        : 'text-muted hover:text-foreground'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted">
                    <th className="px-3 py-3">Utilisateur</th>
                    <th className="px-3 py-3">Email</th>
                    <th className="px-3 py-3">Rôle</th>
                    <th className="px-3 py-3">Profil coach</th>
                    <th className="px-3 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr key={u.id} className="border-b border-border last:border-0">
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar src={u.avatarUrl} username={u.username} size={32} />
                          <span className="font-medium">{u.username}</span>
                          {u.id === myId && (
                            <Badge variant="primary">
                              <Shield className="h-3 w-3" /> Vous
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-muted">{u.email}</td>
                      <td className="px-3 py-3">
                        <Select
                          className="w-32"
                          value={u.role}
                          onChange={(e) => changeRole(u.id, e.target.value as Role)}
                          disabled={u.id === myId}
                        >
                          <option value="CLIENT">Client</option>
                          <option value="COACH">Coach</option>
                          <option value="ADMIN">Admin</option>
                        </Select>
                      </td>
                      <td className="px-3 py-3">
                        {u.coachProfile ? (
                          <div className="flex items-center gap-2">
                            <RankBadge
                              rank={u.coachProfile.rank as ValorantRank}
                              size="sm"
                            />
                            <Badge>{formatPrice(u.coachProfile.hourlyRate)}/h</Badge>
                            {u.coachProfile.featured && (
                              <Badge variant="warning">
                                <Sparkles className="h-3 w-3" />
                                Recommandé
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setResetUser(u);
                              setNewPassword('');
                            }}
                            title="Réinitialiser le mot de passe"
                          >
                            <KeyRound className="h-4 w-4 text-muted" />
                          </Button>
                          {u.coachProfile && (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() =>
                                  toggleCoachFeatured(
                                    u.coachProfile!.id,
                                    u.coachProfile!.featured,
                                  )
                                }
                                title={
                                  u.coachProfile.featured
                                    ? 'Retirer la recommandation'
                                    : 'Recommander ce coach'
                                }
                              >
                                <Sparkles
                                  className={`h-4 w-4 ${
                                    u.coachProfile.featured
                                      ? 'fill-gold text-gold'
                                      : 'text-muted'
                                  }`}
                                />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() =>
                                  removeCoach(u.coachProfile!.id, u.username)
                                }
                                disabled={u.id === myId}
                                title="Supprimer le profil coach (l'utilisateur reste)"
                              >
                                <UserMinus className="h-4 w-4 text-warning" />
                              </Button>
                            </>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeUser(u.id, u.username)}
                            disabled={u.id === myId}
                            title="Supprimer définitivement l'utilisateur"
                          >
                            <Trash2 className="h-4 w-4 text-danger" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!resetUser}
        onClose={() => setResetUser(null)}
        title={resetUser ? `Nouveau mot de passe pour ${resetUser.username}` : ''}
        description="L'utilisateur pourra immédiatement se connecter avec ce nouveau mot de passe."
      >
        <div className="space-y-4">
          <Input
            label="Nouveau mot de passe"
            type="text"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="min. 8 caractères"
            minLength={8}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setResetUser(null)}>
              Annuler
            </Button>
            <Button onClick={submitReset} loading={resetPassword.isPending}>
              Réinitialiser
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
