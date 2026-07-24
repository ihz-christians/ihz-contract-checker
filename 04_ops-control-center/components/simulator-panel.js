class OpsSimulatorPanel extends HTMLElement {
  constructor() {
    super();
    this.simStep = 0;
    this.simRunning = false;
  }

  connectedCallback() {
    this.render();
    this.setupEvents();
  }

  setupEvents() {
    this.querySelector('#start-sim').addEventListener('click', () => {
      this.runSimulation();
    });
  }

  runSimulation() {
    this.dispatchEvent(new CustomEvent('ops-log', {
      bubbles: true,
      composed: true,
      detail: {
        source: 'simulator',
        type: 'warning',
        message: 'SIMULATOR: Simulation ist im Live-System deaktiviert.'
      }
    }));
  }

  render() {
    this.innerHTML = `
      <div class="bg-white rounded-2xl border border-slate-200 p-6 backdrop-blur-md">
        <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-purple-900/40 rounded-lg text-purple-400 border border-purple-800/30">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <div>
              <h2 class="text-lg font-bold text-slate-900 tracking-tight">Dokumenten-Pipeline Diagnose & Simulator</h2>
              <p class="text-xs text-slate-600 mt-0.5">Visuelle Verfolgung der Schichten-Verarbeitung in Echtzeit</p>
            </div>
          </div>

          <button id="start-sim" ${this.simRunning ? 'disabled' : ''} class="flex items-center gap-2 text-xs font-bold bg-[#2D5016] hover:bg-[#3d691e] disabled:bg-slate-100 disabled:text-slate-500 disabled:border-slate-200 active:bg-[#1f370e] text-white px-4 py-2 rounded-xl shadow-lg shadow-[#2D5016]/10 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            ${this.simRunning ? 'Simulation läuft...' : 'Röntgen-Simulation starten'}
          </button>
        </div>

        <!-- Pipeline visual workflow -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 relative">
          <!-- Connective line for desktop -->
          <div class="hidden lg:block absolute top-12 left-6 right-6 h-0.5 bg-slate-100 z-0"></div>

          <!-- Stage 1 -->
          ${this.renderStepCard(1, 'Klassifikation', 'Kanalisierung', 'Stufe 1')}
          
          <!-- Stage 2 -->
          ${this.renderStepCard(2, 'Layout Parser', 'Text-Extraktion', 'Stufe 2')}

          <!-- Stage 3 -->
          ${this.renderStepCard(3, 'PII-Maskierung', 'Anonymisierung', 'Stufe 3')}

          <!-- Stage 4 -->
          ${this.renderStepCard(4, 'LLM-Orchestrator', 'Faktensuche', 'Stufe 4')}

          <!-- Stage 5 -->
          ${this.renderStepCard(5, 'Schema Validation', 'Modell-Check', 'Stufe 5')}

          <!-- Stage 6 -->
          ${this.renderStepCard(6, 'Rule Engine', 'Score Berechnung', 'Stufe 6')}
        </div>
      </div>
    `;
  }

  renderStepCard(stepNum, name, subtitle, label) {
    let cardClass = 'bg-slate-50 border-slate-200 text-slate-500';
    let dotClass = 'bg-slate-100';
    
    if (this.simStep === stepNum) {
      cardClass = 'bg-[#f1f6ed]/50 border-[#9BC53D]/50 text-[#2D5016] shadow-lg shadow-[#9BC53D]/5 ring-1 ring-[#9BC53D]/20';
      dotClass = 'bg-[#9BC53D] animate-ping';
    } else if (this.simStep > stepNum) {
      cardClass = 'bg-emerald-950/10 border-emerald-500/40 text-emerald-600';
      dotClass = 'bg-emerald-500';
    }

    return `
      <div class="border rounded-xl p-4.5 text-center flex flex-col justify-between items-center h-36 relative z-10 transition-all ${cardClass}">
        <span class="text-[9px] font-extrabold tracking-widest uppercase opacity-70">${label}</span>
        
        <div class="my-2.5">
          <span class="block text-sm font-bold truncate">${name}</span>
          <span class="block text-[10px] opacity-70 mt-0.5 truncate">${subtitle}</span>
        </div>

        <div class="w-4.5 h-4.5 rounded-full flex items-center justify-center bg-white border border-slate-200">
          <div class="w-2.5 h-2.5 rounded-full ${dotClass}"></div>
        </div>
      </div>
    `;
  }
}

customElements.define('ops-simulator-panel', OpsSimulatorPanel);
