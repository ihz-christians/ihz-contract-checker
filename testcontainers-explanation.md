# Testing Python APIs from Java

Testcontainers allows us to boot up the Python FastAPI server inside a temporary Docker container directly from our JUnit tests. 
This means during the Maven build phase, Java will spin up the Python app, send real HTTP requests to it, wait for the response, and then destroy the container.
