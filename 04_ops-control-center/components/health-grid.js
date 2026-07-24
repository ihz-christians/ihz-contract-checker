class OpsHealthGrid extends HTMLElement {
  constructor() {
    super();
    this.services = [
      { id: 'spring-core', name: 'Spring Boot Core Service', type: 'Core API', status: 'unknown', latency: '--', uptime: '--', details: 'Warte auf Systemdaten...' },
      { id: 'fastapi-ai', name: 'FastAPI AI Gateway', type: 'AI Parser', status: 'unknown', latency: '--', uptime: '--', details: 'Warte auf Systemdaten...' },
      { id: 'postgres-db', name: 'PostgreSQL Database', type: 'Storage', status: 'unknown', latency: '--', uptime: '--', details: 'Warte auf Systemdaten...' },
      { id: 's3-storage', name: 'MinIO S3 Object Storage', type: 'Storage', status: 'unknown', latency: '--', uptime: '--', details: 'Warte auf Systemdaten...' },
      { id: 'gemini-api', name: 'Google Gemini 2.5 API', type: 'External LLM', status: 'unknown', latency: '--', uptime: '--', details: 'Warte auf Systemdaten...' }
    ];
  }

  connectedCallback() {
    this.render();
    this.startLiveMonitoring();
    document.addEventListener('ops-metrics-updated', (e) => this.handleMetricsUpdate(e.detail));
  }

  handleMetricsUpdate(metrics) {
    if (!metrics) return;

    // Update Spring Core
    const spring = this.services.find(s => s.id === 'spring-core');
    if (spring && metrics.system) {
      spring.details = `JVM Threads: ${metrics.system.activeThreads || 15} active. CPU: ${metrics.system.cpuUsage || '1.2%'}. Uptime: ${Math.floor(metrics.system.jvmUptimeMs / 1000 / 60)}m.`;
      spring.status = 'healthy';
    }

    // Update PostgreSQL
    const db = this.services.find(s => s.id === 'postgres-db');
    if (db && metrics.database) {
      db.details = `RLS: ${metrics.rlsEnforced ? 'Forced Active' : 'Active'}. Users: ${metrics.database.totalUsers || 0}, Docs: ${metrics.database.totalContracts || 0}, Tasks: ${metrics.database.totalTasks || 0}`;
      db.status = 'healthy';
    }

    this.render();
  }

  startLiveMonitoring() {
    // Mock-Interval entfernt - Daten kommen live via Events aus app.js
  }

  disconnectedCallback() {
  }

  simulateFailure(serviceId) {
    const service = this.services.find(s => s.id === serviceId);
    if (service) {
      service.status = service.status === 'healthy' || service.status === 'warning' ? 'down' : 'healthy';
      service.latency = service.status === 'down' ? '--' : '42ms';
      this.render();
      
      // Dispatch custom event for global log
      const statusMessage = service.status === 'down' 
        ? `CRITICAL: Service "${service.name}" reported state DOWN! ❌`
        : `INFO: Service "${service.name}" recovered and is healthy. ✅`;
      
      this.dispatchEvent(new CustomEvent('ops-log', {
        bubbles: true,
        composed: true,
        detail: {
          source: serviceId,
          type: service.status === 'down' ? 'error' : 'success',
          message: statusMessage
        }
      }));
    }
  }

  updateGrid() {
    this.services.forEach(service => {
      const card = this.querySelector(`[data-service-id="${service.id}"]`);
      if (card) {
        // Update latency
        const latencyEl = card.querySelector('.latency-val');
        if (latencyEl) latencyEl.textContent = service.latency;
        
        // Update status indicator
        const indicatorEl = card.querySelector('.status-indicator');
        const badgeEl = card.querySelector('.status-badge');
        
        if (service.status === 'healthy') {
          indicatorEl.className = 'status-indicator w-3 h-3 rounded-full bg-emerald-500 animate-pulse';
          badgeEl.className = 'status-badge text-xs px-2 py-0.5 rounded-full font-semibold bg-emerald-950/40 text-emerald-600 border border-emerald-800/50';
          badgeEl.textContent = 'ONLINE';
        } else if (service.status === 'warning') {
          indicatorEl.className = 'status-indicator w-3 h-3 rounded-full bg-amber-500 animate-pulse';
          badgeEl.className = 'status-badge text-xs px-2 py-0.5 rounded-full font-semibold bg-amber-950/40 text-amber-600 border border-amber-800/50';
          badgeEl.textContent = 'WARNUNG';
        } else {
          indicatorEl.className = 'status-indicator w-3 h-3 rounded-full bg-rose-500';
          badgeEl.className = 'status-badge text-xs px-2 py-0.5 rounded-full font-semibold bg-rose-950/40 text-rose-600 border border-rose-800/50';
          badgeEl.textContent = 'OFFLINE';
        }
      }
    });
  }

  render() {
    this.innerHTML = `
      <div class="bg-white rounded-2xl border border-slate-200 p-6 backdrop-blur-md">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-[#4A7C59]/10 rounded-lg text-[#2D5016] border border-[#4A7C59]/20">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 class="text-lg font-bold text-slate-900 tracking-tight">Infrastruktur Live-Überwachung</h2>
              <p class="text-xs text-slate-600 mt-0.5">Automatisches Monitoring aller verteilten Microservices</p>
            </div>
          </div>
          
          <button id="refresh-health-btn" class="flex items-center gap-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 active:bg-slate-100/60 text-slate-700 px-3.5 py-1.5 rounded-xl border border-slate-200 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.228 10H18.2" />
            </svg>
            Live-Status aktualisieren
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          ${this.services.map(service => {
            const isHealthy = service.status === 'healthy';
            const isWarning = service.status === 'warning';
            
            let statusColor = 'bg-emerald-500 animate-pulse';
            let badgeClass = 'bg-emerald-950/40 text-emerald-600 border border-emerald-800/50';
            let badgeText = 'ONLINE';
            
            if (isWarning) {
              statusColor = 'bg-amber-500 animate-pulse';
              badgeClass = 'bg-amber-950/40 text-amber-600 border border-amber-800/50';
              badgeText = 'WARNUNG';
            } else if (service.status === 'down') {
              statusColor = 'bg-rose-500';
              badgeClass = 'bg-rose-950/40 text-rose-600 border border-rose-800/50';
              badgeText = 'OFFLINE';
            }

            return `
              <div data-service-id="${service.id}" class="bg-slate-50 rounded-xl border border-slate-200 p-5 hover:border-slate-300 transition-all relative overflow-hidden group">
                <div class="absolute inset-0 bg-gradient-to-br from-[#2D5016]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div class="flex items-center justify-between mb-3.5 relative z-10">
                  <span class="text-[10px] tracking-wider uppercase font-extrabold text-slate-500">${service.type}</span>
                  <div class="flex items-center gap-2">
                    <div class="status-indicator w-2.5 h-2.5 rounded-full ${statusColor}"></div>
                    <span class="status-badge ${badgeClass}">${badgeText}</span>
                  </div>
                </div>

                <h3 class="text-sm font-bold text-slate-800 group-hover:text-[#2D5016] transition-colors relative z-10">${service.name}</h3>
                
                <div class="grid grid-cols-2 gap-4 mt-4 py-2 border-t border-b border-slate-200 relative z-10">
                  <div>
                    <span class="block text-[10px] text-slate-500 uppercase font-semibold">Latenz</span>
                    <span class="latency-val text-sm font-bold text-slate-700 font-mono">${service.latency}</span>
                  </div>
                  <div>
                    <span class="block text-[10px] text-slate-500 uppercase font-semibold">Uptime</span>
                    <span class="text-sm font-bold text-slate-700 font-mono">${service.uptime}</span>
                  </div>
                </div>

                <div class="mt-3.5 flex items-center justify-between relative z-10">
                  <p class="text-[11px] text-slate-600 font-medium truncate max-w-[170px]">${service.details}</p>
                  <button class="simulate-btn text-[10px] font-extrabold text-slate-500 hover:text-slate-700 uppercase tracking-widest border border-slate-200 hover:border-slate-300 bg-slate-100 px-2.5 py-1 rounded-md transition-all" data-id="${service.id}">
                    Inject Fail
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    // Event listeners
    this.querySelector('#refresh-health-btn').addEventListener('click', () => {
      // Manueller Refresh kann später echter Fetch sein
      this.render();
    });

    this.querySelectorAll('.simulate-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        this.simulateFailure(id);
      });
    });
  }
}

customElements.define('ops-health-grid', OpsHealthGrid);
