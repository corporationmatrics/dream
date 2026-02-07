# Dream ERP Deployment Infrastructure

Complete CI/CD, testing, and deployment infrastructure for Dream ERP B2B integration platform.

## 📋 Overview

This infrastructure implements:
- **Automated Testing** (unit, integration, database, security)
- **Docker Image Building** (multi-platform: amd64, arm64)
- **Kubernetes Deployment** (staging and production)
- **Load Testing** (K6 performance validation)
- **Monitoring & Alerting** (Prometheus, Grafana, AlertManager)
- **Database Management** (PostgreSQL with automated backups)
- **Webhook Management** (delivery tracking, retry logic, dead letter queue)

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      GitHub Actions Workflows                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  On: Push to main/develop, PR creation, Manual trigger           │
│                                                                   │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │  test.yml    │───▶│  build.yml   │───▶│ deploy.yml   │       │
│  │  (Testing)   │    │ (Docker)     │    │(K3s Deploy)  │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
            │                    │                    │
            ▼                    ▼                    ▼
      ┌──────────┐          ┌──────────┐        ┌──────────┐
      │Unit Tests│          │Docker    │        │Staging   │
      │Integ     │          │Registry  │        │K3s       │
      │Database  │          │ghcr.io   │        │Prod K3s  │
      │Security  │          └──────────┘        └──────────┘
      └──────────┘
```

## 🔧 Components

### GitHub Actions Workflows

#### 1. Test Workflow (`.github/workflows/test.yml`)
Runs on every push and pull request to main/develop branches.

**Jobs:**
- **test-unit**: Unit tests with coverage upload to Codecov
- **test-integration**: E2E tests with database services
- **test-database**: Schema migration validation
- **test-security**: npm audit, Snyk scanning
- **test-summary**: Aggregates results, comments on PRs

**Services:**
- PostgreSQL 15 (health-checked)
- Valkey 8.0 (health-checked)
- MinIO (S3 mock)

**Environment:** PostgreSQL, Redis URLs, JWT secret

#### 2. Build Workflow (`.github/workflows/build.yml`)
Builds Docker images and pushes to GitHub Container Registry.

**Jobs:**
- **build-api**: Multi-platform API image (amd64, arm64)
- **build-accounting**: Spring Boot image (amd64, arm64)
- **security-scan**: Trivy container scanning

**Registry:** ghcr.io/dream-erp
**Tagging:** branch, semver, sha, latest

**Trigger:** After successful tests OR manual trigger

#### 3. Deploy Workflow (`.github/workflows/deploy.yml`)
Deploys to staging or production K3s clusters.

**Jobs:**
- **deploy-staging**: Deploys to staging on develop branch
- **deploy-production**: Deploys to production on main branch
- **post-deploy**: Smoke tests and verification

**Services Deployed:**
- PostgreSQL 15 (Helm)
- Valkey/Redis (Helm)
- API service (3 replicas)
- Accounting service (2 replicas)

**Validation:** Health checks, smoke tests, metrics verification

#### 4. Load Test Workflow (`.github/workflows/load-test.yml`)
Runs performance tests to validate system capacity.

**Scenarios:**
- PO submission (100 VUs default)
- Invoice generation
- Ledger posting
- Webhook delivery

**Metrics:**
- Response time (p95, p99)
- Error rate
- Throughput
- Concurrent users

**Schedule:** Daily at 2 AM UTC + manual trigger

### Kubernetes Deployments

#### API Service (`k8s/deployments/api-production.yaml`)
NestJS application

**Configuration:**
- 3 replicas (2 min, 10 max with HPA)
- 256Mi RAM request, 512Mi limit
- 250m CPU request, 500m limit
- RollingUpdate strategy
- Pod anti-affinity (spread across nodes)
- Liveness & readiness probes
- mountPath for /tmp

**Environment:**
- NODE_ENV=production
- DATABASE_URL (from secret)
- REDIS_URL
- JWT_SECRET (from secret)

#### Accounting Service (`k8s/deployments/accounting-production.yaml`)
Spring Boot application

**Configuration:**
- 2 replicas (1 min, 5 max with HPA)
- 512Mi RAM request, 1Gi limit
- 500m CPU request, 1000m limit
- JAVA_OPTS=-Xms256m -Xmx512m
- Health check: /actuator/health

#### Database Setup (`k8s/helm/postgres-values-staging.yaml`)
PostgreSQL 15 with Helm

**Features:**
- 10Gi PVC for staging
- Authentication enabled
- Metrics collection
- Local-path storage class

#### Cache Setup (`k8s/helm/valkey-values-staging.yaml`)
Valkey/Redis with Helm

**Features:**
- Standalone architecture
- 5Gi PVC
- In-memory size limit: 256MB
- LRU eviction policy
- Authentication enabled

### Monitoring & Observability

#### Prometheus Rules (`k8s/monitoring/prometheus-rules.yaml`)
Alert rules covering:

**API Metrics:**
- ServiceDown (CRITICAL)
- HighLatency (WARNING: p95 > 500ms)
- HighErrorRate (WARNING: > 1%)

**Database Metrics:**
- HighConnections (WARNING: > 80%)
- SlowQueries (WARNING: > 1/s)
- ReplicationLag (WARNING: > 30s)

**B2B Integration:**
- WebhookDeliveryFailure (WARNING: > 5%)
- DeadLetterQueueGrowing (CRITICAL: > 10 in 30m)
- POProcessingDelayed (WARNING: p95 > 1s)
- InvoiceGenerationFailure (WARNING: > 0.001/s)

**Notification Channels:**
- Slack (for warnings)
- PagerDuty (for critical)

### Helm Values

#### PostgreSQL Staging (`k8s/helm/postgres-values-staging.yaml`)
```yaml
- User: postgres
- Password: staging-db-password
- Database: dream_erp
- Storage: 10Gi (local-path)
- Resources: 256Mi RAM, 250m CPU
- Replicas: 1 (no HA for staging)
```

#### Valkey Staging (`k8s/helm/valkey-values-staging.yaml`)
```yaml
- Auth: enabled with staging password
- Architecture: standalone
- Storage: 5Gi (local-path)
- MaxMemory: 256MB
- Eviction: allkeys-lru
- Resources: 128Mi RAM, 100m CPU
```

## 📚 Documentation

### [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
Pre-deployment verification, deployment steps, validation, and rollback procedures.

**Sections:**
- Pre-deployment phase (code review, infrastructure setup)
- Deployment phase (database migration, K8s deployment)
- Validation phase (endpoint testing, smoke tests)
- Post-deployment monitoring
- Rollback procedures

### [RUNBOOK.md](./RUNBOOK.md)
Operational procedures for production support.

**Sections:**
- Common issues & fixes (10+ scenarios)
- Monitoring & alerts
- Backup & recovery procedures
- Scaling operations
- Database maintenance
- Performance tuning
- Emergency procedures

## 🚀 Quick Start

### Prerequisites
- GitHub repository with Actions enabled
- K3s cluster (staging: 1 node min, production: 3+ nodes)
- PostgreSQL 15 installed
- Valkey 8.0 (or Redis compatible)
- kubectl configured for both clusters
- Helm 3+
- Docker (for local builds)

### Setup Steps

1. **Configure Secrets** (GitHub Settings → Secrets)
   ```
   K3S_STAGING_KUBECONFIG   # Base64-encoded kubeconfig
   K3S_PRODUCTION_KUBECONFIG # Base64-encoded kubeconfig
   STAGING_DB_PASSWORD      # Database password
   PRODUCTION_DB_PASSWORD   # Database password
   GITHUB_TOKEN             # For registry access
   ```

2. **Configure Database** (PostgreSQL)
   ```bash
   # Create database
   createdb dream_erp
   
   # Run migrations
   npm run migrate
   ```

3. **Setup K3s Clusters**
   ```bash
   # Staging cluster
   k3s server --cluster-init --token=secret
   
   # Install metrics server
   kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
   ```

4. **Deploy Infrastructure**
   ```bash
   # Create namespace
   kubectl create namespace dream-erp
   
   # Create secrets
   kubectl create secret generic api-secrets \
     --from-literal=database-url=postgresql://... \
     -n dream-erp
   
   # Deploy
   kubectl apply -f k8s/deployments/
   ```

5. **Verify Deployment**
   ```bash
   # Check pods
   kubectl get pods -n dream-erp
   
   # Check logs
   kubectl logs -f deployment/api -n dream-erp
   
   # Test health
   curl https://api.dream-erp.local/health
   ```

## 📊 Monitoring Dashboard

Access production metrics:

- **Grafana**: https://grafana.dream-erp.local
- **Prometheus**: https://prometheus.dream-erp.local
- **AlertManager**: https://alertmanager.dream-erp.local

**Key Dashboards:**
- API Performance (request rate, latency, errors)
- Database Performance (queries, connections, size)
- B2B Integration (PO workflow, invoice generation, webhook delivery)
- Infrastructure (CPU, memory, disk, network)

## 🔍 Common Operations

### Trigger Deployment Manually
1. Go to Actions → Deploy workflow
2. Click "Run workflow"
3. Select environment (staging/production)
4. Click "Run"

### Scale API Service
```bash
kubectl scale deployment api --replicas=5 -n dream-erp
```

### View Logs
```bash
# API logs
kubectl logs -f deployment/api -n dream-erp

# Accounting logs
kubectl logs -f deployment/accounting -n dream-erp

# Previous pod logs
kubectl logs <pod-name> --previous -n dream-erp
```

### Access Database
```bash
kubectl port-forward svc/postgres 5432:5432 -n dream-erp
psql -h localhost -U postgres -d dream_erp
```

### Run Manual Migrations
```bash
kubectl run migrate \
  --image=ghcr.io/dream-erp/api:main \
  -n dream-erp \
  -- npm run migrate
```

## 🔐 Security Considerations

### Secrets Management
- Use GitHub Secrets for sensitive data
- Rotate credentials regularly
- Use separate secrets for staging/production
- Enable RBAC on K3s cluster

### Image Security
- Container images scanned with Trivy
- Only push signed images to registry
- Use image pull policies: `Always`
- Enable Pod Security Standards

### Network Security
- Restrict ingress to HTTPS only
- Use network policies (K3s has default-deny)
- Enable TLS for all internal communication
- Rotate TLS certificates quarterly

### Audit & Compliance
- All B2B operations logged to audit trail
- Database backups encrypted
- Access logs retained for 90 days
- Annual security review

## 🆘 Troubleshooting

### Tests Failing
1. Check test output in GitHub Actions
2. Review error logs: `kubectl logs -f test-pod`
3. Test locally: `npm run test:unit`
4. Contact: Test Lead (@test-lead)

### Deployment Failing
1. Check deployment logs: `kubectl describe pod <pod>`
2. Verify secrets exist: `kubectl get secrets -n dream-erp`
3. Check resource availability: `kubectl top nodes`
4. Contact: DevOps (@devops-oncall)

### Performance Issues
1. Check monitoring dashboard
2. Review slow query logs
3. Analyze application traces
4. Contact: Performance Engineer (@perf-eng)

### Webhook Failures
1. Check partner endpoint connectivity
2. Verify webhook signature
3. Review partner logs
4. Contact: B2B Lead (@b2b-lead)

## 📞 Support

**Incidents:**
- Slack: #dream-erp-incident
- Phone: +1-555-DEVOPS1
- On-call rotation: Schedule published in wiki

**Documentation:**
- Wiki: https://wiki.company.com/dream-erp
- Runbook: [RUNBOOK.md](./RUNBOOK.md)
- Deployment Guide: [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)

## 📝 Version History

| Date | Version | Changes |
|------|---------|---------|
| 2024-02-07 | v1.0 | Initial CI/CD pipeline, K8s deployment, monitoring |
| TBD | v1.1 | Helm charts, improved HPA, SBOM generation |
| TBD | v1.2 | GitOps (ArgoCD), Sealed Secrets, Policy enforcement |

## 🔄 Maintenance

### Weekly
- Review monitoring dashboards
- Check backup status
- Test disaster recovery procedure
- Review recent deployments

### Monthly
- Security audit
- Performance review
- Capacity planning
- Update dependencies

### Quarterly
- Certificate renewal
- Credential rotation
- Load testing
- Disaster recovery drill

---

**Current Status:** ✅ Production Ready
**Last Updated:** 2024-02-07
**Maintained By:** DevOps Team
