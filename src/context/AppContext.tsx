import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { AnalystUser, Alert, Customer, FraudReport, Transaction, Verdict, Weights, WeightAdjustment } from '../types';
import { loadJSON, saveJSON } from '../lib/storage';
import { DEFAULT_WEIGHTS, FLAG_THRESHOLD, adjustWeights, generateCustomers, generateTransaction, uid } from '../lib/engine';
import { getSession, login as authLogin, logout as authLogout } from '../lib/auth';

interface AppState {
  user: AnalystUser | null;
  customers: Customer[];
  transactions: Transaction[];
  alerts: Alert[];
  reports: FraudReport[];
  weights: Weights;
  adjustments: WeightAdjustment[];
  isSimulating: boolean;
}

interface AppContextValue extends AppState {
  loginUser: (email: string, password: string) => boolean;
  logoutUser: () => void;
  toggleSimulation: () => void;
  resolveAlert: (alertId: string, verdict: Verdict) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const MAX_TRANSACTIONS = 60;
const MAX_ALERTS = 40;

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AnalystUser | null>(() => getSession());
  const [customers] = useState<Customer[]>(() => loadJSON('customers', null as unknown as Customer[]) ?? generateCustomers());
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadJSON('transactions', []));
  const [alerts, setAlerts] = useState<Alert[]>(() => loadJSON('alerts', []));
  const [reports, setReports] = useState<FraudReport[]>(() => loadJSON('reports', []));
  const [weights, setWeights] = useState<Weights>(() => loadJSON('weights', DEFAULT_WEIGHTS));
  const [adjustments, setAdjustments] = useState<WeightAdjustment[]>(() => loadJSON('adjustments', []));
  const [isSimulating, setIsSimulating] = useState(true);

  const weightsRef = useRef(weights);
  weightsRef.current = weights;
  const customersRef = useRef(customers);
  customersRef.current = customers;
  const transactionsRef = useRef(transactions);
  transactionsRef.current = transactions;
  const alertsRef = useRef(alerts);
  alertsRef.current = alerts;

  useEffect(() => saveJSON('customers', customers), [customers]);
  useEffect(() => saveJSON('transactions', transactions), [transactions]);
  useEffect(() => saveJSON('alerts', alerts), [alerts]);
  useEffect(() => saveJSON('reports', reports), [reports]);
  useEffect(() => saveJSON('weights', weights), [weights]);
  useEffect(() => saveJSON('adjustments', adjustments), [adjustments]);

  useEffect(() => {
    if (!isSimulating) return;
    const interval = setInterval(() => {
      const recentCountForCustomer = (id: string) => {
        const cutoff = Date.now() - 10 * 60 * 1000;
        return transactionsRef.current.filter((t) => t.customerId === id && t.timestamp >= cutoff).length;
      };
      const txn = generateTransaction(customersRef.current, weightsRef.current, recentCountForCustomer);

      setTransactions((prev) => [txn, ...prev].slice(0, MAX_TRANSACTIONS));

      if (txn.flagged) {
        const alert: Alert = {
          id: uid('alert'),
          transactionId: txn.id,
          customerId: txn.customerId,
          customerName: txn.customerName,
          score: txn.score,
          breakdown: txn.breakdown,
          createdAt: txn.timestamp,
          status: 'new',
          verdict: null,
        };
        setAlerts((prev) => [alert, ...prev].slice(0, MAX_ALERTS));
      }
    }, 3200);
    return () => clearInterval(interval);
  }, [isSimulating]);

  const loginUser = useCallback((email: string, password: string) => {
    const u = authLogin(email, password);
    if (u) setUser(u);
    return !!u;
  }, []);

  const logoutUser = useCallback(() => {
    authLogout();
    setUser(null);
  }, []);

  const toggleSimulation = useCallback(() => setIsSimulating((v) => !v), []);

  const resolveAlert = useCallback(
    (alertId: string, verdict: Verdict) => {
      if (!verdict || !user) return;
      const target = alertsRef.current.find((a) => a.id === alertId);
      if (!target || target.status === 'resolved') return;

      const newWeights = adjustWeights(weightsRef.current, target.breakdown, verdict);
      const adjustment: WeightAdjustment = {
        id: uid('adj'),
        timestamp: Date.now(),
        verdict,
        before: weightsRef.current,
        after: newWeights,
        reason:
          verdict === 'true_positive'
            ? `Confirmed fraud for ${target.customerName} — reinforcing contributing factors.`
            : `Cleared as false positive for ${target.customerName} — dampening contributing factors.`,
      };

      let reportId: string | undefined;
      if (verdict === 'true_positive') {
        reportId = uid('report');
        setReports((r) => [
          {
            id: reportId!,
            alertId,
            customerName: target.customerName,
            createdBy: user.name,
            createdAt: Date.now(),
            summary: `Fraud confirmed: score ${target.score} (threshold ${FLAG_THRESHOLD}). Key drivers — ${Object.entries(target.breakdown)
              .filter(([, v]) => v >= 50)
              .map(([k]) => k)
              .join(', ') || 'composite risk'}.`,
            score: target.score,
          },
          ...r,
        ]);
      }

      setWeights(newWeights);
      setAdjustments((prev) => [adjustment, ...prev].slice(0, 30));
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === alertId
            ? { ...a, status: 'resolved', verdict, resolvedBy: user.name, resolvedAt: Date.now(), reportId }
            : a
        )
      );
    },
    [user]
  );

  const value = useMemo<AppContextValue>(
    () => ({
      user,
      customers,
      transactions,
      alerts,
      reports,
      weights,
      adjustments,
      isSimulating,
      loginUser,
      logoutUser,
      toggleSimulation,
      resolveAlert,
    }),
    [user, customers, transactions, alerts, reports, weights, adjustments, isSimulating, loginUser, logoutUser, toggleSimulation, resolveAlert]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
