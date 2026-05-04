'use client';

import Link from 'next/link';
import { useMe } from '@/lib/api/auth';
import { useMyBookings } from '@/lib/api/bookings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { BookingRow } from '@/components/dashboard/BookingRow';
import { EmptyState } from '@/components/ui/EmptyState';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { ListTodo, History, Compass, Trophy } from 'lucide-react';

export default function ClientDashboardPage() {
  const { data: me, isLoading } = useMe();
  const { data: bookings, isLoading: loadingBookings } = useMyBookings();

  if (isLoading || loadingBookings || !me) return <FullPageSpinner />;

  const asClient = bookings?.asClient ?? [];
  const upcoming = asClient.filter(
    (b) => b.status === 'PENDING' || b.status === 'CONFIRMED',
  );
  const history = asClient.filter(
    (b) => b.status === 'COMPLETED' || b.status === 'CANCELLED',
  );

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl">Mes sessions</h1>
          <p className="mt-1 text-muted">Retrouve ici toutes tes réservations.</p>
        </div>
        <Link href="/coaches">
          <Button>
            <Compass className="h-4 w-4" />
            Trouver un coach
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming" icon={<ListTodo className="h-4 w-4" />}>
            À venir ({upcoming.length})
          </TabsTrigger>
          <TabsTrigger value="history" icon={<History className="h-4 w-4" />}>
            Historique ({history.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <Card>
            <CardHeader>
              <CardTitle>Sessions à venir</CardTitle>
            </CardHeader>
            <CardContent>
              {upcoming.length === 0 ? (
                <EmptyState
                  icon={<Trophy className="h-7 w-7" />}
                  title="Pas encore de session prévue"
                  description="Trouve un coach et réserve ton premier créneau."
                  action={
                    <Link href="/coaches">
                      <Button>Voir les coachs</Button>
                    </Link>
                  }
                />
              ) : (
                <div className="space-y-3">
                  {upcoming.map((b) => (
                    <BookingRow key={b.id} booking={b} perspective="client" />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Sessions passées</CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <EmptyState
                  icon={<History className="h-7 w-7" />}
                  title="Aucune session passée"
                />
              ) : (
                <div className="space-y-3">
                  {history.map((b) => (
                    <BookingRow key={b.id} booking={b} perspective="client" />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
