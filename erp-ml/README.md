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

## License

MIT
