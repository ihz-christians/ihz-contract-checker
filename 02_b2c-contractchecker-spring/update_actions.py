import re

with open("src/main/resources/templates/contract_details.html", "r", encoding="utf-8") as f:
    content = f.read()

actions_html = """
            <!-- Aktionen / Nächste Schritte -->
            <div class="bg-blue-50/50 border-l-4 border-blue-500 border-t border-r border-b border-blue-200 rounded-2xl p-5 flex gap-4 items-start shadow-sm mb-6">
                <span class="text-3xl mt-1">💡</span>
                <div class="w-full">
                    <h3 class="font-extrabold text-slate-900 text-base mb-1">Empfohlene Aktionen & Kontakt</h3>
                    <p class="text-slate-600 text-sm mb-4">Hier finden Sie die wichtigsten nächsten Schritte, um Ihre Rechte durchzusetzen oder den Vertrag anzupassen.</p>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <!-- Action 1: Provider kontaktieren -->
                        <div class="bg-white rounded-xl p-4 border border-blue-100 shadow-sm flex flex-col h-full">
                            <div class="flex items-center gap-2 mb-2">
                                <span class="text-lg">📞</span>
                                <h4 class="font-bold text-slate-800 text-sm" th:text="${analysis.overview.provider != null ? analysis.overview.provider + ' kontaktieren' : 'Anbieter kontaktieren'}">Anbieter kontaktieren</h4>
                            </div>
                            <p class="text-xs text-slate-600 mb-4 flex-grow">
                                Nehmen Sie Kontakt auf, um den Vertrag herunterzustufen, Optionen zu kündigen oder offene Fragen zu klären.
                            </p>
                            <div class="space-y-2 mt-auto">
                                <a th:if="${analysis.overview.contactHotline != null && !analysis.overview.contactHotline.isEmpty()}" 
                                   th:href="'tel:' + ${analysis.overview.contactHotline.replaceAll('[^0-9+]', '')}" 
                                   class="text-xs bg-blue-100 hover:bg-blue-200 text-blue-900 font-semibold px-3 py-2 rounded-lg block text-center transition-colors">
                                    Anrufen: <span th:text="${analysis.overview.contactHotline}"></span>
                                </a>
                                <button type="button"
                                        th:attr="onclick='appendUserMessage(\'Schreibe mir eine E-Mail an ' + (${analysis.overview.provider != null ? analysis.overview.provider.replace('\'', '\\\'') : 'den Anbieter'}) + ', um meinen Vertrag herunterzustufen oder nicht benötigte Optionen zu kündigen.\')'"
                                        hx-post="/chatbot/query"
                                        hx-target="#chat-loading"
                                        hx-swap="beforebegin"
                                        hx-indicator="#chat-loading"
                                        hx-on::after-request="document.getElementById('chat-messages').scrollTo({top: document.getElementById('chat-messages').scrollHeight, behavior: 'smooth'});"
                                        th:hx-vals="'{&quot;question&quot;: &quot;Schreibe mir eine E-Mail an ' + (${analysis.overview.provider != null ? analysis.overview.provider : 'den Anbieter'}) + ', um meinen Vertrag herunterzustufen oder nicht benötigte Optionen zu kündigen.&quot;, &quot;contractId&quot;: &quot;' + ${contract.id} + '&quot;, &quot;contractType&quot;: &quot;' + ${contract.contractType} + '&quot;}'"
                                        class="w-full text-xs bg-white border border-blue-200 hover:bg-blue-50 text-blue-800 font-semibold px-3 py-2 rounded-lg text-center transition-colors flex items-center justify-center gap-1.5">
                                    ✉️ E-Mail Vorlage generieren
                                </button>
                            </div>
                        </div>

                        <!-- Action 2: Verbraucherschutz -->
                        <div class="bg-white rounded-xl p-4 border border-blue-100 shadow-sm flex flex-col h-full">
                            <div class="flex items-center gap-2 mb-2">
                                <span class="text-lg">⚖️</span>
                                <h4 class="font-bold text-slate-800 text-sm">Verbraucherschutz einschalten</h4>
                            </div>
                            <p class="text-xs text-slate-600 mb-4 flex-grow">
                                Bei hartnäckigen Problemen, unzulässigen Klauseln oder rechtlichen Zweifeln (z.B. versteckte Kosten) hilft die Verbraucherzentrale.
                            </p>
                            <div class="space-y-2 mt-auto">
                                <a href="https://www.verbraucherzentrale.de/beratung" target="_blank" class="text-xs bg-blue-100 hover:bg-blue-200 text-blue-900 font-semibold px-3 py-2 rounded-lg block text-center transition-colors">
                                    🌐 Zur Online-Beratung
                                </a>
                                <button type="button"
                                        onclick="appendUserMessage('Schreibe mir eine Beschwerde-E-Mail an den Verbraucherschutz bezüglich unklarer Vertragskonditionen bei meinem Anbieter.')"
                                        hx-post="/chatbot/query"
                                        hx-target="#chat-loading"
                                        hx-swap="beforebegin"
                                        hx-indicator="#chat-loading"
                                        hx-on::after-request="document.getElementById('chat-messages').scrollTo({top: document.getElementById('chat-messages').scrollHeight, behavior: 'smooth'});"
                                        th:hx-vals="'{&quot;question&quot;: &quot;Schreibe mir eine formelle Beschwerde-E-Mail an den Verbraucherschutz bezüglich versteckter Kosten und unklarer Vertragskonditionen bei meinem Anbieter.&quot;, &quot;contractId&quot;: &quot;' + ${contract.id} + '&quot;, &quot;contractType&quot;: &quot;' + ${contract.contractType} + '&quot;}'"
                                        class="w-full text-xs bg-white border border-blue-200 hover:bg-blue-50 text-blue-800 font-semibold px-3 py-2 rounded-lg text-center transition-colors flex items-center justify-center gap-1.5">
                                    ✉️ Beschwerde formulieren
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Main Overview Metrics -->"""

content = content.replace("<!-- Main Overview Metrics -->", actions_html)

with open("src/main/resources/templates/contract_details.html", "w", encoding="utf-8") as f:
    f.write(content)

