import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function NotificationBell() {
  const { alerts } = useApp();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const pending = alerts.filter((a) => a.status !== 'resolved');

  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="relative text-slate-300 hover:text-white text-lg px-1">
        🔔
        {pending.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-semibold">
            {pending.length > 9 ? '9+' : pending.length}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-20">
          <div className="px-4 py-3 border-b border-slate-800 text-sm font-medium text-white">
            Fraud alerts {pending.length > 0 && <span className="text-slate-500 font-normal">({pending.length} pending)</span>}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {pending.length === 0 && <div className="px-4 py-6 text-sm text-slate-500 text-center">No pending alerts.</div>}
            {pending.slice(0, 8).map((a) => (
              <button
                key={a.id}
                onClick={() => {
                  setOpen(false);
                  navigate('/monitoring');
                }}
                className="w-full text-left px-4 py-3 border-b border-slate-800/60 hover:bg-slate-800/60 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white">{a.customerName}</span>
                  <span className="text-xs font-semibold text-red-400">score {a.score}</span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{new Date(a.createdAt).toLocaleTimeString()}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
