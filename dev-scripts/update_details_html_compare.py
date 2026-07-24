import re

with open('../02_b2c-contractchecker-spring/src/main/resources/templates/contract_details.html', 'r') as f:
    content = f.read()

compare_html = """
                <!-- Comparison Section (If comparisonResult exists) -->
                <div th:if="${analysis.overview.comparisonResult != null}" class="bg-indigo-50 border-l-4 border-indigo-500 rounded-r-xl p-5 mb-8 shadow-sm">
                    <div class="flex items-start gap-4">
                        <span class="text-3xl mt-1">⚖️</span>
                        <div class="flex-1">
                            <h3 class="font-bold text-indigo-900 text-sm mb-2">Vertragsvergleich (Alt vs. Neu)</h3>
                            
                            <div class="space-y-4">
                                <div>
                                    <h4 class="text-[11px] font-bold text-indigo-800 uppercase tracking-wider mb-1">Unterschiede</h4>
                                    <p class="text-indigo-900 text-xs leading-relaxed bg-white/50 p-3 rounded-lg border border-indigo-100" th:text="${analysis.overview.comparisonResult.differences}">
                                        Unterschiede...
                                    </p>
                                </div>
                                
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <h4 class="text-[11px] font-bold text-indigo-800 uppercase tracking-wider mb-1">KI Empfehlung</h4>
                                        <p class="text-indigo-900 font-semibold text-sm" th:text="${analysis.overview.comparisonResult.recommendation}">
                                            Empfehlung...
                                        </p>
                                    </div>
                                    <div>
                                        <h4 class="text-[11px] font-bold text-indigo-800 uppercase tracking-wider mb-1">Begründung</h4>
                                        <p class="text-indigo-900 text-xs leading-relaxed" th:text="${analysis.overview.comparisonResult.explanation}">
                                            Begründung...
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
"""

# Insert it before the "Die NEUE Kostenübersicht"
pattern = r'(<!-- Die NEUE Kostenübersicht \(Sauber kategorisiert\) -->)'
content = re.sub(pattern, compare_html + '\n                \\1', content)

with open('../02_b2c-contractchecker-spring/src/main/resources/templates/contract_details.html', 'w') as f:
    f.write(content)
