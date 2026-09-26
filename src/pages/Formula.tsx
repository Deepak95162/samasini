import { useApp } from '../context/AppContext';
import { FLAG_THRESHOLD } from '../lib/engine';
import type { Weights } from '../types';

const LABELS: Record<keyof Weights, string> = {
  velocity: 'Transaction velocity',
  amountDeviation: 'Amount deviation from customer average',
  geoMismatch: 'Geo mismatch vs. registered country',
  deviceChange: 'Unrecognized device change',
  blacklistMatch: 'Screening / watchlist match',
};

export default function Formula() {
  const { weights, adjustments } = useApp();
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Model Transparency</h1>
        <p className="text-sm text-slate-500 mt-1">
          Every score is a fully explainable weighted sum — no black box. Analyst decisions adjust these weights live.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="text-sm font-medium text-white mb-3">The formula</div>
        <code className="block bg-slate-950 border border-slate-800 rounded-lg p-4 text-xs text-emerald-300 leading-relaxed whitespace-pre-wrap">
{`risk_score = Σ (factor_value × weight) / Σ(weights)

flag if risk_score >= ${FLAG_THRESHOLD}`}
        </code>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="text-sm font-medium text-white mb-4">Current weights</div>
        <div className="space-y-3">
          {(Object.keys(weights) as (keyof Weights)[]).map((key) => (
            <div key={key}>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>{LABELS[key]}</span>
                <span>{weights[key].toFixed(1)} ({Math.round((weights[key] / totalWeight) * 100)}%)</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500" style={{ width: `${(weights[key] / 40) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl">
        <div className="px-5 py-3 border-b border-slate-800 text-sm font-medium text-white">Feedback-driven adjustment log</div>
        <div className="divide-y divide-slate-800/60 max-h-80 overflow-y-auto">
          {adjustments.length === 0 && <div className="px-5 py-6 text-sm text-slate-500 text-center">No analyst feedback yet — resolve an alert to see weights adapt.</div>}
          {adjustments.map((adj) => (
            <div key={adj.id} className="px-5 py-3 text-sm">
              <div className="flex items-center justify-between">
                <span className={adj.verdict === 'true_positive' ? 'text-red-400' : 'text-emerald-400'}>
                  {adj.verdict === 'true_positive' ? 'Reinforced' : 'Dampened'}
                </span>
                <span className="text-xs text-slate-600">{new Date(adj.timestamp).toLocaleTimeString()}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{adj.reason}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
