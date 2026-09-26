export interface AnalystUser {
  email: string;
  password: string;
  name: string;
  createdAt: number;
}

export interface Customer {
  id: string;
  name: string;
  country: string;
  registeredAt: number;
  kycStatus: 'pending' | 'verified' | 'rejected';
  riskTier: 'low' | 'medium' | 'high';
  avgAmount: number;
  knownDevice: string;
  screeningHit: boolean;
}

export interface ScoreBreakdown {
  velocity: number;
  amountDeviation: number;
  geoMismatch: number;
  deviceChange: number;
  blacklistMatch: number;
}

export interface Transaction {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  currency: string;
  timestamp: number;
  channel: 'card' | 'upi' | 'netbanking' | 'wire';
  merchantCategory: string;
  country: string;
  deviceChange: boolean;
  breakdown: ScoreBreakdown;
  score: number;
  flagged: boolean;
}

export type AlertStatus = 'new' | 'reviewing' | 'resolved';
export type Verdict = 'true_positive' | 'false_positive' | null;

export interface Alert {
  id: string;
  transactionId: string;
  customerId: string;
  customerName: string;
  score: number;
  breakdown: ScoreBreakdown;
  createdAt: number;
  status: AlertStatus;
  verdict: Verdict;
  resolvedBy?: string;
  resolvedAt?: number;
  reportId?: string;
}

export interface FraudReport {
  id: string;
  alertId: string;
  customerName: string;
  createdBy: string;
  createdAt: number;
  summary: string;
  score: number;
}

export interface Weights {
  velocity: number;
  amountDeviation: number;
  geoMismatch: number;
  deviceChange: number;
  blacklistMatch: number;
}

export interface WeightAdjustment {
  id: string;
  timestamp: number;
  verdict: Verdict;
  before: Weights;
  after: Weights;
  reason: string;
}
