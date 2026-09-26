import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { getAiOpinion } from '../lib/aiSecondOpinion';
import { answerQuestion, SUGGESTED_QUESTIONS } from '../lib/aiAssistant';

export default function TransactionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getTransaction, getCustomer, resolveTransaction, reports } = useApp();

  const txn = id ? getTransaction(id) : undefined;
  const customer = txn ? getCustomer(txn.customerId) : undefined;
  const report = reports.find((r) => r.transactionId === txn?.id);
  const opinion = useMemo(() => (txn ? getAiOpinion(txn, customer) : null), [txn, customer]);
  const [chat, setChat] = useState<{ from: 'analyst' | 'ai'; text: string }[]>([]);
  const [input, setInput] = useState('');

  const ask = (question: string) => {
    if (!question.trim() || !txn || !opinion) return;
    const answer = answerQuestion(question, { txn, customer, opinion });
    setChat((prev) => [...prev, { from: 'analyst', text: question }, { from: 'ai', text: answer }]);
    setInput('');
  };

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

      {opinion && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-white">AI second opinion</div>
            <div
              className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
                opinion.verdict === 'likely_fraud'
                  ? 'bg-red-950/60 text-red-400'
                  : opinion.verdict === 'suspicious'
                    ? 'bg-amber-950/60 text-amber-400'
                    : 'bg-emerald-950/60 text-emerald-400'
              }`}
            >
              {opinion.verdict.replace('_', ' ')} · score {opinion.score}
            </div>
          </div>
          <ul className="space-y-1.5 text-sm text-slate-400 list-disc list-inside">
            {opinion.reasons.map((reason, i) => (
              <li key={i}>{reason}</li>
            ))}
          </ul>
          <div className="text-xs text-slate-500 mt-3">
            Independent rule-based check, computed separately from the primary weighted-sum score above — not a trained model.
          </div>
        </div>
      )}

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

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="text-sm font-medium text-white mb-1">Investigation assistant</div>
        <div className="text-xs text-slate-500 mb-4">
          Local, rule-based agent — answers are generated from this transaction's data, not a live model call.
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => ask(q)}
              className="text-xs px-2.5 py-1 rounded-md border border-slate-700 text-slate-300 hover:border-purple-700 hover:text-purple-300 transition"
            >
              {q}
            </button>
          ))}
        </div>

        {chat.length > 0 && (
          <div className="space-y-3 mb-4 max-h-72 overflow-y-auto pr-1">
            {chat.map((m, i) => (
              <div key={i} className={m.from === 'analyst' ? 'text-right' : 'text-left'}>
                <div
                  className={`inline-block max-w-[85%] text-sm px-3 py-2 rounded-lg ${
                    m.from === 'analyst' ? 'bg-purple-950/60 text-purple-200' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about this transaction…"
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-700"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition"
          >
            Ask
          </button>
        </form>
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
