# SamaSini — AI Fraud Detection Console

Hackathon prototype: an AI-assisted fraud analyst dashboard covering the full
customer journey — registration, KYC, screening, transaction monitoring, and
reporting. All data is synthetic and generated client-side; there is no real
backend or ML engine. Built for a 5-hour buildathon.

## Stack

- Vite + React + TypeScript
- Tailwind CSS v4
- react-router-dom for navigation
- No backend: analyst accounts, transactions, alerts, reports and model
  weights are all persisted in `localStorage`. This is a deliberate choice
  for demo speed — see "Architecture" below.

## Architecture

- `src/lib/engine.ts` — synthetic customer/transaction generator and the
  transparent weighted-sum fraud scoring formula.
- `src/lib/auth.ts` — localStorage-backed analyst accounts (seeded account:
  `dev@mulai.com` / `fraud123`), plus an "invite analyst" flow that creates a
  second account with a chosen email + password.
- `src/context/AppContext.tsx` — global app state. Runs a `setInterval` loop
  that generates a new synthetic transaction every ~3s, scores it, and raises
  an alert when the score crosses the flag threshold.
- `src/pages/*` — Overview (journey funnel), Transaction Monitoring (live
  feed + alert triage), Reports (auto-filed on confirmed fraud), Model
  Transparency (live formula + weights + feedback-adjustment log).

The "AI" here is an explainable weighted-sum risk score (velocity, amount
deviation, geo mismatch, device change, blacklist match). When an analyst
marks an alert true/false positive, the weights of that alert's high-scoring
factors are nudged up/down — a simple, visible feedback loop, not a trained
model.

## Local development

```bash
npm install
npm run dev
```

## Deployment (cPanel Git Version Control)

- Repo: https://github.com/Deepak95162/samasini.git, branch `main`
- **Build locally, commit `dist/`**: run `npm run build` on your machine and
  commit the resulting `dist/` folder along with your source changes. The
  cPanel host's account has a very low memory limit (128MB LVE), which is
  not enough to run `tsc`/`vite`/`rollup` there — so the build never happens
  on the server.
- Push to `main` → in cPanel, Git Version Control → "Pull or Deploy" →
  "Deploy HEAD Commit".
- `.cpanel.yml` just copies the already-built `dist/` folder into the
  `console.samasini.com` document root — no Node/npm/build step runs on the
  server at all.

## What's next with more time

- Replace the localStorage store with a real API + database so multiple
  analysts share live state instead of per-browser state.
- Replace the weighted-sum heuristic with a trained model (e.g. gradient
  boosted trees) using the analyst feedback as labeled training data.
- Real KYC/screening data sources instead of synthetic generation.
