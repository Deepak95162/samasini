import { type ReactNode, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import NotificationBell from './NotificationBell';

const NAV = [
  { to: '/', label: 'Overview', icon: '◈' },
  { to: '/monitoring', label: 'Transaction Monitoring', icon: '⌁' },
  { to: '/customers', label: 'Customers', icon: '☺' },
  { to: '/reports', label: 'Reports', icon: '▤' },
  { to: '/formula', label: 'Model Transparency', icon: 'ƒ' },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logoutUser, isSimulating, toggleSimulation } = useApp();
  const [showLogout, setShowLogout] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex">
      <aside className="w-60 shrink-0 border-r border-slate-800 flex flex-col">
        <div className="px-5 py-5 flex items-center gap-2 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold">S</div>
          <div>
            <div className="text-white font-semibold text-sm leading-tight">SamaSini</div>
            <div className="text-[11px] text-slate-500 leading-tight">Fraud Console</div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition ${
                  isActive ? 'bg-purple-600/15 text-purple-300' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`
              }
            >
              <span className="w-4 text-center">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-slate-800">
          <button
            onClick={toggleSimulation}
            className={`w-full text-xs rounded-lg px-3 py-2 border transition ${
              isSimulating
                ? 'border-emerald-800 text-emerald-400 bg-emerald-950/40'
                : 'border-slate-700 text-slate-400 bg-slate-900'
            }`}
          >
            <span className={`inline-block w-1.5 h-1.5 rounded-full mr-2 ${isSimulating ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
            {isSimulating ? 'Live feed running' : 'Feed paused'}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6">
          <div className="text-sm text-slate-500">Synthetic data · demo environment</div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="relative">
              <button
                onClick={() => setShowLogout((v) => !v)}
                className="flex items-center gap-2 text-sm text-slate-300 hover:text-white"
              >
                <span className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-xs font-semibold">
                  {user?.name?.[0]?.toUpperCase() ?? '?'}
                </span>
                {user?.name}
              </button>
              {showLogout && (
                <div className="absolute right-0 mt-2 w-40 bg-slate-900 border border-slate-800 rounded-lg shadow-xl overflow-hidden z-20">
                  <button
                    onClick={logoutUser}
                    className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-slate-800"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
