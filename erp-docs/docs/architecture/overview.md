---
sidebar_position: 2
---

# Architecture Overview

## System Components

### API Layer
- **erp-api** (NestJS): Main API gateway for all services
- **erp-accounting** (Spring Boot): Financial and accounting services

### Frontend Layer
- **erp-web** (Next.js): Web application for desktop/tablet
- **erp-mobile** (React Native): Native mobile app

### Data Layer
- **PostgreSQL**: Primary database
- **KeyDB**: In-memory cache
- **Meilisearch**: Full-text search
- **MinIO**: Object storage

### Infrastructure
- **Kubernetes**: Container orchestration
- **Docker**: Containerization
- **GitLab CI/CD**: Continuous integration/deployment

## Architecture Diagram

```
┌─────────────────────────────────────────┐
│         Client Applications              │
│  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │ Web App  │  │ Mobile   │  │ Admin  │ │
│  │(Next.js) │  │(RN/Expo) │  │(Mobile)│ │
│  └──────────┘  └──────────┘  └────────┘ │
└─────────────────────────────────────────┘
              │
         ┌────▼─────┐
         │   CDN    │
         └────┬─────┘
              │
┌─────────────────────────────────────────┐
│     API Gateway / Load Balancer          │
│         (Apache APISIX)                  │
└─────────────────────────────────────────┘
              │
    ┌─────────┴──────────┐
    │                    │
┌───▼────┐         ┌────▼───┐
│ erp-api │        │erp-acct│
│(NestJS) │        │(Spring)│
└───┬────┘         └────┬───┘
    │                    │
    └─────────┬──────────┘
              │
┌─────────────────────────────────────────┐
│         Data Layer                       │
│  ┌────────────┐  ┌────────────────┐     │
│  │PostgreSQL  │  │ KeyDB  Cache   │     │
│  │ Database   │  │ Meilisearch    │     │
│  │ MinIO S3   │  │ Storage        │     │
│  └────────────┘  └────────────────┘     │
└─────────────────────────────────────────┘
```

## Data Flow

1. Client requests come through the API Gateway
2. Requests are routed to appropriate microservices
3. Services interact with databases and caches
4. Response is formatted and returned to client

## Security Architecture

- JWT-based authentication
- Keycloak for identity management
- HTTPS/TLS encryption
- API rate limiting
- CORS protection

## Scalability

- Horizontal scaling with Kubernetes
- Stateless microservices
- Database connection pooling
- Distributed caching
- CDN for static assets
