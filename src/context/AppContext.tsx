import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { AnalystUser, Customer, FraudReport, Transaction, Verdict, Weights, WeightAdjustment } from '../types';
import { loadJSON, saveJSON } from '../lib/storage';
import { DEFAULT_WEIGHTS, FLAG_THRESHOLD, adjustWeights, generateCustomers, generateTransaction, uid } from '../lib/engine';
import { getSession, login as authLogin, logout as authLogout } from '../lib/auth';

interface AppState {
  user: AnalystUser | null;
  customers: Customer[];
  transactions: Transaction[];
  reports: FraudReport[];
  weights: Weights;
  adjustments: WeightAdjustment[];
  isSimulating: boolean;
}

interface AppContextValue extends AppState {
  loginUser: (email: string, password: string) => boolean;
  logoutUser: () => void;
  toggleSimulation: () => void;
  resolveTransaction: (transactionId: string, verdict: Verdict) => void;
  getCustomer: (customerId: string) => Customer | undefined;
  getTransaction: (transactionId: string) => Transaction | undefined;
  getCustomerTransactions: (customerId: string) => Transaction[];
}

const AppContext = createContext<AppContextValue | null>(null);

const MAX_TRANSACTIONS = 200;

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AnalystUser | null>(() => getSession());
  const [customers] = useState<Customer[]>(() => loadJSON('customers', null as unknown as Customer[]) ?? generateCustomers());
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadJSON('transactions', []));
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

  useEffect(() => saveJSON('customers', customers), [customers]);
  useEffect(() => saveJSON('transactions', transactions), [transactions]);
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

  const resolveTransaction = useCallback(
    (transactionId: string, verdict: Verdict) => {
      if (!verdict || !user) return;
      const target = transactionsRef.current.find((t) => t.id === transactionId);
      if (!target || target.reviewStatus === 'resolved') return;

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
            transactionId,
            customerId: target.customerId,
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
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === transactionId
            ? { ...t, reviewStatus: 'resolved', verdict, resolvedBy: user.name, resolvedAt: Date.now(), reportId }
            : t
        )
      );
    },
    [user]
  );

  const getCustomer = useCallback((customerId: string) => customers.find((c) => c.id === customerId), [customers]);
  const getTransaction = useCallback((transactionId: string) => transactions.find((t) => t.id === transactionId), [transactions]);
  const getCustomerTransactions = useCallback(
    (customerId: string) => transactions.filter((t) => t.customerId === customerId),
    [transactions]
  );

  const value = useMemo<AppContextValue>(
    () => ({
      user,
      customers,
      transactions,
      reports,
      weights,
      adjustments,
      isSimulating,
      loginUser,
      logoutUser,
      toggleSimulation,
      resolveTransaction,
      getCustomer,
      getTransaction,
      getCustomerTransactions,
    }),
    [
      user,
      customers,
      transactions,
      reports,
      weights,
      adjustments,
      isSimulating,
      loginUser,
      logoutUser,
      toggleSimulation,
      resolveTransaction,
      getCustomer,
      getTransaction,
      getCustomerTransactions,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
