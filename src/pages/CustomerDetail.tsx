import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const KYC_STYLE: Record<string, string> = {
  verified: 'bg-emerald-950/60 text-emerald-400',
  pending: 'bg-amber-950/60 text-amber-400',
  rejected: 'bg-red-950/60 text-red-400',
};

const RISK_STYLE: Record<string, string> = {
  low: 'bg-emerald-950/60 text-emerald-400',
  medium: 'bg-amber-950/60 text-amber-400',
  high: 'bg-red-950/60 text-red-400',
};

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCustomer, getCustomerTransactions } = useApp();

  const customer = id ? getCustomer(id) : undefined;
  const txns = id ? getCustomerTransactions(id) : [];

  if (!customer) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate(-1)} className="text-sm text-slate-400 hover:text-white">← Back</button>
        <div className="text-slate-500 text-sm">Customer not found.</div>
      </div>
    );
  }

  const flaggedCount = txns.filter((t) => t.flagged).length;
  const confirmedFraudCount = txns.filter((t) => t.verdict === 'true_positive').length;

  return (
    <div className="max-w-3xl space-y-6">
      <button onClick={() => navigate(-1)} className="text-sm text-slate-400 hover:text-white">← Back</button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">{customer.name}</h1>
          <p className="text-sm text-slate-500 mt-1">Customer ID {customer.id}</p>
        </div>
        <div className="flex gap-2">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-md ${KYC_STYLE[customer.kycStatus]}`}>KYC: {customer.kycStatus}</span>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-md ${RISK_STYLE[customer.riskTier]}`}>{customer.riskTier} risk</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Field label="Country" value={customer.country} />
        <Field label="Registered" value={new Date(customer.registeredAt).toLocaleDateString()} />
        <Field label="Known device" value={customer.knownDevice} />
        <Field label="Average transaction" value={`₹${Math.round(customer.avgAmount).toLocaleString('en-IN')}`} />
        <Field label="Screening" value={customer.screeningHit ? 'Watchlist hit' : 'Clear'} />
        <Field label="Total transactions" value={String(txns.length)} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-500 mb-1">Flagged transactions</div>
          <div className="text-2xl font-semibold text-red-400">{flaggedCount}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-500 mb-1">Confirmed fraud events</div>
          <div className="text-2xl font-semibold text-red-400">{confirmedFraudCount}</div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl">
        <div className="px-4 py-3 border-b border-slate-800 text-sm font-medium text-white">Transaction history</div>
        <div className="divide-y divide-slate-800/60 max-h-96 overflow-y-auto">
          {txns.map((t) => (
            <Link key={t.id} to={`/transactions/${t.id}`} className="px-4 py-3 flex items-center justify-between text-sm hover:bg-slate-800/40 transition">
              <div>
                <div className="text-white">₹{t.amount.toLocaleString('en-IN')} · {t.channel.toUpperCase()}</div>
                <div className="text-xs text-slate-500">{t.merchantCategory} · {new Date(t.timestamp).toLocaleString()}</div>
              </div>
              <div className="flex items-center gap-2">
                {t.reviewStatus === 'resolved' && (
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                      t.verdict === 'true_positive' ? 'bg-red-950/60 text-red-400' : 'bg-emerald-950/60 text-emerald-400'
                    }`}
                  >
                    {t.verdict === 'true_positive' ? 'TP' : 'FP'}
                  </span>
                )}
                <span className={`text-xs font-semibold px-2 py-1 rounded-md ${t.flagged ? 'bg-red-950/60 text-red-400' : 'bg-slate-800 text-slate-400'}`}>
                  {t.score}
                </span>
              </div>
            </Link>
          ))}
          {txns.length === 0 && <div className="px-4 py-6 text-sm text-slate-500 text-center">No transactions yet for this customer.</div>}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
      <div className="text-xs text-slate-500 mb-0.5">{label}</div>
      <div className="text-sm text-white">{value}</div>
    </div>
  );
}
