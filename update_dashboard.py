import re

with open('02_b2c-contractchecker-spring/src/main/resources/templates/dashboard.html', 'r') as f:
    content = f.read()

new_form = """<form action="/contract/upload" method="POST" enctype="multipart/form-data" class="space-y-6">
                    <!-- Compare Mode Toggle -->
                    <div class="flex items-center justify-between bg-card border border-border p-4 rounded-2xl shadow-sm hover:border-primary/50 transition-colors">
                        <div class="flex flex-col">
                            <span class="text-sm font-bold text-card-foreground">Vertragsvergleich (Beta)</span>
                            <span class="text-xs text-muted-foreground mt-0.5">Zweiten Vertrag (z.B. Altvertrag) zum direkten Vergleich hochladen</span>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="compareToggle" name="isCompareMode" value="true" class="sr-only peer" onchange="toggleCompare()">
                            <div class="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </div>

                    <div class="grid grid-cols-1 gap-4" id="upload-grid">
                        <div id="dropzone" class="border-2 border-dashed border-input hover:border-primary bg-secondary rounded-2xl p-8 text-center transition-colors cursor-pointer relative">
                            <input type="file" id="file" name="file" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" required onchange="updateFileName(this)">
                            
                            <div class="space-y-3">
                                <div class="h-12 w-12 mx-auto bg-white rounded-full flex items-center justify-center shadow-sm text-primary">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="m9 15 3-3 3 3"/></svg>
                                </div>
                                <div class="text-card-foreground font-semibold" id="filename-label">PDF auswählen (Neuvertrag)</div>
                                <p class="text-xs text-muted-foreground">Maximale Dateigröße: 15MB. Nur PDF, DOCX, TXT.</p>
                            </div>
                        </div>

                        <div id="compare-dropzone-container" class="hidden h-full">
                            <div id="dropzone2" class="h-full border-2 border-dashed border-input hover:border-primary bg-secondary rounded-2xl p-8 text-center transition-colors cursor-pointer relative">
                                <input type="file" id="compareFile" name="compareFile" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onchange="updateCompareFileName(this)">
                                
                                <div class="space-y-3">
                                    <div class="h-12 w-12 mx-auto bg-white rounded-full flex items-center justify-center shadow-sm text-muted-foreground">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="m9 15 3-3 3 3"/></svg>
                                    </div>
                                    <div class="text-card-foreground font-semibold" id="compare-filename-label">PDF auswählen (Altvertrag)</div>
                                    <p class="text-xs text-muted-foreground">Optional. Maximale Dateigröße: 15MB.</p>
                                </div>
                            </div>
                        </div>
                    </div>"""

pattern = r'<form action="/contract/upload" method="POST" enctype="multipart/form-data" class="space-y-6">.*?</form>'
# we only replace up to the select, so we keep the select and submit button
pattern2 = r'<form action="/contract/upload" method="POST" enctype="multipart/form-data" class="space-y-6">.*?(?=<div class="space-y-1.5">)'
content = re.sub(pattern2, new_form + '\n                    ', content, flags=re.DOTALL)

# Add js for compare
js_to_add = """
        function toggleCompare() {
            const isCompare = document.getElementById('compareToggle').checked;
            const container = document.getElementById('compare-dropzone-container');
            const grid = document.getElementById('upload-grid');
            const compareInput = document.getElementById('compareFile');
            
            if(isCompare) {
                container.classList.remove('hidden');
                grid.classList.remove('grid-cols-1');
                grid.classList.add('grid-cols-2');
                compareInput.required = true;
            } else {
                container.classList.add('hidden');
                grid.classList.remove('grid-cols-2');
                grid.classList.add('grid-cols-1');
                compareInput.required = false;
            }
        }

        function updateCompareFileName(input) {
            const label = document.getElementById('compare-filename-label');
            if (input.files && input.files[0]) {
                label.textContent = input.files[0].name;
                label.classList.add('text-primary');
            } else {
                label.textContent = 'PDF auswählen (Altvertrag)';
                label.classList.remove('text-primary');
            }
        }
"""

content = content.replace('function updateFileName(input) {', js_to_add + '\n        function updateFileName(input) {')

with open('02_b2c-contractchecker-spring/src/main/resources/templates/dashboard.html', 'w') as f:
    f.write(content)
