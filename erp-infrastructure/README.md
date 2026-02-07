# Infrastructure & DevOps Configuration

Contains Docker Compose configurations, Kubernetes manifests, and deployment scripts for the ERP Platform.

## Directory Structure

- `docker-compose.yml` - Local development environment setup
- `k8s/` - Kubernetes manifests
  - `configmap.yaml` - Configuration maps
  - `deployment.yaml` - Application deployments
  - `namespace.yaml` - Namespace definitions
- `scripts/` - Deployment and maintenance scripts
- `monitoring/` - Prometheus and Grafana configurations

## Quick Start

### Local Development

```bash
docker-compose up -d
```

This will start:
- PostgreSQL (port 5432)
- KeyDB (port 6379)
- MinIO (ports 9000, 9001)
- Meilisearch (port 7700)

### Kubernetes Deployment

```bash
kubectl create namespace erp-platform
kubectl apply -f k8s/
```

## Environment Variables

See `.env.example` for required environment variables.

## Monitoring

- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000

## License

MIT
