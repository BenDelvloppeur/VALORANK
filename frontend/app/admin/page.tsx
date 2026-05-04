'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useMe } from '@/lib/api/auth';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { OverviewPanel } from '@/components/admin/OverviewPanel';
import { UsersPanel } from '@/components/admin/UsersPanel';
import { CoachesPanel } from '@/components/admin/CoachesPanel';
import { ConversationsList } from '@/components/admin/ConversationsList';
import { ReviewsPanel } from '@/components/admin/ReviewsPanel';
import { FinancePanel } from '@/components/admin/FinancePanel';
import { SettingsPanel } from '@/components/admin/SettingsPanel';
import {
  ShieldCheck,
  Users,
  Crown,
  MessageSquare,
  Star,
  TrendingUp,
  Settings,
  LayoutDashboard,
} from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  const { data: me, isLoading: loadingMe } = useMe();

  useEffect(() => {
    if (!loadingMe && me && me.role !== 'ADMIN') {
      router.replace('/');
    }
  }, [loadingMe, me, router]);

  if (loadingMe || !me) return <FullPageSpinner />;
  if (me.role !== 'ADMIN') return null;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex items-center gap-3">
        <ShieldCheck className="h-7 w-7 text-primary" />
        <div>
          <h1 className="font-display text-3xl">Console admin</h1>
          <p className="mt-1 text-sm text-muted">
            Pilotage complet de la plateforme : utilisateurs, coachs, réservations, finances et
            paramètres.
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview" icon={<LayoutDashboard className="h-4 w-4" />}>
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="finance" icon={<TrendingUp className="h-4 w-4" />}>
            Finances
          </TabsTrigger>
          <TabsTrigger value="users" icon={<Users className="h-4 w-4" />}>
            Utilisateurs
          </TabsTrigger>
          <TabsTrigger value="coaches" icon={<Crown className="h-4 w-4" />}>
            Coachs
          </TabsTrigger>
          <TabsTrigger value="bookings" icon={<MessageSquare className="h-4 w-4" />}>
            Réservations & chats
          </TabsTrigger>
          <TabsTrigger value="reviews" icon={<Star className="h-4 w-4" />}>
            Avis
          </TabsTrigger>
          <TabsTrigger value="settings" icon={<Settings className="h-4 w-4" />}>
            Paramètres
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewPanel />
        </TabsContent>
        <TabsContent value="finance">
          <FinancePanel />
        </TabsContent>
        <TabsContent value="users">
          <UsersPanel myId={me.id} />
        </TabsContent>
        <TabsContent value="coaches">
          <CoachesPanel />
        </TabsContent>
        <TabsContent value="bookings">
          <ConversationsList />
        </TabsContent>
        <TabsContent value="reviews">
          <ReviewsPanel />
        </TabsContent>
        <TabsContent value="settings">
          <SettingsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
