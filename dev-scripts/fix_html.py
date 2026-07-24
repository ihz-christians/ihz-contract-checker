import re

with open("src/main/resources/templates/contract_details.html", "r", encoding="utf-8") as f:
    content = f.read()

script = """
    <script>
        function appendUserMessage(question) {
            const chatMessages = document.getElementById('chat-messages');
            const loadingIndicator = document.getElementById('chat-loading');
            
            // Create user message HTML
            const userMsgHtml = `
               <div class="flex justify-end mb-4 animate-fade-in user-message-optimistic">
                 <div class="bg-primary text-primary-foreground rounded-2xl rounded-tr-none px-4 py-3 max-w-[85%] shadow-md text-sm font-semibold">
                   ${question.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}
                 </div>
               </div>
            `;
            
            // Insert right before the loading indicator
            loadingIndicator.insertAdjacentHTML('beforebegin', userMsgHtml);
            
            // Scroll to bottom
            chatMessages.scrollTo({top: chatMessages.scrollHeight, behavior: 'smooth'});
        }
    </script>
</body>
"""

content = content.replace("</body>", script)

with open("src/main/resources/templates/contract_details.html", "w", encoding="utf-8") as f:
    f.write(content)
