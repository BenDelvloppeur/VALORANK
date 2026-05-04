'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useMe } from '@/lib/api/auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { CoachOverviewPanel } from '@/components/dashboard/CoachOverviewPanel';
import { CoachBookingsPanel } from '@/components/dashboard/CoachBookingsPanel';
import { CoachFinancePanel } from '@/components/dashboard/CoachFinancePanel';
import { CoachClientsPanel } from '@/components/dashboard/CoachClientsPanel';
import { CoachReviewsPanel } from '@/components/dashboard/CoachReviewsPanel';
import { AvailabilityManager } from '@/components/dashboard/AvailabilityManager';
import { CoachProfileForm } from '@/components/dashboard/CoachProfileForm';
import { FullPageSpinner } from '@/components/ui/Spinner';
import {
  Calendar,
  ListTodo,
  UserCog,
  LayoutDashboard,
  TrendingUp,
  Users,
  Star,
} from 'lucide-react';

export default function CoachDashboardPage() {
  const router = useRouter();
  const { data: me, isLoading } = useMe();

  useEffect(() => {
    if (!isLoading && me && me.role !== 'COACH') {
      router.replace('/client');
    }
  }, [isLoading, me, router]);

  if (isLoading || !me) return <FullPageSpinner />;
  if (me.role !== 'COACH') return null;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="font-display text-3xl">Salut {me.username}</h1>
        <p className="mt-1 text-muted">
          Pilote tes sessions, tes finances, tes clients et ton profil.
        </p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview" icon={<LayoutDashboard className="h-4 w-4" />}>
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="bookings" icon={<ListTodo className="h-4 w-4" />}>
            Réservations
          </TabsTrigger>
          <TabsTrigger value="finance" icon={<TrendingUp className="h-4 w-4" />}>
            Finances
          </TabsTrigger>
          <TabsTrigger value="clients" icon={<Users className="h-4 w-4" />}>
            Clients
          </TabsTrigger>
          <TabsTrigger value="reviews" icon={<Star className="h-4 w-4" />}>
            Avis
          </TabsTrigger>
          <TabsTrigger value="availabilities" icon={<Calendar className="h-4 w-4" />}>
            Disponibilités
          </TabsTrigger>
          <TabsTrigger value="profile" icon={<UserCog className="h-4 w-4" />}>
            Profil
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <CoachOverviewPanel />
        </TabsContent>
        <TabsContent value="bookings">
          <CoachBookingsPanel />
        </TabsContent>
        <TabsContent value="finance">
          <CoachFinancePanel />
        </TabsContent>
        <TabsContent value="clients">
          <CoachClientsPanel />
        </TabsContent>
        <TabsContent value="reviews">
          <CoachReviewsPanel />
        </TabsContent>
        <TabsContent value="availabilities">
          <AvailabilityManager />
        </TabsContent>
        <TabsContent value="profile">
          <CoachProfileForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
