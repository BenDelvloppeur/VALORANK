// Types miroir de Prisma (côté frontend on n'a pas accès au client Prisma).
// On les redéclare ici de façon minimale pour le typage React/UI.

import type { ValorantRank } from '@/lib/utils/valorant';

export type Role = 'CLIENT' | 'COACH' | 'ADMIN';
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED';

export interface User {
  id: string;
  email: string;
  username: string;
  avatarUrl: string | null;
  role: Role;
  createdAt: string;
  updatedAt: string;
  coachProfile?: CoachProfile | null;
}

export interface CoachProfile {
  id: string;
  userId: string;
  rank: ValorantRank;
  description: string;
  hourlyRate: number;
  specialties: string[];
  rating: number;
  reviewsCount: number;
  featured: boolean;
  user?: Pick<User, 'id' | 'username' | 'avatarUrl'>;
  availabilities?: Availability[];
  reviews?: Review[];
}

export interface Availability {
  id: string;
  coachId: string;
  startsAt: string;
  endsAt: string;
  isBooked: boolean;
}

export interface Booking {
  id: string;
  clientId: string;
  coachId: string;
  availabilityId: string;
  startsAt: string;
  endsAt: string;
  status: BookingStatus;
  payment: PaymentStatus;
  amount: number;
  commissionCents: number;
  payoutCents: number;
  commissionRate: number;
  createdAt: string;
  coach?: CoachProfile;
  client?: Pick<User, 'id' | 'username' | 'avatarUrl'>;
  review?: Review | null;
}

export interface Review {
  id: string;
  bookingId: string;
  authorId: string;
  coachId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  author?: Pick<User, 'username' | 'avatarUrl'>;
}

export interface Message {
  id: string;
  bookingId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender?: Pick<User, 'id' | 'username' | 'avatarUrl' | 'role'>;
}

export interface AdminStats {
  users: number;
  clients: number;
  coaches: number;
  featuredCoaches: number;
  bookings: number;
  bookingsByStatus: {
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  };
  newUsers7d: number;
  newBookings7d: number;
  revenueCents: number;
  commissionCents: number;
  payoutCents: number;
  paidBookings: number;
  revenueCents30d: number;
  commissionCents30d: number;
  payoutCents30d: number;
  refundedCents: number;
  refundedCount: number;
  avgRating: number;
  reviewsCount: number;
  pendingApplications: number;
  completed: number;
  commissionRate: number;
}

export interface AdminCoach extends CoachProfile {
  user: Pick<User, 'id' | 'username' | 'avatarUrl' | 'email' | 'createdAt'>;
  _count: { bookings: number; reviews: number; availabilities: number };
}

export interface TopCoach {
  coachId: string;
  coach: AdminCoach;
  revenueCents: number;
  commissionCents: number;
  payoutCents: number;
  bookings: number;
}

export interface TimeseriesPoint {
  date: string;
  revenue: number;
  commission: number;
  count: number;
}

export interface AdminReview extends Review {
  author: Pick<User, 'id' | 'username' | 'avatarUrl'>;
  coach: AdminCoach;
  booking: Pick<Booking, 'id' | 'startsAt'>;
}

export interface PlatformSettings {
  commissionRate: number;
}

// ─── Coach dashboard ────────────────────────────────────────────────────────

export interface CoachStats {
  profile: {
    id: string;
    rating: number;
    reviewsCount: number;
    featured: boolean;
    hourlyRate: number;
  };
  bookings: {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    upcoming: number;
    newBookings7d: number;
  };
  finance: {
    revenueCents: number;
    commissionCents: number;
    payoutCents: number;
    paidBookings: number;
    revenueCents30d: number;
    commissionCents30d: number;
    payoutCents30d: number;
    paidBookings30d: number;
  };
  availability: {
    upcomingSlots: number;
    bookedSlots: number;
    freeSlots: number;
  };
  reviews: {
    avg: number;
    count: number;
    distribution: Record<1 | 2 | 3 | 4 | 5, number>;
  };
  uniqueClients: number;
  nextBooking:
    | (Booking & {
        client: Pick<User, 'id' | 'username' | 'avatarUrl'>;
      })
    | null;
}

export interface TimeseriesPointCoach {
  date: string;
  revenue: number;
  payout: number;
  commission: number;
  count: number;
}

export interface CoachClientRow {
  clientId: string;
  client: Pick<User, 'id' | 'username' | 'avatarUrl' | 'createdAt'>;
  bookings: number;
  revenueCents: number;
  payoutCents: number;
  lastSession: { startsAt: string; status: BookingStatus } | null;
}

export interface CoachReview extends Review {
  author: Pick<User, 'id' | 'username' | 'avatarUrl'>;
  booking: Pick<Booking, 'id' | 'startsAt'>;
}

// ─── Candidatures coach ─────────────────────────────────────────────────────

export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface CoachApplication {
  id: string;
  userId: string;
  rank: ValorantRank;
  trackerUrl: string | null;
  screenshotUrl: string | null;
  description: string;
  experience: string | null;
  hourlyRate: number;
  specialties: string[];
  status: ApplicationStatus;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user?: Pick<User, 'id' | 'username' | 'email' | 'avatarUrl'>;
  reviewedBy?: Pick<User, 'id' | 'username'> | null;
}

export interface ApplicationInput {
  rank: ValorantRank;
  trackerUrl?: string;
  screenshotUrl?: string;
  description: string;
  experience?: string;
  hourlyRate: number;
  specialties: string[];
}
