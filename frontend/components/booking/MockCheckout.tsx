'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Lock, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatPrice } from '@/lib/utils/valorant';
import { cn } from '@/lib/utils/cn';

interface MockCheckoutProps {
  amount: number;
  onPay: () => Promise<void>;
  loading?: boolean;
}

// Faux checkout type Stripe : pas d'appel réel à Stripe.
// On simule la saisie de carte + un état de succès animé.
// L'appel `onPay` parle au backend (POST /bookings/:id/pay) pour marquer payé.
export function MockCheckout({ amount, onPay, loading }: MockCheckoutProps) {
  const [card, setCard] = useState('4242 4242 4242 4242');
  const [exp, setExp] = useState('12/30');
  const [cvc, setCvc] = useState('123');
  const [success, setSuccess] = useState(false);

  async function handlePay() {
    await onPay();
    setSuccess(true);
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <div className="mb-4 flex items-center gap-2 text-sm text-muted">
        <Lock className="h-3.5 w-3.5 text-accent" />
        Paiement sécurisé (mode démo — aucune carte n’est débitée)
      </div>

      <AnimatePresence mode="wait">
        {success ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4 py-8 text-center"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
              <Check className="h-7 w-7" />
            </div>
            <div>
              <h3 className="font-display text-xl">Paiement validé</h3>
              <p className="mt-1 text-sm text-muted">
                Ta réservation est confirmée. Le coach a été notifié.
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Carte stylisée */}
            <div
              className={cn(
                'relative overflow-hidden rounded-xl bg-gradient-to-br from-primary via-primary-500 to-primary-700 p-5 text-white',
              )}
            >
              <div className="absolute inset-0 bg-grid-pattern bg-[size:24px_24px] opacity-20" />
              <div className="relative">
                <div className="mb-6 flex items-center justify-between">
                  <CreditCard className="h-7 w-7" />
                  <span className="font-display text-sm tracking-wider">VISA</span>
                </div>
                <div className="font-mono text-lg tracking-widest">
                  {card.padEnd(19, '•')}
                </div>
                <div className="mt-3 flex justify-between text-xs uppercase tracking-wider opacity-80">
                  <span>Valorank Démo</span>
                  <span>{exp}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Input
                label="Numéro de carte"
                value={card}
                onChange={(e) => setCard(e.target.value)}
                inputMode="numeric"
              />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Expiration" value={exp} onChange={(e) => setExp(e.target.value)} />
                <Input label="CVC" value={cvc} onChange={(e) => setCvc(e.target.value)} />
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-4">
              <span className="text-sm text-muted">Total</span>
              <span className="font-display text-2xl text-primary">
                {formatPrice(amount)}
              </span>
            </div>

            <Button
              size="lg"
              className="w-full"
              loading={loading}
              onClick={handlePay}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Traitement…
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Payer {formatPrice(amount)}
                </>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
