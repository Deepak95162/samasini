import type { Customer, Transaction } from '../types';

export interface AiOpinion {
  score: number;
  verdict: 'likely_fraud' | 'suspicious' | 'likely_legitimate';
  reasons: string[];
}

const HIGH_RISK_CATEGORIES = ['Crypto Exchange', 'Cash Advance', 'Jewelry', 'Gaming'];

/**
 * Independent rule-based scorer. Deliberately does NOT reuse the weighted-sum
 * breakdown from engine.ts — it re-derives risk from raw transaction/customer
 * fields so it can genuinely agree or disagree with the primary score.
 */
export function getAiOpinion(txn: Transaction, customer: Customer | undefined): AiOpinion {
  let score = 0;
  const reasons: string[] = [];

  if (customer) {
    const ratio = txn.amount / customer.avgAmount;
    if (ratio >= 5) {
      score += 35;
      reasons.push(`Amount is ${ratio.toFixed(1)}x the customer's average spend — highly unusual.`);
    } else if (ratio >= 2.5) {
      score += 18;
      reasons.push(`Amount is ${ratio.toFixed(1)}x the customer's average spend.`);
    } else if (ratio >= 1.5) {
      score += 8;
      reasons.push(`Amount is somewhat above the customer's average spend (${ratio.toFixed(1)}x).`);
    }
  }

  if (txn.country !== 'India') {
    score += 20;
    reasons.push(`Transaction originated from ${txn.country}, outside the customer's home market.`);
  }

  if (txn.deviceChange) {
    score += 15;
    reasons.push('Made from a device not previously associated with this customer.');
  }

  if (customer?.screeningHit) {
    score += 30;
    reasons.push('Customer has a prior watchlist/screening hit on file.');
  }

  if (HIGH_RISK_CATEGORIES.includes(txn.merchantCategory)) {
    score += 12;
    reasons.push(`Merchant category (${txn.merchantCategory}) is commonly linked to fraud or laundering.`);
  }

  if (customer?.riskTier === 'high') {
    score += 10;
    reasons.push('Customer is already tagged as high risk tier.');
  }

  if (customer && customer.kycStatus !== 'verified') {
    score += 15;
    reasons.push(`Customer KYC status is "${customer.kycStatus}", not fully verified.`);
  }

  score = Math.min(100, score);

  if (reasons.length === 0) {
    reasons.push('No independent risk signals found — transaction looks consistent with normal behavior.');
  }

  const verdict: AiOpinion['verdict'] = score >= 65 ? 'likely_fraud' : score >= 35 ? 'suspicious' : 'likely_legitimate';

  return { score, verdict, reasons };
}
