import re

file_path = 'src/main/java/de/ihrezuhauseberatung/contractchecker/services/AiWebhookService.java'
with open(file_path, 'r') as f:
    content = f.read()

replacement = """            String status = (String) payload.get("status");

            if ("ERROR".equalsIgnoreCase(status) || "FAILED".equalsIgnoreCase(status)) {
                task.setStatus("error"); // UI expects "error" (lowercase is safer or just match it)
                
                String errMsg = (String) payload.get("errorMessage");
                if (errMsg == null) errMsg = (String) payload.get("error_message");
                
                task.setErrorMessage(errMsg);
                taskRepository.save(task);
                log.warn("Task {} finished with error/failed: {}", taskId, task.getErrorMessage());
                return;
            }

            if ("IN_PROGRESS".equalsIgnoreCase(status) || "PROCESSING".equalsIgnoreCase(status)) {
                task.setStatus("pending");
                Integer progress = null;
                if (payload.get("progress") instanceof Number) {
                    progress = ((Number) payload.get("progress")).intValue();
                } else if (payload.get("progress") instanceof String) {
                    try {
                        progress = Integer.parseInt((String) payload.get("progress"));
                    } catch (NumberFormatException ignored) {}
                }
                if (progress != null) {
                    task.setProgress(progress);
                }
                taskRepository.save(task);
                log.info("Task {} progress updated to {}%", taskId, progress);
                return;
            }

            // SUCCESS-Verarbeitung"""

pattern = r'            String status = \(String\) payload\.get\("status"\);\n\n            if \("ERROR"\.equalsIgnoreCase\(status\) \|\| "FAILED"\.equalsIgnoreCase\(status\)\) \{.*?// SUCCESS-Verarbeitung'

content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open(file_path, 'w') as f:
    f.write(content)
