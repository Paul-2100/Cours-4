import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover',
  typescript: true,
});

export const PRICE_PER_GENERATION = 2.00; // EUR
export const PRICE_IN_CENTS = 200; // pour Stripe (2.00 EUR = 200 cents)
