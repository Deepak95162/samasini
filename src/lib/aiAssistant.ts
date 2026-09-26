import type { Customer, Transaction } from '../types';
import type { AiOpinion } from './aiSecondOpinion';
import { FLAG_THRESHOLD } from './engine';

export interface AssistantContext {
  txn: Transaction;
  customer: Customer | undefined;
  opinion: AiOpinion;
}

export const SUGGESTED_QUESTIONS = [
  'What happened in this transaction?',
  'Why was it flagged?',
  'Tell me about the customer',
  'Is this likely fraud?',
  'What should I do next?',
];

function topDrivers(txn: Transaction): string {
  const entries = Object.entries(txn.breakdown).sort((a, b) => b[1] - a[1]);
  return entries
    .filter(([, v]) => v >= 50)
    .map(([k]) => k.replace(/([A-Z])/g, ' $1').toLowerCase())
    .join(', ') || 'no single dominant factor — composite risk';
}

/**
 * Local, deterministic "AI agent". No external API call — it pattern-matches
 * the analyst's question and answers from data already in memory, in the
 * same spirit as the transparent weighted-sum scorer (explainable, not a
 * trained model).
 */
export function answerQuestion(question: string, ctx: AssistantContext): string {
  const q = question.toLowerCase();
  const { txn, customer, opinion } = ctx;

  if (/what happened|summary|summarize/.test(q)) {
    return `${txn.customerName} made a ${txn.channel.toUpperCase()} payment of ₹${txn.amount.toLocaleString('en-IN')} at a ${txn.merchantCategory} merchant in ${txn.country} on ${new Date(txn.timestamp).toLocaleString()}. Primary model score: ${txn.score}/100 (${txn.flagged ? 'flagged' : 'clear'}).`;
  }

  if (/why.*flag|why.*score|driver|reason/.test(q)) {
    return `The primary score of ${txn.score} was driven mainly by: ${topDrivers(txn)}. Flag threshold is ${FLAG_THRESHOLD}. The independent AI second opinion (${opinion.score}/100) points to: ${opinion.reasons.join(' ')}`;
  }

  if (/customer|who is|profile/.test(q)) {
    if (!customer) return "I don't have a customer record for this transaction.";
    return `${customer.name} is a ${customer.riskTier}-risk customer registered ${Math.round((Date.now() - customer.registeredAt) / 86400000)} days ago, KYC status "${customer.kycStatus}", average spend ₹${Math.round(customer.avgAmount).toLocaleString('en-IN')}, known device "${customer.knownDevice}"${customer.screeningHit ? ', and has a prior watchlist/screening hit' : ''}.`;
  }

  if (/device/.test(q)) {
    return txn.deviceChange
      ? `Yes — this transaction came from a device not previously seen for ${txn.customerName}.`
      : `No device anomaly detected — this matches the customer's known device.`;
  }

  if (/geo|location|country|abroad/.test(q)) {
    return txn.country !== 'India'
      ? `This transaction came from ${txn.country}, which is outside the customer's usual home market (India).`
      : `Transaction location (India) is consistent with the customer's usual market.`;
  }

  if (/amount|spend|value/.test(q)) {
    if (!customer) return `Transaction amount was ₹${txn.amount.toLocaleString('en-IN')}.`;
    const ratio = txn.amount / customer.avgAmount;
    return `Transaction amount is ₹${txn.amount.toLocaleString('en-IN')}, which is ${ratio.toFixed(1)}x this customer's average of ₹${Math.round(customer.avgAmount).toLocaleString('en-IN')}.`;
  }

  if (/fraud|legit|genuine|real|scam/.test(q)) {
    const agree = (txn.flagged && opinion.verdict !== 'likely_legitimate') || (!txn.flagged && opinion.verdict === 'likely_legitimate');
    return `Primary model: ${txn.flagged ? 'flagged as risky' : 'clear'} (score ${txn.score}). AI second opinion: ${opinion.verdict.replace('_', ' ')} (score ${opinion.score}). The two ${agree ? 'agree' : 'disagree'} — ${agree ? 'this reinforces the primary read.' : 'worth a closer manual look before deciding.'}`;
  }

  if (/next|recommend|should i|action/.test(q)) {
    if (txn.reviewStatus === 'resolved') {
      return `This transaction is already resolved as ${txn.verdict === 'true_positive' ? 'confirmed fraud' : 'a false positive'}.`;
    }
    if (opinion.verdict === 'likely_fraud' && txn.flagged) {
      return 'Both the primary score and AI second opinion point to high risk. Recommend confirming as fraud unless you have contrary context (e.g. a known travel event).';
    }
    if (opinion.verdict === 'likely_legitimate' && !txn.flagged) {
      return 'Both signals are calm here. Likely safe to clear as a false positive if nothing else stands out.';
    }
    return 'The primary score and AI second opinion disagree — worth checking the customer profile and breakdown drivers manually before resolving.';
  }

  return `I can answer questions about this transaction's amount, device, location, customer profile, why it was flagged, or whether it looks like fraud. Try one of the suggested questions above.`;
}
