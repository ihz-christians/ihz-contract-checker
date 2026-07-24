import re

file_path = '../03_b2c-ai-gateway/src/services/llm.py'
with open(file_path, 'r') as f:
    content = f.read()

# Replace kwargs that pass temperature directly to chat.completions.create
# with genai.GenerationConfig instead, or via instructor-specific kwargs depending on how instructor passes them down

new_agent1 = """
            agent1_response: Agent1Facts = self.instructor_client.chat.completions.create(
                response_model=Agent1Facts,
                messages=[
                    {"role": "system", "content": agent1_prompt},
                    {"role": "user", "content": f"<TEXT>\\n{text}\\n</TEXT>"}
                ],
                # Instructor reicht dies korrekt an die zugrundeliegende Google GenerativeAI API weiter
                generation_config=genai_old.types.GenerationConfig(temperature=0.0),
                max_retries=3
            )
"""
old_agent1 = r'            agent1_response: Agent1Facts = self\.instructor_client\.chat\.completions\.create\(\n                response_model=Agent1Facts,\n                messages=\[\n                    \{"role": "system", "content": agent1_prompt\},\n                    \{"role": "user", "content": f"<TEXT>\\n\{text\}\\n</TEXT>"\}\n                \],\n                temperature=0\.0,\n                max_retries=3\n            \)'

content = re.sub(old_agent1, new_agent1.strip('\n'), content, flags=re.DOTALL)

new_agent2 = """
            agent2_response: Agent2Advice = self.instructor_client.chat.completions.create(
                response_model=Agent2Advice,
                messages=[
                    {"role": "system", "content": agent2_prompt},
                    {"role": "user", "content": agent2_context}
                ],
                generation_config=genai_old.types.GenerationConfig(temperature=0.2),
                max_retries=3
            )
"""
old_agent2 = r'            agent2_response: Agent2Advice = self\.instructor_client\.chat\.completions\.create\(\n                response_model=Agent2Advice,\n                messages=\[\n                    \{"role": "system", "content": agent2_prompt\},\n                    \{"role": "user", "content": agent2_context\}\n                \],\n                temperature=0\.2,\n                max_retries=3\n            \)'

content = re.sub(old_agent2, new_agent2.strip('\n'), content, flags=re.DOTALL)

with open(file_path, 'w') as f:
    f.write(content)
