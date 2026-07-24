import re

file_path = 'src/main/resources/templates/contract_details.html'
with open(file_path, 'r') as f:
    content = f.read()

# Replace any existing occurrences of `costs.current` and `costs.regular` with `costs.firstMonthPrice` and `costs.regularPrice`
content = content.replace("analysis.overview.costs.current", "analysis.overview.costs.firstMonthPrice")
content = content.replace("analysis.overview.costs.regular", "analysis.overview.costs.regularPrice")

with open(file_path, 'w') as f:
    f.write(content)
