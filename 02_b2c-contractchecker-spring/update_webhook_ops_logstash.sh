#!/bin/bash
echo "Committing Email Webhook Logstash Structured Logging"
git add 02_b2c-contractchecker-spring/pom.xml
git add 02_b2c-contractchecker-spring/src/main/java/de/ihrezuhauseberatung/contractchecker/services/EmailWebhookService.java
git add 02_b2c-contractchecker-spring/src/main/java/de/ihrezuhauseberatung/contractchecker/controllers/EmailWebhookController.java
git add 02_b2c-contractchecker-spring/src/main/resources/logback-spring.xml
git commit -m "ops(webhook): Migrate Webhook controller and service to structured JSON logging via LogstashEncoder"
