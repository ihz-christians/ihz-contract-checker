import re

file_path = 'src/main/resources/templates/contract_details.html'
with open(file_path, 'r') as f:
    content = f.read()

new_ui = """                    <!-- TCO Banner (Das Wichtigste!) -->
                    <div class="grid grid-cols-2 gap-4 mb-6">
                        <div class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-5 text-white shadow-md relative overflow-hidden group">
                            <div class="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
                                <svg class="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.64-2.25 1.64-1.74 0-2.1-.96-2.17-1.92H8.01c.12 1.98 1.48 2.85 2.89 3.2V19h2.33v-1.7c1.71-.36 2.84-1.43 2.84-2.99 0-1.89-1.39-2.82-3.76-3.17z"/></svg>
                            </div>
                            <div class="relative z-10">
                                <p class="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Gesamtkosten (TCO)</p>
                                <p class="text-xs text-slate-300 mb-3">Gesamtsumme inkl. allem</p>
                                <span class="text-3xl font-black" th:text="${analysis.overview.calculatedTco} + ' €'">0,00 €</span>
                            </div>
                        </div>

                        <div class="bg-card rounded-xl p-5 border border-border shadow-sm relative overflow-hidden group">
                            <div class="absolute right-0 top-0 opacity-5 text-primary transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
                                <svg class="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                            </div>
                            <div class="relative z-10">
                                <p class="text-[10px] text-primary uppercase font-bold tracking-widest mb-1 flex items-center gap-1.5"><span class="h-2 w-2 rounded-full bg-primary/20 flex items-center justify-center"><span class="h-1 w-1 bg-primary rounded-full"></span></span> Realer Monatspreis</p>
                                <p class="text-xs text-muted-foreground mb-3" th:text="'Schnitt auf ' + ${analysis.overview.contractDuration.months} + ' Monate'">Schnitt auf 24 Monate</p>
                                <span class="text-3xl font-black text-primary" th:text="${analysis.overview.effectiveMonthly} + ' €'">0,00 €</span>
                            </div>
                        </div>
                    </div>

                    <!-- NEUE PHASE TIMELINE -->
                    <div class="mb-8" th:if="${analysis.overview.costs.phases != null && !analysis.overview.costs.phases.isEmpty()}">
                        <h4 class="font-bold text-xs uppercase tracking-wider text-card-foreground mb-4">Reale Preisentwicklung (Timeline)</h4>
                        
                        <div class="relative border-l-2 border-primary/20 ml-3 space-y-6">
                            <div th:each="phase : ${analysis.overview.costs.phases}" class="relative pl-6">
                                <!-- Node Marker -->
                                <div class="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-background border-2 border-primary shadow-sm flex items-center justify-center">
                                    <div class="h-1.5 w-1.5 rounded-full bg-primary"></div>
                                </div>
                                
                                <div class="bg-card border border-border shadow-sm rounded-xl p-4 flex justify-between items-center group hover:border-primary/50 transition-colors">
                                    <div>
                                        <p class="font-bold text-sm text-card-foreground" th:text="${phase.label}">Monat 1-6</p>
                                        <p class="text-xs text-muted-foreground mt-0.5">Aggregierter Monatspreis in dieser Phase</p>
                                    </div>
                                    <div class="text-right">
                                        <p class="font-black text-lg text-primary" th:text="${#numbers.formatDecimal(phase.price, 1, 2)} + ' €'">19,99 €</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="space-y-4">"""

old_ui = r'                    <!-- TCO Banner \(Das Wichtigste!\) -->.*?<div class="space-y-4">'

content = re.sub(old_ui, new_ui, content, flags=re.DOTALL)

with open(file_path, 'w') as f:
    f.write(content)
