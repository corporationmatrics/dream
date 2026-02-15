# ERP Machine Learning Services

FastAPI service for machine learning models including:

- Fraud detection
- Demand forecasting
- Customer segmentation
- Price optimization

## Installation

```bash
poetry install
```

## Configuration

Copy `.env.example` to `.env` and update values.

## Running

```bash
python main.py
```

## API Endpoints

- `GET /` - Service info
- `GET /health` - Health check
- `POST /predict` - Make predictions

## Testing

```bash
pytest
```

## Docker Build

The erp-ml service uses Poetry v2 with PEP 517 backend. **Before the first Docker build**, clear the builder cache to avoid Poetry v1 cached layers:

```powershell
# Clear Docker builder cache (required once)
docker builder prune -a

# Build image (first time, will be slower due to ML dependencies)
docker build -t erp-ml:latest .

# Subsequent builds (will use cache)
docker build -t erp-ml:latest .

# Run container
docker run -p 8000:8000 erp-ml:latest

# Test health endpoint
curl http://localhost:8000/health
```

**Note:** First build takes 5-10 minutes due to ML/OCR dependencies (numpy, scikit-learn, etc.). Subsequent builds use cache and are much faster.

## Docker Compose

Start as part of the full stack:

```powershell
docker-compose up -d erp-ml
docker-compose logs -f erp-ml
```

## License

MIT
