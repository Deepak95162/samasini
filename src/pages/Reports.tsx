import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';


export default function Reports() {
  const { reports } = useApp();


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Fraud Reports</h1>
        <p className="text-sm text-slate-500 mt-1">Filed automatically when an analyst confirms an alert as a true positive.</p>
      </div>


      <div className="bg-slate-900 border border-slate-800 rounded-xl divide-y divide-slate-800/60">
        {reports.length === 0 && <div className="px-4 py-10 text-sm text-slate-500 text-center">No reports filed yet. Confirm a flagged alert to generate one.</div>}
        {reports.map((r) => (
          <div key={r.id} className="px-5 py-4">
            <div className="flex items-center justify-between mb-1">
              <Link to={`/customers/${r.customerId}`} className="text-white font-medium hover:text-purple-300">{r.customerName}</Link>
              <span className="text-xs font-semibold text-red-400 bg-red-950/60 px-2 py-0.5 rounded-md">score {r.score}</span>
            </div>
            <p className="text-sm text-slate-400">{r.summary}</p>
            <p className="text-xs text-slate-500 mt-1">Transaction ID: <span className="font-mono">{r.transactionId}</span></p>
            <div className="text-xs text-slate-600 mt-2 flex items-center gap-3">
              <span>Filed by {r.createdBy} · {new Date(r.createdAt).toLocaleString()} · Report ID {r.id}</span>
              <Link to={`/transactions/${r.transactionId}`} className="text-purple-400 hover:text-purple-300">View transaction →</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

