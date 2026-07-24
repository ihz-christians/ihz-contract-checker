import re

file_path = 'src/main/java/de/ihrezuhauseberatung/contractchecker/services/ContractSummaryGenerator.java'
with open(file_path, 'r') as f:
    content = f.read()

# Replace the division block to handle null safely
new_block = """        // TCO Calculation
        BigDecimal calculatedTco = tcoEngine.calculateTco(extractedData);
        if (calculatedTco == null) calculatedTco = BigDecimal.ZERO;
        overview.put("calculatedTco", calculatedTco);
        
        // Neu: Effective Monthly Cost
        BigDecimal effectiveMonthly = calculatedTco.divide(BigDecimal.valueOf(resolvedDuration > 0 ? resolvedDuration : 24), 2, RoundingMode.HALF_UP);
        overview.put("effectiveMonthly", effectiveMonthly);"""

old_block = r'        // TCO Calculation\n        BigDecimal calculatedTco = tcoEngine\.calculateTco\(extractedData\);\n        overview\.put\("calculatedTco", calculatedTco\);\n        \n        // Neu: Effective Monthly Cost\n        BigDecimal effectiveMonthly = calculatedTco\.divide\(BigDecimal\.valueOf\(resolvedDuration\), 2, RoundingMode\.HALF_UP\);\n        overview\.put\("effectiveMonthly", effectiveMonthly\);'

content = re.sub(old_block, new_block, content, flags=re.DOTALL)

with open(file_path, 'w') as f:
    f.write(content)
