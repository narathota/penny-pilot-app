// All marketing copy is HTML strings (will later be mapped to Firestore).
export const HERO_HEADLINE_HTML = `Analyze spending. Build budgets. <span style="color:var(--pp-secondary)">Own your future.</span>`;
export const HERO_SUBTITLE_HTML = `Pocket Penny helps you track, tag, and forecast your money across accounts and currencies.`;
export const HERO_CTA_HTML = `<a href="#demo" class="btn btn-primary btn-lg">Request a Demo</a> <a href="#features" class="btn btn-outline-secondary btn-lg ms-2">Explore Features</a>`;

export const ABOUT_HTML = `
  <p>Pocket Penny is a personal finance copilot. Import bank statements, tag expenses, and get automatic insights into where your money goes.</p>
  <p>Create budgets, set rules to auto-categorize transactions, forecast cashflow, and manage IOUs with friends. Your data stays yours—export anytime and keep encrypted backups.</p>
`;

export const FEATURES_HTML = `
  <div class="col-12 col-md-6 col-lg-4"><div class="feature"><h3 class="h5">Insights</h3><p>Trends, top categories, burn rate, and anomalies.</p></div></div>
  <div class="col-12 col-md-6 col-lg-4"><div class="feature"><h3 class="h5">Budgets</h3><p>Monthly, quarterly, or custom budgets with rollover.</p></div></div>
  <div class="col-12 col-md-6 col-lg-4"><div class="feature"><h3 class="h5">Forecast</h3><p>Cashflow projections and scenario planning.</p></div></div>
  <div class="col-12 col-md-6 col-lg-4"><div class="feature"><h3 class="h5">Rules</h3><p>Auto-tag transactions using flexible rules.</p></div></div>
  <div class="col-12 col-md-6 col-lg-4"><div class="feature"><h3 class="h5">Currencies</h3><p>Track multi-currency accounts with live rates.</p></div></div>
  <div class="col-12 col-md-6 col-lg-4"><div class="feature"><h3 class="h5">Access Control</h3><p>Invite a partner or accountant with granular permissions.</p></div></div>
  <div class="col-12 col-md-6 col-lg-4"><div class="feature"><h3 class="h5">Backups</h3><p>Encrypted backups and full data export.</p></div></div>
  <div class="col-12 col-md-6 col-lg-4"><div class="feature"><h3 class="h5">Upload CSV</h3><p>Bank/credit card CSV import with field mapping.</p></div></div>
  <div class="col-12 col-md-6 col-lg-4"><div class="feature"><h3 class="h5">IOUs & Tags</h3><p>Track splits, loans, and powerful tagging.</p></div></div>
`;

export const DEMO_HTML = `
  <h2 class="h4 fw-bold">Request a live demo</h2>
  <p>Drop your email and we'll reach out with a sandbox and walkthrough.</p>
  <form class="row g-2" onsubmit="return false;">
    <div class="col-12 col-md-8"><input type="email" class="form-control" placeholder="you@example.com" required /></div>
    <div class="col-12 col-md-4 d-grid"><button class="btn btn-primary" type="submit">Request Demo</button></div>
  </form>
`;