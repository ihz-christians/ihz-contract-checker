class OpsPipelineQueue extends HTMLElement {
  constructor() {
    super();
    this.tasks = [];
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.innerHTML = `
      <div class="bg-white rounded-2xl border border-slate-200 p-6 backdrop-blur-md">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-pink-900/40 rounded-lg text-pink-400 border border-pink-800/30">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h2 class="text-lg font-bold text-slate-900 tracking-tight">Asynchrones Pipeline-Queue Board</h2>
              <p class="text-xs text-slate-600 mt-0.5">Echtzeit-Dokumentenverarbeitung und manuelle Interventionen</p>
            </div>
          </div>
          
          <div class="flex items-center gap-2 self-stretch sm:self-auto">
            <span class="flex h-2 w-2 relative">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span class="text-xs font-semibold text-emerald-600 uppercase tracking-wider font-mono">Live Sync Aktiv</span>
          </div>
        </div>

        <!-- Table Container -->
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-slate-200 text-[10px] uppercase tracking-wider font-bold text-slate-600">
                <th class="py-3 px-4">Task-ID</th>
                <th class="py-3 px-4">Mandant / Datei</th>
                <th class="py-3 px-4">Sparte</th>
                <th class="py-3 px-4">Fortschritt / Status</th>
                <th class="py-3 px-4">Eingestellt</th>
                <th class="py-3 px-4 text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/40 text-sm">
              ${this.tasks.length > 0 ? this.tasks.map(task => {
                let statusBadge = '';
                let rowBg = '';
                
                if (task.status === 'processing') {
                  statusBadge = `<span class="bg-sky-950/40 text-sky-400 border border-sky-800/50 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase">Verarbeitung (${task.progress}%)</span>`;
                } else if (task.status === 'ocr_fallback') {
                  statusBadge = `<span class="bg-purple-950/40 text-purple-400 border border-purple-800/50 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase">OCR Fallback</span>`;
                } else if (task.status === 'failed') {
                  statusBadge = `<span class="bg-rose-950/40 text-rose-600 border border-rose-800/50 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase">FEHLER ⚠️</span>`;
                  rowBg = 'bg-rose-950/5';
                } else if (task.status === 'completed') {
                  statusBadge = `<span class="bg-emerald-950/40 text-emerald-600 border border-emerald-800/50 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase">Berechnet ✅</span>`;
                }

                return `
                  <tr class="${rowBg} hover:bg-slate-100 transition-colors" data-task-id="${task.id}">
                    <td class="py-4 px-4 font-mono text-xs text-[#2D5016] font-bold">${task.id}</td>
                    <td class="py-4 px-4">
                      <span class="block text-slate-800 font-semibold text-sm">${task.tenant}</span>
                      <span class="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        ${task.file}
                      </span>
                    </td>
                    <td class="py-4 px-4">
                      <span class="px-2.5 py-0.5 rounded-md text-xs font-bold ${task.contractType === 'Strom' ? 'bg-amber-950/40 text-amber-600 border border-amber-800/30' : task.contractType === 'Gas' ? 'bg-amber-900/20 text-orange-400 border border-amber-900/30' : 'bg-teal-950/40 text-teal-400 border border-teal-800/30'}">
                        ${task.contractType}
                      </span>
                    </td>
                    <td class="py-4 px-4">
                      <div class="space-y-1.5">
                        <div class="flex items-center justify-between text-xs font-medium">
                          ${statusBadge}
                        </div>
                        <div class="w-48 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div class="h-full rounded-full transition-all duration-500 ${task.status === 'failed' ? 'bg-rose-500' : task.status === 'completed' ? 'bg-emerald-500' : task.status === 'ocr_fallback' ? 'bg-purple-500' : 'bg-sky-500'}" style="width: ${task.progress}%"></div>
                        </div>
                      </div>
                    </td>
                    <td class="py-4 px-4 font-mono text-xs text-slate-600">${task.timestamp}</td>
                    <td class="py-4 px-4 text-right">
                      <div class="flex items-center justify-end gap-2">
                        <button class="inspect-btn text-xs font-bold bg-slate-100 hover:bg-slate-200 hover:text-slate-900 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 transition-all" data-id="${task.id}">
                          Inspektion
                        </button>
                        ${task.status === 'failed' ? `
                          <button class="retry-btn text-xs font-bold bg-[#f1f6ed] text-[#2D5016] hover:bg-[#4A7C59]/25 hover:text-[#2D5016] border border-[#2D5016]/20 px-3 py-1.5 rounded-lg transition-all" data-id="${task.id}">
                            Retry
                          </button>
                        ` : ''}
                        ${task.status === 'ocr_fallback' ? `
                          <button class="override-btn text-xs font-bold bg-pink-950 text-pink-400 hover:bg-pink-900 hover:text-pink-200 border border-pink-800/40 px-3 py-1.5 rounded-lg transition-all" data-id="${task.id}">
                            Intervention ⚠️
                          </button>
                        ` : ''}
                      </div>
                    </td>
                  </tr>
                `;
              }).join('') : `<tr><td colspan="6" class="py-8 text-center text-slate-500 text-xs">Keine Tasks in der Pipeline. Warte auf Live-Systemdaten...</td></tr>`}
            </tbody>
          </table>
        </div>

        <!-- Inline Modal Simulator (Hidden by Default) -->
        <div id="ops-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/80 backdrop-blur-sm">
          <div class="bg-white border border-slate-200 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            <div class="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 id="modal-task-title" class="text-lg font-bold text-slate-900">Task Detail-Inspektion</h3>
                <p id="modal-task-subtitle" class="text-xs text-slate-600">Verfolgung der PDF-Verarbeitungsstufen</p>
              </div>
              <button id="close-modal-btn" class="p-1.5 text-slate-600 hover:text-slate-800 bg-slate-100 border border-slate-200 rounded-lg transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Modal Content - Split Screen View -->
            <div class="p-6 overflow-y-auto space-y-6 flex-1 text-left">
              <div id="modal-error-banner" class="hidden p-4 bg-rose-950/30 border border-rose-900/50 rounded-xl text-rose-600 text-xs font-mono leading-relaxed">
              </div>

              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Left: Raw Extracted Document Text -->
                <div class="flex flex-col h-96">
                  <span class="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                    Stufe 3: Layout Parser Extrahierter Text
                  </span>
                  <textarea id="modal-raw-text" class="w-full flex-1 bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-mono text-slate-700 resize-none leading-relaxed focus:outline-none focus:border-slate-300"></textarea>
                </div>

                <!-- Right: AI Extracted Structural JSON (Editable for Override) -->
                <div class="flex flex-col h-96">
                  <span class="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    Stufe 5: Strukturierte AI-Fakten (JSON)
                  </span>
                  <div class="relative flex-1 flex flex-col">
                    <textarea id="modal-extracted-json" class="w-full flex-1 bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-mono text-slate-700 resize-none leading-relaxed focus:outline-none focus:border-slate-300"></textarea>
                    <div id="json-error-msg" class="hidden absolute bottom-4 left-4 right-4 p-2 bg-rose-950 text-rose-600 border border-rose-900 rounded-lg text-[10px] font-bold">
                      Ungültiges JSON-Format! Bitte korrigieren.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer actions -->
            <div class="p-6 border-t border-slate-200 flex items-center justify-between bg-slate-50">
              <span class="text-[10px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Änderungen bypassen die RLS und fließen direkt in die Rule Engine
              </span>
              <div class="flex items-center gap-3">
                <button id="modal-cancel-btn" class="text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl border border-slate-200 transition-all">
                  Schließen
                </button>
                <button id="modal-save-btn" class="text-xs font-bold bg-pink-600 hover:bg-pink-500 hover:shadow-pink-600/20 active:bg-pink-700 text-white px-5 py-2 rounded-xl shadow-lg shadow-transparent transition-all">
                  Korrektur erzwingen (Save & Override)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.setupEvents();
  }

  setupEvents() {
    const modal = this.querySelector('#ops-modal');
    const closeBtn = this.querySelector('#close-modal-btn');
    const cancelBtn = this.querySelector('#modal-cancel-btn');
    const saveBtn = this.querySelector('#modal-save-btn');
    
    closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
    cancelBtn.addEventListener('click', () => modal.classList.add('hidden'));

    this.querySelectorAll('.inspect-btn, .override-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const taskId = e.target.getAttribute('data-id');
        this.openInspectionModal(taskId);
      });
    });

    this.querySelectorAll('.retry-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const taskId = e.target.getAttribute('data-id');
        this.triggerRetry(taskId);
      });
    });

    saveBtn.addEventListener('click', () => {
      this.saveManualOverride();
    });
  }

  openInspectionModal(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;

    this.currentInspectedTaskId = taskId;
    const modal = this.querySelector('#ops-modal');
    
    this.querySelector('#modal-task-title').textContent = `Task Detail-Inspektion [${task.id}]`;
    this.querySelector('#modal-task-subtitle').textContent = `Sparte: ${task.contractType} | Mandant: ${task.tenant}`;
    
    // Set raw text
    this.querySelector('#modal-raw-text').value = task.rawText;
    
    // Set JSON content
    const jsonArea = this.querySelector('#modal-extracted-json');
    if (task.extractedData) {
      jsonArea.value = JSON.stringify(task.extractedData, null, 2);
    } else {
      jsonArea.value = `{\n  "error": "Es wurden noch keine AI-Fakten strukturiert.",\n  "status": "${task.status}"\n}`;
    }

    // Set error banner if failed
    const errorBanner = this.querySelector('#modal-error-banner');
    if (task.status === 'failed') {
      errorBanner.textContent = task.error;
      errorBanner.classList.remove('hidden');
    } else {
      errorBanner.classList.add('hidden');
    }

    modal.classList.remove('hidden');
  }

  triggerRetry(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.status = 'processing';
      task.progress = 10;
      task.error = null;
      this.render();
      
      this.dispatchEvent(new CustomEvent('ops-log', {
        bubbles: true,
        composed: true,
        detail: {
          source: 'pipeline-queue',
          type: 'info',
          message: `MANUAL INTERVENTION: Pipeline-Retry für Task "${taskId}" manuell ausgelöst. 🔄`
        }
      }));

      // Simulate step-by-step progress
      let interval = setInterval(() => {
        if (task.progress < 90) {
          task.progress += 20;
          this.render();
        } else {
          task.progress = 100;
          task.status = 'completed';
          task.extractedData = { arbeitspreis: 11.20, grundgebühr: 15.00, laufzeit: 12, kuendigungsfrist: 3 };
          clearInterval(interval);
          this.render();
          
          this.dispatchEvent(new CustomEvent('ops-log', {
            bubbles: true,
            composed: true,
            detail: {
              source: 'pipeline-queue',
              type: 'success',
              message: `PIPELINE SUCCESS: Task "${taskId}" nach manuellem Retry erfolgreich berechnet. ✅`
            }
          }));
        }
      }, 1500);
    }
  }

  saveManualOverride() {
    const taskId = this.currentInspectedTaskId;
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;

    const jsonArea = this.querySelector('#modal-extracted-json');
    const rawTextArea = this.querySelector('#modal-raw-text');
    const jsonError = this.querySelector('#json-error-msg');

    try {
      const parsed = JSON.parse(jsonArea.value);
      task.extractedData = parsed;
      task.rawText = rawTextArea.value;
      task.status = 'completed';
      task.progress = 100;
      jsonError.classList.add('hidden');
      this.querySelector('#ops-modal').classList.add('hidden');
      this.render();

      this.dispatchEvent(new CustomEvent('ops-log', {
        bubbles: true,
        composed: true,
        detail: {
          source: 'pipeline-queue',
          type: 'success',
          message: `MANUAL INTERVENTION: Task "${taskId}" manuell überschrieben (Override). Werte an Spring Boot Rule Engine gesendet! 💾`
        }
      }));
    } catch (e) {
      jsonError.textContent = `Ungültiges JSON-Format: ${e.message}`;
      jsonError.classList.remove('hidden');
    }
  }
}

customElements.define('ops-pipeline-queue', OpsPipelineQueue);
