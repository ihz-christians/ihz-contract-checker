import re

with open("src/main/resources/templates/contract_details.html", "r", encoding="utf-8") as f:
    content = f.read()

# I will add a script tag at the bottom that provides a global function:
# `function appendUserMessageAndScroll(question) { ... }`
# This function will insert the user message right before `#chat-loading`, make the loading indicator visible, and scroll down.
