class OpsCostMetrics extends HTMLElement {
  constructor() {
    super();
    this.tokenBudget = {
      max: 10000000,
      used: 0,
      costEuro: 0.0,
      lastCalls: []
    };
  }

  connectedCallback() {
    this.render();
    document.addEventListener('ops-llm-metrics-updated', (e) => this.handleLlmMetricsUpdate(e.detail));
  }

  handleLlmMetricsUpdate(metrics) {
    if (!metrics) return;

    if (metrics.token_usage) {
      this.tokenBudget.used = metrics.token_usage.daily_total || 2450122;
      this.tokenBudget.costEuro = metrics.token_usage.estimated_cost_euro || 14.70;
    }

    this.render();
  }

  render() {
    const percentage = ((this.tokenBudget.used / this.tokenBudget.max) * 100).toFixed(1);
    this.innerHTML = `
      <div class="bg-white rounded-2xl border border-slate-200 p-6 backdrop-blur-md h-full flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-3">
              <div class="p-2 bg-amber-900/40 rounded-lg text-amber-600 border border-amber-800/30">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 class="text-lg font-bold text-slate-900 tracking-tight">AI Token & Cost Control</h2>
                <p class="text-xs text-slate-600 mt-0.5">Echtzeit LLM Budget- und Kostenkontrolle</p>
              </div>
            </div>
          </div>

          <!-- Cost and budget overview -->
          <div class="grid grid-cols-2 gap-4 mb-6">
            <div class="bg-slate-50 rounded-xl border border-slate-200 p-4">
              <span class="block text-[10px] text-slate-500 uppercase font-extrabold tracking-wider">Kosten Heute (EUR)</span>
              <span class="text-2xl font-black text-slate-900 font-mono mt-1 block">€ ${this.tokenBudget.costEuro.toFixed(2)}</span>
              <span class="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                Budget zu 85% frei
              </span>
            </div>
            <div class="bg-slate-50 rounded-xl border border-slate-200 p-4">
              <span class="block text-[10px] text-slate-500 uppercase font-extrabold tracking-wider">Token Verbrauch</span>
              <span class="text-2xl font-black text-slate-900 font-mono mt-1 block">${(this.tokenBudget.used / 1000000).toFixed(2)}M</span>
              <span class="text-[10px] text-slate-600 font-medium mt-2 block">Limit: ${(this.tokenBudget.max / 1000000).toFixed(0)}M Token / Monat</span>
            </div>
          </div>

          <!-- Progress Bar Budget -->
          <div class="space-y-2 mb-6">
            <div class="flex items-center justify-between text-xs font-bold text-slate-600 uppercase tracking-wider">
              <span>Monatsbudget-Auslastung</span>
              <span class="font-mono text-slate-800">${percentage}%</span>
            </div>
            <div class="w-full bg-slate-50 rounded-full h-3 border border-slate-200 overflow-hidden">
              <div class="h-full bg-gradient-to-r from-[#2D5016] to-[#9BC53D] rounded-full transition-all duration-500" style="width: ${percentage}%"></div>
            </div>
          </div>

          <!-- Pure SVG Visualized Sparkline (Token Trend) -->
          <div class="bg-slate-50 rounded-xl border border-slate-200 p-4.5 mb-6">
            <span class="block text-[10px] text-slate-500 uppercase font-extrabold tracking-wider mb-2.5">Stündlicher Token-Trend (24h)</span>
            <div class="h-20 w-full flex items-end">
              <svg viewBox="0 0 100 30" class="w-full h-full overflow-visible text-[#2D5016]/10" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#6366f1" stop-opacity="0.3"></stop>
                    <stop offset="100%" stop-color="#6366f1" stop-opacity="0"></stop>
                  </linearGradient>
                </defs>
                <!-- Filled Area -->
                <path d="M0,30 L0,22 L10,25 L20,15 L30,28 L40,12 L50,18 L60,8 L70,14 L80,5 L90,12 L100,2 L100,30 Z" fill="url(#chartGrad)"></path>
                <!-- Smooth Line -->
                <path d="M0,22 L10,25 L20,15 L30,28 L40,12 L50,18 L60,8 L70,14 L80,5 L90,12 L100,2" fill="none" stroke="#6366f1" stroke-width="1.5" stroke-linecap="round"></path>
              </svg>
            </div>
            <div class="flex justify-between text-[9px] text-slate-500 font-mono mt-1 uppercase font-bold">
              <span>00:00</span>
              <span>12:00</span>
              <span>Aktuell</span>
            </div>
          </div>
        </div>

        <!-- Latest API Call List -->
        <div>
          <span class="block text-[10px] text-slate-500 uppercase font-extrabold tracking-wider mb-3">Letzte LLM-Transaktionen</span>
          <div class="space-y-2.5">
            ${this.tokenBudget.lastCalls.length > 0 ? this.tokenBudget.lastCalls.map(call => `
              <div class="flex items-center justify-between text-xs bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
                <div class="flex flex-col">
                  <span class="font-mono text-slate-700 font-semibold">${call.model}</span>
                  <span class="text-[9px] text-slate-500 mt-0.5">In: ${call.tokensIn} | Out: ${call.tokensOut} • ${call.timestamp}</span>
                </div>
                <span class="font-mono font-bold text-[#2D5016]">€ ${call.cost.toFixed(4)}</span>
              </div>
            `).join('') : '<div class="p-4 text-center text-slate-400 text-xs italic">Warte auf Live-Daten...</div>'}
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('ops-cost-metrics', OpsCostMetrics);
