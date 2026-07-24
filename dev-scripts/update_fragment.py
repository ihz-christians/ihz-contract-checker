import re

file_path = 'src/main/resources/templates/analysis_status.html'
with open(file_path, 'r') as f:
    content = f.read()

# First, remove the fragment from the bottom
fragment_start_pattern = r'    <!-- Fragment that is returned by the progress endpoint -->'
fragment_end_pattern = r'    </div>\n</body>'

content_before_fragment = content.split(fragment_start_pattern)[0]

# Now, we put the fragment inside the HTMX Polling Element, replacing the th:replace
new_htmx_block = """        <!-- HTMX Polling Element -->
        <div th:hx-get="@{/contract/status/{id}/progress(id=${contract.id})}"
             hx-trigger="every 1.5s"
             hx-swap="innerHTML"
             class="mb-8"
             id="progress-container">
             
             <!-- Fragment -->
             <div th:fragment="progress_content" class="w-full">
                 <!-- Completed State -->
                 <div th:if="${status == 'completed'}" class="w-full text-center py-6" hx-trigger="load" th:hx-get="@{/contract/status/{id}/redirect-trigger(id=${contractId})}">
                     <div class="inline-block animate-spin rounded-full h-10 w-10 border-4 border-muted border-t-primary mb-4"></div>
                     <span class="block text-foreground font-bold text-lg">Analyse abgeschlossen!</span>
                     <span class="block text-muted-foreground text-sm mt-1">Ergebnisse werden geladen...</span>
                 </div>

                 <!-- Error State -->
                 <div th:if="${status == 'error'}" class="w-full text-center bg-destructive/10 border border-destructive/20 rounded-2xl p-6">
                     <div class="w-12 h-12 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-3">
                         <span class="text-destructive text-xl">❌</span>
                     </div>
                     <div class="text-destructive font-extrabold text-lg mb-2">Analyse fehlgeschlagen</div>
                     <p class="text-destructive/80 text-sm mb-5 leading-relaxed" th:text="${errorMessage}">Fehler.</p>
                     <a href="/dashboard" class="inline-block text-sm bg-background border border-border text-foreground px-5 py-2.5 rounded-xl font-bold hover:bg-muted transition-colors shadow-sm">← Zurück zum Dashboard</a>
                 </div>

                 <!-- Pending State -->
                 <div th:if="${status != 'completed' and status != 'error'}">
                     <div class="space-y-3 mb-10">
                         <div class="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2.5">
                             <span>Analyse-Fortschritt</span>
                             <span class="text-primary" th:text="${progress} + '%'">0%</span>
                         </div>
                         <div class="w-full bg-secondary rounded-full h-2 overflow-hidden shadow-inner border border-border/50">
                             <div class="bg-primary h-full rounded-full transition-all duration-500 ease-out relative overflow-hidden" th:style="'width: ' + ${progress} + '%'">
                                 <div class="absolute top-0 bottom-0 left-0 right-0 bg-white/20 w-full animate-[shimmer_2s_infinite]"></div>
                             </div>
                         </div>
                     </div>

                     <!-- Dynamic Legal Stepper without technical terms -->
                     <div class="space-y-6 mt-10">
                         
                         <!-- Step 1 -->
                         <div class="flex items-start gap-4" th:classappend="${progress < 0 ? 'opacity-40' : ''}">
                             <!-- Done -->
                             <div th:if="${progress >= 25}" class="mt-0.5 h-7 w-7 rounded-full bg-[#E8F3EA] flex items-center justify-center border border-[#C5E1CB] shrink-0">
                                 <svg class="w-4 h-4 text-[#2D3E2F]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                             </div>
                             <!-- Active -->
                             <div th:if="${progress >= 0 and progress < 25}" class="mt-0.5 h-7 w-7 rounded-full bg-[#2D3E2F]/10 flex items-center justify-center border border-[#2D3E2F]/20 shrink-0 relative">
                                 <span class="animate-ping absolute h-full w-full rounded-full bg-[#2D3E2F]/30 opacity-75"></span>
                                 <div class="w-2.5 h-2.5 bg-[#2D3E2F] rounded-full"></div>
                             </div>
                             <!-- Waiting -->
                             <div th:if="${progress < 0}" class="mt-0.5 h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
                                 <div class="w-2.5 h-2.5 bg-slate-300 rounded-full"></div>
                             </div>
                             <div>
                                 <p class="text-[15px] leading-none" th:classappend="${progress >= 0 and progress < 25 ? 'font-extrabold text-[#2D3E2F]' : 'font-bold text-slate-800'}">Dokument sicher hochgeladen</p>
                                 <p class="text-xs mt-1.5" th:classappend="${progress >= 0 and progress < 25 ? 'font-bold text-[#2D3E2F]/70' : 'font-medium text-slate-500'}">Ihre Daten werden vertraulich behandelt</p>
                             </div>
                         </div>

                         <!-- Step 2 -->
                         <div class="flex items-start gap-4" th:classappend="${progress < 25 ? 'opacity-40' : ''}">
                             <div th:if="${progress >= 50}" class="mt-0.5 h-7 w-7 rounded-full bg-[#E8F3EA] flex items-center justify-center border border-[#C5E1CB] shrink-0">
                                 <svg class="w-4 h-4 text-[#2D3E2F]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                             </div>
                             <div th:if="${progress >= 25 and progress < 50}" class="mt-0.5 h-7 w-7 rounded-full bg-[#2D3E2F]/10 flex items-center justify-center border border-[#2D3E2F]/20 shrink-0 relative">
                                 <span class="animate-ping absolute h-full w-full rounded-full bg-[#2D3E2F]/30 opacity-75"></span>
                                 <div class="w-2.5 h-2.5 bg-[#2D3E2F] rounded-full"></div>
                             </div>
                             <div th:if="${progress < 25}" class="mt-0.5 h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
                                 <div class="w-2.5 h-2.5 bg-slate-300 rounded-full"></div>
                             </div>
                             <div>
                                 <p class="text-[15px] leading-none" th:classappend="${progress >= 25 and progress < 50 ? 'font-extrabold text-[#2D3E2F]' : 'font-bold text-slate-800'}">Vertragsdaten werden gelesen</p>
                                 <p class="text-xs mt-1.5" th:classappend="${progress >= 25 and progress < 50 ? 'font-bold text-[#2D3E2F]/70' : 'font-medium text-slate-500'}">Laufzeiten, Fristen und Kosten werden extrahiert</p>
                             </div>
                         </div>

                         <!-- Step 3 -->
                         <div class="flex items-start gap-4" th:classappend="${progress < 50 ? 'opacity-40' : ''}">
                             <div th:if="${progress >= 75}" class="mt-0.5 h-7 w-7 rounded-full bg-[#E8F3EA] flex items-center justify-center border border-[#C5E1CB] shrink-0">
                                 <svg class="w-4 h-4 text-[#2D3E2F]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                             </div>
                             <div th:if="${progress >= 50 and progress < 75}" class="mt-0.5 h-7 w-7 rounded-full bg-[#2D3E2F]/10 flex items-center justify-center border border-[#2D3E2F]/20 shrink-0 relative">
                                 <span class="animate-ping absolute h-full w-full rounded-full bg-[#2D3E2F]/30 opacity-75"></span>
                                 <div class="w-2.5 h-2.5 bg-[#2D3E2F] rounded-full"></div>
                             </div>
                             <div th:if="${progress < 50}" class="mt-0.5 h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
                                 <div class="w-2.5 h-2.5 bg-slate-300 rounded-full"></div>
                             </div>
                             <div>
                                 <p class="text-[15px] leading-none" th:classappend="${progress >= 50 and progress < 75 ? 'font-extrabold text-[#2D3E2F]' : 'font-bold text-slate-800'}">Rechtliche Prüfung läuft</p>
                                 <p class="text-xs mt-1.5" th:classappend="${progress >= 50 and progress < 75 ? 'font-bold text-[#2D3E2F]/70' : 'font-medium text-slate-500'}">Wir suchen nach versteckten Klauseln und Risiken</p>
                             </div>
                         </div>

                         <!-- Step 4 -->
                         <div class="flex items-start gap-4" th:classappend="${progress < 75 ? 'opacity-40' : ''}">
                             <div th:if="${progress >= 100}" class="mt-0.5 h-7 w-7 rounded-full bg-[#E8F3EA] flex items-center justify-center border border-[#C5E1CB] shrink-0">
                                 <svg class="w-4 h-4 text-[#2D3E2F]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                             </div>
                             <div th:if="${progress >= 75 and progress < 100}" class="mt-0.5 h-7 w-7 rounded-full bg-[#2D3E2F]/10 flex items-center justify-center border border-[#2D3E2F]/20 shrink-0 relative">
                                 <span class="animate-ping absolute h-full w-full rounded-full bg-[#2D3E2F]/30 opacity-75"></span>
                                 <div class="w-2.5 h-2.5 bg-[#2D3E2F] rounded-full"></div>
                             </div>
                             <div th:if="${progress < 75}" class="mt-0.5 h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
                                 <div class="w-2.5 h-2.5 bg-slate-300 rounded-full"></div>
                             </div>
                             <div>
                                 <p class="text-[15px] leading-none" th:classappend="${progress >= 75 and progress < 100 ? 'font-extrabold text-[#2D3E2F]' : 'font-bold text-slate-800'}">Kostenübersicht wird erstellt</p>
                                 <p class="text-xs mt-1.5" th:classappend="${progress >= 75 and progress < 100 ? 'font-bold text-[#2D3E2F]/70' : 'font-medium text-slate-500'}">Berechnung der Gesamtkosten und Vergleich</p>
                             </div>
                         </div>
                     </div>
                 </div>
             </div>
        </div>

        <!-- Trust Footer -->"""

pattern = r'        <!-- HTMX Polling Element -->.*?<!-- Trust Footer -->'
content_before_fragment = re.sub(pattern, new_htmx_block, content_before_fragment, flags=re.DOTALL)
content_before_fragment += "</body>\n</html>"

with open(file_path, 'w') as f:
    f.write(content_before_fragment)
