#!/bin/bash
echo "Committing Ops Metrics Logging"
git add 02_b2c-contractchecker-spring/src/main/java/de/ihrezuhauseberatung/contractchecker/services/LegalActionService.java
git add 02_b2c-contractchecker-spring/src/main/java/de/ihrezuhauseberatung/contractchecker/services/auth/PasswordResetService.java
git add 02_b2c-contractchecker-spring/src/main/java/de/ihrezuhauseberatung/contractchecker/auth/AuthenticationEventListener.java
git commit -m "ops(metrics): Add structured JSON tracking for logins, password resets and legal actions"
