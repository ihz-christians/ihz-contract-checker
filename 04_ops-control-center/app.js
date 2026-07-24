// Bootstrap and State Coordinator for Ops Control Center

const OPS_SECRET = 'super-secure-ops-token-2026';

document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing Operations Control Center App...');
  
  // Set default initial value for users
  const headerUsersEl = document.getElementById('header-total-users');
  if (headerUsersEl) {
    headerUsersEl.textContent = 'Verbinde...';
  }

  // Register Progressive Web App Service Worker
  registerServiceWorker();

  // Initialize terminal stream logging
  setupLogStream();

  // Start periodic polling of actual Spring-Boot / PostgreSQL metrics
  startMetricsPolling();
});

// Periodic polling coordinator for real backend metrics
function startMetricsPolling() {
  // Initial fetch
  fetchRealMetrics();
  fetchRealLlmMetrics();
  // Poll every 5 seconds
  setInterval(fetchRealMetrics, 5000);
  setInterval(fetchRealLlmMetrics, 5000);
}

async function fetchRealLlmMetrics() {
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === '[::1]';
  const urls = isLocal ? [
    'http://localhost:8000/api/v1/ops/llm-metrics',
    '/api/v1/ops/llm-metrics'
  ] : [
    '/api/v1/ops/llm-metrics'
  ];
  
  for (const url of urls) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Ops-Secret': OPS_SECRET,
          'Accept': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        
        // Dispatch global event for components to consume
        document.dispatchEvent(new CustomEvent('ops-llm-metrics-updated', {
          detail: data
        }));
        return;
      }
    } catch (e) {
      // Quietly try next url
    }
  }
}

async function fetchRealMetrics() {
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === '[::1]';
  const urls = isLocal ? [
    'http://localhost:8080/api/admin/ops/metrics',
    '/api/admin/ops/metrics'
  ] : [
    '/api/admin/ops/metrics'
  ];
  
  for (const url of urls) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Ops-Secret': OPS_SECRET,
          'Accept': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        
        // Update total users in Header live
        const headerUsersEl = document.getElementById('header-total-users');
        if (headerUsersEl && data.database && data.database.totalUsers !== undefined) {
          headerUsersEl.textContent = `${data.database.totalUsers} Benutzer`;
        }

        // Update system uptime in Header live
        const headerUptimeEl = document.getElementById('header-system-uptime');
        if (headerUptimeEl && data.system && data.system.jvmUptimeMs !== undefined) {
          const uptimeSec = Math.floor(data.system.jvmUptimeMs / 1000);
          const hours = Math.floor(uptimeSec / 3600);
          const minutes = Math.floor((uptimeSec % 3600) / 60);
          headerUptimeEl.textContent = `${hours} Std. ${minutes} Min.`;
        }

        // Update RLS Auditing Status in Header live
        const headerRlsEl = document.getElementById('header-db-auditing');
        if (headerRlsEl && data.rlsEnforced !== undefined) {
          if (data.rlsEnforced) {
            headerRlsEl.className = 'text-emerald-600 font-semibold flex items-center gap-1 font-mono';
            headerRlsEl.innerHTML = `
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4" />
              </svg>
              RLS Aktiv
            `;
          } else {
            headerRlsEl.className = 'text-rose-600 font-semibold flex items-center gap-1 font-mono';
            headerRlsEl.innerHTML = `
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              RLS Inaktiv!
            `;
          }
        }
        
        // Dispatch global event for components to consume
        document.dispatchEvent(new CustomEvent('ops-metrics-updated', {
          detail: data
        }));
        return;
      }
    } catch (e) {
      // Quietly try next url
    }
  }
}

// PWA Service Worker Registration
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then((registration) => {
          console.log('[PWA] ServiceWorker registered successfully under scope:', registration.scope);
          showToast('PWA Aktiv', 'Das Ops Control Center ist jetzt offline-fähig und installierbar!');
        })
        .catch((err) => {
          console.error('[PWA] ServiceWorker registration failed:', err);
        });
    });
  }
}

// Global real-time logging console coordinator
function setupLogStream() {
  const streamBody = document.getElementById('log-stream-body');
  if (!streamBody) return;

  // Listen to custom 'ops-log' events dispatched by subcomponents
  document.addEventListener('ops-log', (e) => {
    const { source, type, message } = e.detail;
    appendLogMessage(source, type, message);
  });
}

function appendLogMessage(source, type, message) {
  const streamBody = document.getElementById('log-stream-body');
  if (!streamBody) return;

  const timestamp = new Date().toLocaleTimeString();
  
  // Choose color based on type
  let colorClass = 'text-slate-700';
  let tagColor = 'bg-slate-100 text-slate-600 border-slate-300/50';
  
  if (type === 'error') {
    colorClass = 'text-rose-600 font-semibold';
    tagColor = 'bg-rose-950/50 text-rose-600 border-rose-900/50 animate-pulse';
  } else if (type === 'warning') {
    colorClass = 'text-amber-600 font-semibold';
    tagColor = 'bg-amber-950/50 text-amber-600 border-amber-900/50';
  } else if (type === 'success') {
    colorClass = 'text-emerald-600';
    tagColor = 'bg-emerald-950/50 text-emerald-600 border-emerald-900/50';
  }

  const logEntry = document.createElement('div');
  logEntry.className = 'flex flex-col sm:flex-row sm:items-start gap-2 p-2.5 bg-slate-50 border-b border-slate-200/60 font-mono text-xs leading-relaxed text-left';
  logEntry.innerHTML = `
    <span class="text-slate-500 font-bold shrink-0">${timestamp}</span>
    <span class="px-2 py-0.5 text-[10px] font-bold rounded uppercase border shrink-0 ${tagColor}">${source}</span>
    <span class="${colorClass}">${message}</span>
  `;

  streamBody.insertBefore(logEntry, streamBody.firstChild);

  // Trim older logs if too many
  while (streamBody.children.length > 50) {
    streamBody.removeChild(streamBody.lastChild);
  }
}

// Lightweight notification utility
function showToast(title, body) {
  const toastContainer = document.getElementById('toast-container');
  if (!toastContainer) return;

  const toast = document.createElement('div');
  toast.className = 'bg-white/95 border border-slate-200 p-4 rounded-xl shadow-2xl flex flex-col gap-1 text-left transform translate-y-10 opacity-0 transition-all duration-300 pointer-events-auto backdrop-blur-md max-w-sm border-l-4 border-l-[#2D5016]';
  toast.innerHTML = `
    <span class="text-xs font-black text-slate-900 uppercase tracking-wider">${title}</span>
    <p class="text-[11px] text-slate-600 font-semibold">${body}</p>
  `;

  toastContainer.appendChild(toast);
  
  // Animate in
  setTimeout(() => {
    toast.classList.remove('translate-y-10', 'opacity-0');
  }, 100);

  // Dismiss automatically after 5 seconds
  setTimeout(() => {
    toast.classList.add('opacity-0', 'scale-95');
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}
