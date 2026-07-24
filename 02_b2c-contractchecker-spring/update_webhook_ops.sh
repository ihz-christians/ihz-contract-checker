#!/bin/bash
echo "Committing Email Webhook Changes for OPS"
git add 02_b2c-contractchecker-spring/src/main/resources/db/migration/V8__Add_emailAlias_to_tenants.sql
git add 02_b2c-contractchecker-spring/src/main/java/de/ihrezuhauseberatung/contractchecker/models/Tenant.java
git add 02_b2c-contractchecker-spring/src/main/java/de/ihrezuhauseberatung/contractchecker/repositories/TenantRepository.java
git add 02_b2c-contractchecker-spring/src/main/java/de/ihrezuhauseberatung/contractchecker/services/EmailWebhookService.java
git add 02_b2c-contractchecker-spring/src/main/java/de/ihrezuhauseberatung/contractchecker/controllers/EmailWebhookController.java
git add 02_b2c-contractchecker-spring/src/test/java/de/ihrezuhauseberatung/contractchecker/repositories/TenantRepositoryTest.java
git add 02_b2c-contractchecker-spring/src/test/java/de/ihrezuhauseberatung/contractchecker/services/EmailWebhookServiceTest.java
git add 02_b2c-contractchecker-spring/src/test/java/de/ihrezuhauseberatung/contractchecker/controllers/EmailWebhookControllerTest.java
git add 02_b2c-contractchecker-spring/src/test/java/de/ihrezuhauseberatung/contractchecker/integration/EmailWebhookE2ETest.java
git commit -m "feat(webhook): Add secured Email-Webhook endpoint with RLS tenant context & user whitelist monitoring"
