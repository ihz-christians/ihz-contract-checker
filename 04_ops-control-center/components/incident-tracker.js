class OpsIncidentTracker extends HTMLElement {
  constructor() {
    super();
    this.startups = [];
    this.logins = [];
    this.incidents = [];
  }

  connectedCallback() {
    this.render();
    this.startLiveStream();
  }

  startLiveStream() {
    // Mock stream entfernt - Echte Events kommen über document.addEventListener
  }

  disconnectedCallback() {
  }

  updateView() {
    const loginContainer = this.querySelector('#login-list');
    if (loginContainer) {
      loginContainer.innerHTML = this.logins.map(login => `
        <div class="flex items-center justify-between text-xs bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
          <div class="flex flex-col">
            <span class="font-bold text-slate-700">${login.email}</span>
            <span class="text-[9px] text-slate-500 mt-0.5">${login.tenant} • ${login.method}</span>
          </div>
          <div class="text-right font-mono text-[10px] text-slate-600">
            <span class="block">${login.time}</span>
            <span class="text-slate-600 block text-[9px]">${login.ip}</span>
          </div>
        </div>
      `).join('');
    }
  }

  render() {
    this.innerHTML = `
      <div class="bg-white rounded-2xl border border-slate-200 p-6 backdrop-blur-md h-full">
        
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <!-- Column 1: System Startup Log -->
          <div class="space-y-4">
            <div class="flex items-center gap-2 mb-2">
              <div class="p-1.5 bg-[#2D5016]/10 text-[#4A7C59] border border-[#2D5016]/20 rounded-md">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 class="text-sm font-bold text-slate-800">System-Startvorgänge</h3>
                <p class="text-[10px] text-slate-500">Letzte Container Bootstraps</p>
              </div>
            </div>

            <div class="space-y-2.5">
              ${this.startups.length > 0 ? this.startups.map(boot => `
                <div class="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <div class="flex items-center justify-between mb-1.5">
                    <span class="text-xs font-bold text-slate-800 font-mono flex items-center gap-1.5">
                      <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                      ${boot.service} <span class="text-[9px] text-slate-500 font-normal">${boot.version}</span>
                    </span>
                    <span class="text-[9px] font-mono bg-emerald-950/40 text-emerald-600 border border-emerald-900/30 px-1.5 py-0.5 rounded">${boot.status}</span>
                  </div>
                  <p class="text-[10px] text-slate-600 leading-relaxed">${boot.details}</p>
                  <div class="flex items-center justify-between text-[9px] text-slate-500 font-mono mt-2 pt-1.5 border-t border-slate-200/60">
                    <span>Bootzeit: ${boot.duration}</span>
                    <span>${boot.timestamp}</span>
                  </div>
                </div>
              `).join('') : '<div class="p-4 text-center text-slate-400 text-xs italic">Warte auf Live-Daten...</div>'}
            </div>
          </div>

          <!-- Column 2: User Signins / Logins Monitor -->
          <div class="space-y-4">
            <div class="flex items-center gap-2 mb-2">
              <div class="p-1.5 bg-teal-900/30 text-teal-400 border border-teal-800/20 rounded-md">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                </svg>
              </div>
              <div>
                <h3 class="text-sm font-bold text-slate-800">User Anmeldungen (Echtzeit)</h3>
                <p class="text-[10px] text-slate-500">Mandantenübergreifendes Logins-Streaming</p>
              </div>
            </div>

            <div id="login-list" class="space-y-2.5">
              ${this.logins.length > 0 ? this.logins.map(login => `
                <div class="flex items-center justify-between text-xs bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
                  <div class="flex flex-col">
                    <span class="font-bold text-slate-700 truncate max-w-[170px]">${login.email}</span>
                    <span class="text-[9px] text-slate-500 mt-0.5">${login.tenant} • ${login.method}</span>
                  </div>
                  <div class="text-right font-mono text-[10px] text-slate-600 shrink-0">
                    <span class="block">${login.time}</span>
                    <span class="text-slate-600 block text-[9px]">${login.ip}</span>
                  </div>
                </div>
              `).join('') : '<div class="p-4 text-center text-slate-400 text-xs italic">Warte auf Live-Daten...</div>'}
            </div>
          </div>

          <!-- Column 3: Incident Management & LLMOps Logs -->
          <div class="space-y-4">
            <div class="flex items-center gap-2 mb-2">
              <div class="p-1.5 bg-rose-900/30 text-rose-600 border border-rose-800/20 rounded-md">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 class="text-sm font-bold text-slate-800">Störungs- & Vorfalls-Center</h3>
                <p class="text-[10px] text-slate-500">Aktive Warnungen und Tracing</p>
              </div>
            </div>

            <div class="space-y-2.5">
              ${this.incidents.length > 0 ? this.incidents.map(inc => {
                const isHigh = inc.severity === 'HIGH';
                const isMed = inc.severity === 'MEDIUM';
                
                let badgeColor = 'bg-slate-100 text-slate-600 border-slate-200';
                if (isHigh) badgeColor = 'bg-rose-950/40 text-rose-600 border-rose-900/40 animate-pulse';
                else if (isMed) badgeColor = 'bg-amber-950/40 text-amber-600 border-amber-900/40';

                return `
                  <div class="bg-slate-50 border border-slate-200 p-3 rounded-xl flex flex-col justify-between">
                    <div class="flex items-start justify-between mb-1.5">
                      <div class="flex flex-col">
                        <span class="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <span class="text-[9px] font-mono font-bold text-[#2D5016]">${inc.id}</span>
                          ${inc.title}
                        </span>
                      </div>
                      <span class="text-[9px] font-extrabold border px-1.5 py-0.5 rounded ${badgeColor}">${inc.severity}</span>
                    </div>
                    <p class="text-[10px] text-slate-600 leading-relaxed mt-0.5">${inc.description}</p>
                    <div class="flex items-center justify-between text-[9px] text-slate-500 font-mono mt-2 pt-1.5 border-t border-slate-200/60">
                      <span>Status: <span class="${inc.status === 'ACTIVE' ? 'text-rose-600 font-bold' : 'text-emerald-600 font-semibold'}">${inc.status}</span></span>
                      <span>Geöffnet: ${inc.opened} (Closed: ${inc.closed})</span>
                    </div>
                  </div>
                `;
              }).join('') : '<div class="p-4 text-center text-slate-400 text-xs italic">Keine aktuellen Vorfälle.</div>'}
            </div>
          </div>

        </div>

        <!-- Langfuse Integration Quick Banner -->
        <div class="bg-[#f1f6ed]/50 border border-[#2D5016]/20 rounded-xl p-4 mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-left">
          <div class="flex items-center gap-3">
            <div class="h-9 w-9 rounded-lg bg-[#4A7C59]/10 border border-[#4A7C59]/20 flex items-center justify-center text-[#2D5016] shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
            </div>
            <div>
              <span class="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                Langfuse LLMOps Integration aktiv
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              </span>
              <p class="text-[10px] text-slate-600 mt-0.5">Automatisches Tracking von Prompt Versionen, Latenzen, Token Kosten & Prompt Drifts im AI Gateway.</p>
            </div>
          </div>
          <button class="text-xs font-extrabold bg-[#2D5016] hover:bg-[#3d691e] text-white px-4 py-2 rounded-xl border border-[#2D5016]/20 transition-all font-mono shrink-0">
            LANGFUSE CONSOLE ÖFFNEN ↗
          </button>
        </div>

      </div>
    `;
  }
}

customElements.define('ops-incident-tracker', OpsIncidentTracker);
