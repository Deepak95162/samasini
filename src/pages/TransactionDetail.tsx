import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function TransactionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getTransaction, getCustomer, resolveTransaction, reports } = useApp();

  const txn = id ? getTransaction(id) : undefined;
  const customer = txn ? getCustomer(txn.customerId) : undefined;
  const report = reports.find((r) => r.transactionId === txn?.id);

  if (!txn) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate(-1)} className="text-sm text-slate-400 hover:text-white">← Back</button>
        <div className="text-slate-500 text-sm">Transaction not found.</div>
      </div>
    );
  }

  const drivers = Object.entries(txn.breakdown).sort((a, b) => b[1] - a[1]);

  return (
    <div className="max-w-3xl space-y-6">
      <button onClick={() => navigate(-1)} className="text-sm text-slate-400 hover:text-white">← Back</button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Transaction detail</h1>
          <Link to={`/customers/${txn.customerId}`} className="text-sm text-purple-400 hover:text-purple-300 mt-1 inline-flex items-center gap-2">
            {txn.customerName} →
            {customer && <span className="text-xs text-slate-500 font-normal">{customer.riskTier} risk · KYC {customer.kycStatus}</span>}
          </Link>
        </div>
        <div className={`text-sm font-semibold px-3 py-1.5 rounded-lg ${txn.flagged ? 'bg-red-950/60 text-red-400' : 'bg-slate-800 text-slate-400'}`}>
          {txn.flagged ? 'FLAGGED' : 'CLEAR'} · score {txn.score}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Amount" value={`₹${txn.amount.toLocaleString('en-IN')} ${txn.currency}`} />
        <Field label="Channel" value={txn.channel.toUpperCase()} />
        <Field label="Merchant category" value={txn.merchantCategory} />
        <Field label="Country" value={txn.country} />
        <Field label="Device change" value={txn.deviceChange ? 'Yes — unrecognized device' : 'No'} />
        <Field label="Timestamp" value={new Date(txn.timestamp).toLocaleString()} />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="text-sm font-medium text-white mb-4">Risk score breakdown</div>
        <div className="space-y-3">
          {drivers.map(([key, val]) => (
            <div key={key}>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                <span>{Math.round(val)}</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full ${val >= 50 ? 'bg-red-500' : 'bg-slate-600'}`} style={{ width: `${val}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="text-sm font-medium text-white mb-3">Analyst investigation</div>
        {txn.reviewStatus === 'unreviewed' ? (
          <div>
            <p className="text-sm text-slate-400 mb-4">
              Review the score breakdown above and decide whether this is genuine fraud or a false positive.
              Your decision adjusts the model's weights and, if confirmed, files a fraud report automatically.
            </p>
            <div className="flex gap-3">
              <button
                data-testid="resolve-false-positive"
                onClick={() => resolveTransaction(txn.id, 'false_positive')}
                className="flex-1 border border-emerald-800 text-emerald-400 hover:bg-emerald-950/40 rounded-lg py-2 text-sm font-medium transition"
              >
                False positive
              </button>
              <button
                data-testid="resolve-true-positive"
                onClick={() => resolveTransaction(txn.id, 'true_positive')}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white rounded-lg py-2 text-sm font-medium transition"
              >
                Confirm fraud → file report
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-md ${
                  txn.verdict === 'true_positive' ? 'bg-red-950/60 text-red-400' : 'bg-emerald-950/60 text-emerald-400'
                }`}
              >
                {txn.verdict === 'true_positive' ? 'Confirmed fraud' : 'False positive'}
              </span>
              <span className="text-xs text-slate-500">
                by {txn.resolvedBy} · {txn.resolvedAt && new Date(txn.resolvedAt).toLocaleString()}
              </span>
            </div>
            {report && (
              <Link to="/reports" className="text-sm text-purple-400 hover:text-purple-300 inline-block mt-1">
                View filed report ({report.id}) →
              </Link>
            )}
          </div>
        )}
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
