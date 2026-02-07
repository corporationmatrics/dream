# Docker Desktop Daemon Failure - Recovery Guide

## Current Status
✗ Docker daemon crashed after port conflict resolution  
✗ Docker Desktop unable to maintain stable connection  
✗ System pipe connection failing: `npipe:////./pipe/dockerDesktopLinuxEngine`

---

## Quick Recovery Steps (Do These First)

### Option 1: Complete Docker Desktop Reset (Recommended)
```powershell
# Step 1: Stop all Docker processes
taskkill /F /IM "Docker Desktop.exe"
taskkill /F /IM "com.docker.service.exe"
taskkill /F /IM "com.docker.backend.exe"
taskkill /F /IM "vpnkit.exe"

# Step 2: Wait 10 seconds
Start-Sleep -Seconds 10

# Step 3: Delete Docker Desktop cache/state
Remove-Item -Path "$env:APPDATA\Docker" -Recurse -Force -ErrorAction SilentlyContinue

# Step 4: Restart Docker Desktop
& "C:\Program Files\Docker\Docker\Docker.exe"

# Step 5: Wait 60 seconds for initialization
Start-Sleep -Seconds 60

# Step 6: Verify Docker is working
docker ps
```

### Option 2: Restart Windows and Docker Desktop
```powershell
# If Option 1 doesn't work, restart your computer
Restart-Computer -Force
# Then start Docker Desktop from Start menu or:
# C:\Program Files\Docker\Docker\Docker.exe
```

---

## Monitoring Stack Configuration Change

**Port Conflict Resolution** ✓ COMPLETED

The docker-compose.yml has been modified to use **port 9091** instead of 9090:
```yaml
prometheus:
  ports:
    - "9091:9090"  # Changed from 9090:9090
```

This avoids the previous port conflict. Once Docker is back online, Prometheus will be available at:
- **http://localhost:9091** (instead of http://localhost:9090)

---

## After Docker is Recovered

Once Docker Desktop is responsive, deploy the monitoring stack:

```bash
cd d:\UPENDRA\e-HA Matrix\Dream\erp-infrastructure
docker-compose down -v --remove-orphans  # Clean slate
docker-compose up -d                      # Deploy all containers
```

Expected containers (10 total):
```
✓ postgres                 (5432)
✓ keydb                    (6379)
✓ minio                    (9000, 9001)
✓ meilisearch             (7700)
✓ prometheus              (9091) ← Changed from 9090
✓ grafana                 (3001)
✓ postgres-exporter       (9187)
✓ redis-exporter          (9121)
```

---

## Verification After Recovery

```bash
# Check all containers are running
docker ps

# Verify Prometheus on new port
curl http://localhost:9091

# Verify Grafana
curl http://localhost:3001

# Check logs if any service fails
docker logs erp-prometheus
docker logs erp-grafana
```

---

## Updated Quick Links

| Service | URL | Port |
|---------|-----|------|
| Prometheus | http://localhost:9091 | 9091 |
| Grafana | http://localhost:3001 | 3001 |
| API | http://localhost:3002 | 3002 |
| PostgreSQL | localhost:5432 | 5432 |
| Redis/KeyDB | localhost:6379 | 6379 |
| MinIO | http://localhost:9000 | 9000 |
| Meilisearch | http://localhost:7700 | 7700 |

---

## Detailed Recovery If Above Doesn't Work

### Complete Docker Reinstall
If Docker Desktop still won't start after the above steps:

```powershell
# 1. Uninstall Docker Desktop
# Go to Settings → Apps → Installed Apps → Docker Desktop → Uninstall

# 2. Remove Docker data folders
Remove-Item -Path "$env:APPDATA\Docker" -Recurse -Force
Remove-Item -Path "$env:ProgramData\Docker" -Recurse -Force

# 3. Download Docker Desktop latest version from https://www.docker.com/products/docker-desktop

# 4. Install Docker Desktop
# Run the installer and follow prompts

# 5. After installation, create erp-infrastructure/docker-compose.yml 
# with the updated prometheus port configuration
```

---

## Why This Happened

The port 9090 conflict occurred because:
1. Process ID 14844 (com.docker.backend) was holding port 9090
2. When we forcefully killed that process, Docker daemon crashed
3. Docker attempts to rebind the port but daemon is unstable
4. Solution: Use alternative port 9091 to avoid conflicts

---

## Prevention for Future

### Update docker-compose.yml to use Alternative Ports

If you ever encounter similar issues, use these alternative ports:

```yaml
# Option A: Use port 9091 for Prometheus
prometheus:
  ports:
    - "9091:9090"  # Prometheus on 9091

# Option B: Use port 9092 if 9091 is ever taken
prometheus:
  ports:
    - "9092:9090"  # Prometheus on 9092

# Option C: Use dynamic port (Docker assigns available port)
prometheus:
  ports:
    - "9090"  # Let Docker assign a free port
  # Then check: docker port erp-prometheus
```

---

## Check Current Port Status

```powershell
# See which ports are in use
netstat -ano | findstr "LISTENING"

# Check specific ports
netstat -ano | findstr :9090   # Should be empty now
netstat -ano | findstr :9091   # Used by docker-compose now
netstat -ano | findstr :3001   # Grafana
netstat -ano | findstr :3002   # NestJS API
```

---

## Docker Desktop Logs for Debugging

If Docker continues to fail, check these log files:

```powershell
# Docker Desktop logs
# Log file location: C:\Users\[USERNAME]\AppData\Local\Docker
Get-Content "$env:APPDATA\Local\Docker...\log-file.log" -Tail 100

# Windows Event Viewer
# Look for: Event Viewer → Windows Logs → System
# Filter by source "Docker" or "Docker Desktop"
```

---

## Contact Docker Support if Needed

If Docker Desktop doesn't recover after these steps, you may need to:

1. **Report to Docker**: https://github.com/docker/for-win/issues
2. **Check Docker Status**: https://www.docker.com/status
3. **WSL2 Update**: Ensure WSL2 is fully updated
   ```powershell
   wsl --update
   ```

---

## Current Project State

**Good News:** 
✓ All monitoring code is written and ready  
✓ All configuration files are created  
✓ All Grafana dashboards are defined  
✓ NestJS module is integrated  
✓ Zero TypeScript errors  
✓ Only waiting for Docker daemon to be healthy  

**When Docker is Back Online:**
Just run `docker-compose up -d` and monitoring will deploy immediately.

---

## Alternative: Local Development Without Docker

If Docker Desktop remains unstable, you can:

1. **Start services manually** (not ideal for production):
   ```bash
   # In separate terminals:
   psql -U postgres  # PostgreSQL
   redis-server      # Redis/KeyDB
   npm run start:dev # NestJS API (erp-api)
   npm run dev       # Next.js Web (erp-web)
   ```

2. **Use cloud-hosted alternatives**:
   - Prometheus: https://cloud.timescale.com (Timescale Cloud)
   - Grafana: https://grafana.com/cloud/grafana/ (Grafana Cloud)
   - PostgreSQL: AWS RDS, Azure Database
   - Redis: AWS ElastiCache, Azure Cache

3. **Use Docker via WSL2 CLI** (without Docker Desktop GUI):
   ```bash
   # This requires Docker already running in WSL2
   ```

---

## Estimated Recovery Time

| Recovery Method | Time |
|-----------------|------|
| Quick reset (Option 1) | 5 minutes |
| Restart Windows (Option 2) | 10 minutes |
| Complete Docker reinstall | 30 minutes |
| Manual service setup | N/A (not for production) |

**Recommendation:** Try Option 1 first. If it doesn't work, try Option 2. If still failing, do complete Docker reinstall.

---

## Next Steps

1. **Execute quick recovery steps** (first option above)
2. **Wait for Docker to stabilize** (60-120 seconds)
3. **Run docker ps** to verify
4. **Run docker-compose up -d** from erp-infrastructure
5. **Monitor dashboards** at http://localhost:3001 (Grafana) and http://localhost:9091 (Prometheus)

Status: **AWAITING DOCKER DAEMON RECOVERY**

Files ready: ✓ Code ✓ Config ✓ Dashboards ✓ Documentation

Once Docker is back, you'll be fully operational within 5 minutes.

---

**Last Updated**: February 6, 2026  
**Issue**: Docker daemon crash after port conflict  
**Resolution**: Port changed to 9091, awaiting Docker restart
