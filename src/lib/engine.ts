import type { Customer, ScoreBreakdown, Transaction, Weights } from '../types';

export const DEFAULT_WEIGHTS: Weights = {
  velocity: 22,
  amountDeviation: 25,
  geoMismatch: 18,
  deviceChange: 15,
  blacklistMatch: 20,
};

export const FLAG_THRESHOLD = 65;

const FIRST_NAMES = ['Aarav', 'Priya', 'Rohan', 'Ananya', 'Vikram', 'Sneha', 'Karan', 'Isha', 'Arjun', 'Neha', 'Sanjay', 'Divya'];
const LAST_NAMES = ['Sharma', 'Verma', 'Patel', 'Iyer', 'Reddy', 'Nair', 'Gupta', 'Singh', 'Rao', 'Mehta'];
const COUNTRIES = ['India', 'India', 'India', 'India', 'UAE', 'Singapore', 'Nigeria', 'Vietnam'];
const CHANNELS: Transaction['channel'][] = ['card', 'upi', 'netbanking', 'wire'];
const MERCHANT_CATEGORIES = ['Electronics', 'Groceries', 'Travel', 'Crypto Exchange', 'Jewelry', 'Utilities', 'Gaming', 'Cash Advance'];
const DEVICES = ['iPhone-15-Safari', 'Pixel-8-Chrome', 'Windows-Edge', 'MacBook-Chrome', 'Android-WebView'];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}
export function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function generateCustomers(count = 24): Customer[] {
  const customers: Customer[] = [];
  for (let i = 0; i < count; i++) {
    const name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    const kycRoll = Math.random();
    customers.push({
      id: uid('cust'),
      name,
      country: 'India',
      registeredAt: Date.now() - Math.floor(rand(1, 400)) * 86400000,
      kycStatus: kycRoll > 0.9 ? 'pending' : kycRoll > 0.85 ? 'rejected' : 'verified',
      riskTier: Math.random() > 0.85 ? 'high' : Math.random() > 0.55 ? 'medium' : 'low',
      avgAmount: rand(500, 15000),
      knownDevice: pick(DEVICES),
      screeningHit: Math.random() > 0.93,
    });
  }
  return customers;
}

export function scoreTransaction(params: {
  amount: number;
  avgAmount: number;
  txnCountLast10Min: number;
  geoMismatch: boolean;
  deviceChange: boolean;
  blacklistMatch: boolean;
}): ScoreBreakdown {
  const amountDeviationRaw = Math.max(0, (params.amount - params.avgAmount) / params.avgAmount);
  return {
    velocity: Math.min(100, params.txnCountLast10Min * 18),
    amountDeviation: Math.min(100, amountDeviationRaw * 40),
    geoMismatch: params.geoMismatch ? 100 : 0,
    deviceChange: params.deviceChange ? 100 : 0,
    blacklistMatch: params.blacklistMatch ? 100 : 0,
  };
}

export function weightedScore(breakdown: ScoreBreakdown, weights: Weights): number {
  const totalWeight = weights.velocity + weights.amountDeviation + weights.geoMismatch + weights.deviceChange + weights.blacklistMatch;
  const raw =
    breakdown.velocity * weights.velocity +
    breakdown.amountDeviation * weights.amountDeviation +
    breakdown.geoMismatch * weights.geoMismatch +
    breakdown.deviceChange * weights.deviceChange +
    breakdown.blacklistMatch * weights.blacklistMatch;
  return Math.round(raw / totalWeight);
}

export function generateTransaction(customers: Customer[], weights: Weights, recentCountForCustomer: (id: string) => number): Transaction {
  const customer = pick(customers);
  const isSuspiciousRoll = Math.random();
  const geoMismatch = isSuspiciousRoll > 0.82;
  const deviceChange = isSuspiciousRoll > 0.75 && Math.random() > 0.4;
  const blacklistMatch = customer.screeningHit && Math.random() > 0.5;
  const spike = isSuspiciousRoll > 0.85;

  const amount = spike
    ? customer.avgAmount * rand(4, 12)
    : rand(customer.avgAmount * 0.2, customer.avgAmount * 1.6);

  const breakdown = scoreTransaction({
    amount,
    avgAmount: customer.avgAmount,
    txnCountLast10Min: recentCountForCustomer(customer.id) + (spike ? Math.floor(rand(2, 5)) : 0),
    geoMismatch,
    deviceChange,
    blacklistMatch: !!blacklistMatch,
  });

  const score = weightedScore(breakdown, weights);

  return {
    id: uid('txn'),
    customerId: customer.id,
    customerName: customer.name,
    amount: Math.round(amount),
    currency: 'INR',
    timestamp: Date.now(),
    channel: pick(CHANNELS),
    merchantCategory: pick(MERCHANT_CATEGORIES),
    country: geoMismatch ? pick(COUNTRIES.filter((c) => c !== 'India')) : 'India',
    deviceChange,
    breakdown,
    score,
    flagged: score >= FLAG_THRESHOLD,
  };
}

export function adjustWeights(weights: Weights, breakdown: ScoreBreakdown, verdict: 'true_positive' | 'false_positive'): Weights {
  const step = 1.5;
  const direction = verdict === 'true_positive' ? 1 : -1;
  const contributions = breakdown as unknown as Record<keyof Weights, number>;
  const next: Weights = { ...weights };
  (Object.keys(next) as (keyof Weights)[]).forEach((key) => {
    if (contributions[key] >= 50) {
      next[key] = Math.max(5, Math.min(40, next[key] + direction * step));
    }
  });
  return next;
}
