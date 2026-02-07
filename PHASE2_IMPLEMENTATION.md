# Phase 2 Implementation Guide
# B2B Capabilities & Real-time Optimization (Month 1-2)

---

## Phase 2 Overview

After Phase 1 completes (foundational tools), Phase 2 focuses on:

1. **JSON EDI Protocol** - Automated B2B document exchange
2. **FastAPI Microservice** - AI pricing + voice-to-text  
3. **OR-Tools** - Vehicle routing optimization
4. **LSTM Models** - Demand forecasting

**Timeline:** Month 1-2 after Phase 1 completion
**Effort:** 60-80 hours total

---

## Component 1: JSON EDI Protocol

### What is EDI?

EDI (Electronic Data Interchange) = Automated B2B document exchange.

**Current state:** Manual POs, invoices, shipments
**Goal:** Zero manual entry - fully automated

### EDI Messages Supported

| Code | Type | Use Case |
|------|------|----------|
| 850 | Purchase Order | Customer → Supplier: order request |
| 855 | PO Acknowledgment | Supplier → Customer: confirm receipt |
| 856 | Advance Shipping Notice | Supplier → Customer: shipment details |
| 810 | Invoice | Supplier → Customer: billing |
| 820 | Payment Order | Customer → Supplier: payment instructions |

### Architecture

```
Partner A (Customer)
    ↓ (sends PO)
    JSON EDI {
      messageType: "850",
      partnerGLN: "1234567890123",
      items: [...],
      totalAmount: 5000
    }
    ↓
erp-api (NestJS)
    ├─ Validate signature
    ├─ Parse JSON
    ├─ Create order in DB
    └─ Send ACK (855)
    
Repeat for 810 (invoice), 856 (shipment), 820 (payment)
```

### Implementation Files

#### File 1: `src/edi/schemas/edi.schema.ts`

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EDIDocumentType = EDIDocument & Document;

@Schema({ timestamps: true })
export class EDIDocument {
  @Prop({ required: true, enum: ['850', '855', '856', '810', '820'] })
  messageType: string;

  @Prop({ required: true })
  partnerGLN: string; // Global Location Number

  @Prop({ required: true })
  documentNumber: string;

  @Prop({ required: true })
  documentDate: Date;

  @Prop({ required: true })
  status: string; // pending, processed, rejected, archived

  @Prop({ type: Object })
  lines: Array<{
    lineNumber: number;
    sku: string;
    description: string;
    quantity: number;
    unitPrice: number;
    totalLine: number;
  }>;

  @Prop()
  totalAmount: number;

  @Prop()
  taxAmount: number;

  @Prop()
  shippingAmount: number;

  @Prop()
  notes: string;

  @Prop()
  signature: string; // Digital signature (RSA-256)

  @Prop()
  rawJson: object;

  @Prop()
  processedAt: Date;

  @Prop()
  processedBy: string; // User ID

  @Prop()
  errorMessage: string;

  @Prop({ default: 0 })
  retryCount: number;

  @Prop({ default: false })
  archived: boolean;
}

export const EDIDocumentSchema = SchemaFactory.createForClass(EDIDocument);

// Indexes
EDIDocumentSchema.index({ messageType: 1, status: 1 });
EDIDocumentSchema.index({ partnerGLN: 1, documentDate: -1 });
EDIDocumentSchema.index({ documentNumber: 1, partnerGLN: 1 }, { unique: true });
```

#### File 2: `src/edi/services/edi.service.ts`

```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EDIDocument, EDIDocumentType } from '../schemas/edi.schema';
import * as crypto from 'crypto';

@Injectable()
export class EDIService {
  constructor(
    @InjectModel(EDIDocument.name)
    private ediModel: Model<EDIDocumentType>,
  ) {}

  /**
   * Validate and process incoming EDI document
   */
  async processIncomingEDI(jsonData: any, signature: string): Promise<any> {
    // Validate signature
    if (!this.validateSignature(JSON.stringify(jsonData), signature)) {
      throw new BadRequestException('Invalid EDI signature');
    }

    // Validate schema
    this.validateEDISchema(jsonData);

    // Store document
    const ediDoc = new this.ediModel({
      messageType: jsonData.messageType,
      partnerGLN: jsonData.partnerGLN,
      documentNumber: jsonData.documentNumber,
      documentDate: new Date(jsonData.documentDate),
      lines: jsonData.lines,
      totalAmount: jsonData.totalAmount,
      taxAmount: jsonData.taxAmount,
      notes: jsonData.notes,
      signature: signature,
      rawJson: jsonData,
      status: 'pending',
    });

    await ediDoc.save();

    // Process based on message type
    let result;
    switch (jsonData.messageType) {
      case '850': // Purchase Order
        result = await this.processPurchaseOrder(ediDoc);
        break;
      case '810': // Invoice
        result = await this.processInvoice(ediDoc);
        break;
      case '856': // Advance Shipping Notice
        result = await this.processShippingNotice(ediDoc);
        break;
      case '820': // Payment
        result = await this.processPayment(ediDoc);
        break;
      default:
        result = { success: false, error: 'Unknown message type' };
    }

    return result;
  }

  /**
   * Process PO (850)
   */
  private async processPurchaseOrder(ediDoc: EDIDocumentType): Promise<any> {
    try {
      // Create order in database
      // TODO: Integrate with orders service
      console.log('Processing PO:', ediDoc.documentNumber);

      // Update status
      ediDoc.status = 'processed';
      ediDoc.processedAt = new Date();
      await ediDoc.save();

      // Send ACK (855)
      const ack = await this.generateACK(ediDoc);

      return {
        success: true,
        orderId: 'ORD-' + ediDoc.documentNumber,
        ackMessage: ack,
      };
    } catch (error) {
      ediDoc.status = 'rejected';
      ediDoc.errorMessage = error.message;
      ediDoc.retryCount++;
      await ediDoc.save();
      throw error;
    }
  }

  /**
   * Process Invoice (810)
   */
  private async processInvoice(ediDoc: EDIDocumentType): Promise<any> {
    try {
      console.log('Processing Invoice:', ediDoc.documentNumber);

      // TODO: Create invoice in database
      ediDoc.status = 'processed';
      ediDoc.processedAt = new Date();
      await ediDoc.save();

      return {
        success: true,
        invoiceId: 'INV-' + ediDoc.documentNumber,
      };
    } catch (error) {
      ediDoc.status = 'rejected';
      ediDoc.errorMessage = error.message;
      ediDoc.retryCount++;
      await ediDoc.save();
      throw error;
    }
  }

  /**
   * Process Shipping Notice (856)
   */
  private async processShippingNotice(ediDoc: EDIDocumentType): Promise<any> {
    try {
      console.log('Processing Shipping Notice:', ediDoc.documentNumber);

      // TODO: Update shipment tracking
      ediDoc.status = 'processed';
      ediDoc.processedAt = new Date();
      await ediDoc.save();

      return {
        success: true,
        shipmentId: 'SHIP-' + ediDoc.documentNumber,
      };
    } catch (error) {
      ediDoc.status = 'rejected';
      ediDoc.errorMessage = error.message;
      ediDoc.retryCount++;
      await ediDoc.save();
      throw error;
    }
  }

  /**
   * Process Payment (820)
   */
  private async processPayment(ediDoc: EDIDocumentType): Promise<any> {
    try {
      console.log('Processing Payment:', ediDoc.documentNumber);

      // TODO: Record payment
      ediDoc.status = 'processed';
      ediDoc.processedAt = new Date();
      await ediDoc.save();

      return {
        success: true,
        paymentId: 'PAY-' + ediDoc.documentNumber,
      };
    } catch (error) {
      ediDoc.status = 'rejected';
      ediDoc.errorMessage = error.message;
      ediDoc.retryCount++;
      await ediDoc.save();
      throw error;
    }
  }

  /**
   * Generate EDI ACK (855) - Purchase Order Acknowledgment
   */
  private async generateACK(originalDoc: EDIDocumentType): Promise<any> {
    return {
      messageType: '855',
      partnerGLN: originalDoc.partnerGLN,
      originalDocumentNumber: originalDoc.documentNumber,
      acknowledgmentDate: new Date(),
      status: 'accepted',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Validate EDI JSON schema
   */
  private validateEDISchema(data: any): void {
    const required = ['messageType', 'partnerGLN', 'documentNumber', 'documentDate'];
    for (const field of required) {
      if (!data[field]) {
        throw new BadRequestException(`Missing required field: ${field}`);
      }
    }

    if (!['850', '855', '856', '810', '820'].includes(data.messageType)) {
      throw new BadRequestException('Invalid message type');
    }
  }

  /**
   * Validate digital signature
   */
  private validateSignature(message: string, signature: string): boolean {
    // TODO: Implement RSA-256 signature verification
    // For now, accept all (implement with public key exchange)
    return true;
  }

  /**
   * Generate signed EDI document for sending
   */
  generateSignedEDI(data: any, privateKey: string): { json: any; signature: string } {
    const jsonString = JSON.stringify(data);
    const signature = crypto.createSign('sha256').update(jsonString).sign(privateKey, 'hex');

    return {
      json: data,
      signature,
    };
  }

  /**
   * Get EDI documents by status
   */
  async getByStatus(status: string, limit = 100) {
    return this.ediModel.find({ status }).limit(limit).sort({ createdAt: -1 });
  }

  /**
   * Get EDI documents by partner
   */
  async getByPartner(partnerGLN: string, limit = 50) {
    return this.ediModel.find({ partnerGLN }).limit(limit).sort({ documentDate: -1 });
  }

  /**
   * Retry failed EDI processing
   */
  async retryFailed() {
    const failed = await this.ediModel.find({
      status: 'rejected',
      retryCount: { $lt: 3 },
    });

    for (const doc of failed) {
      try {
        // Re-process
        await this.processIncomingEDI(doc.rawJson, doc.signature);
      } catch (error) {
        console.error(`Retry failed for ${doc.documentNumber}:`, error);
      }
    }
  }
}
```

#### File 3: `src/edi/controllers/edi.controller.ts`

```typescript
import { Controller, Post, Get, Body, BadRequestException, UseGuards, Query } from '@nestjs/common';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { EDIService } from '../services/edi.service';

@Controller('edi')
@UseGuards(JwtGuard)
export class EDIController {
  constructor(private ediService: EDIService) {}

  @Post('receive')
  async receiveEDI(
    @Body() body: { json: any; signature: string },
  ) {
    if (!body.json || !body.signature) {
      throw new BadRequestException('Missing json or signature');
    }

    return this.ediService.processIncomingEDI(body.json, body.signature);
  }

  @Post('send')
  async sendEDI(
    @Body() body: { partnerGLN: string; messageType: string; [key: string]: any },
  ) {
    // TODO: Send to partner's endpoint
    const signed = this.ediService.generateSignedEDI(body, process.env.PRIVATE_KEY);
    return {
      success: true,
      messageType: body.messageType,
      signature: signed.signature,
    };
  }

  @Get('status')
  async getByStatus(@Query('status') status: string) {
    return this.ediService.getByStatus(status);
  }

  @Get('partner/:partnerId')
  async getByPartner(@Query('partnerId') partnerId: string) {
    return this.ediService.getByPartner(partnerId);
  }

  @Post('retry-failed')
  async retryFailed() {
    await this.ediService.retryFailed();
    return { success: true };
  }
}
```

---

## Component 2: FastAPI Microservice

### Why FastAPI?

- **Python ecosystem:** ML libraries (scikit-learn, TensorFlow)
- **Async support:** High performance
- **Easy integration:** HTTP API to NestJS
- **ML-ready:** Perfect for pricing engine + voice processing

### Architecture

```
erp-api (NestJS)
    ↓ HTTP POST
erp-ml (FastAPI)
    ├─ /pricing/recommend
    │   ├─ Demand analysis
    │   ├─ Competitor pricing
    │   └─ Inventory levels
    │   ↓
    │   Returns: suggested_price
    │
    └─ /voice/transcribe
        ├─ Speech-to-text
        ├─ Intent recognition
        └─ Extract order details
        ↓
        Returns: items, quantities, customer
```

### Implementation: Pricing Engine

File: `erp-ml/src/pricing/pricing_engine.py`

```python
import logging
from typing import Dict, Any, List
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
import pandas as pd
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class PricingEngine:
    """
    AI-powered dynamic pricing engine
    """
    
    def __init__(self):
        self.model = LinearRegression()
        self.scaler = StandardScaler()
        self.is_trained = False
    
    def train(self, training_data: List[Dict[str, Any]]) -> bool:
        """
        Train pricing model from historical data
        
        Args:
            training_data: List of historical sales with prices, demand, inventory
            
        Returns:
            True if training successful
        """
        try:
            df = pd.DataFrame(training_data)
            
            # Features: demand, inventory_level, competitor_price, seasonality
            X = df[['demand', 'inventory_level', 'competitor_price', 'seasonality']].values
            y = df['optimal_price'].values
            
            # Normalize features
            X_scaled = self.scaler.fit_transform(X)
            
            # Train model
            self.model.fit(X_scaled, y)
            self.is_trained = True
            
            logger.info("Pricing model trained successfully")
            return True
        except Exception as e:
            logger.error(f"Training failed: {str(e)}")
            return False
    
    def recommend_price(self, product_id: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Recommend optimal price for product
        
        Args:
            product_id: Product identifier
            context: {
                current_price: float,
                cost: float,
                demand: float,  # 0-100
                inventory_level: int,
                competitor_price: float,
                seasonality: float  # 0-1
            }
            
        Returns:
            {
                recommended_price: float,
                confidence: float,
                rationale: str,
                price_range: { min: float, max: float }
            }
        """
        try:
            current_price = context.get('current_price', 0)
            cost = context.get('cost', 0)
            demand = context.get('demand', 50)
            inventory = context.get('inventory_level', 100)
            competitor_price = context.get('competitor_price', current_price)
            seasonality = context.get('seasonality', 0.5)
            
            # Prepare features
            features = np.array([[demand, inventory, competitor_price, seasonality]])
            features_scaled = self.scaler.transform(features)
            
            # Predict optimal price
            if not self.is_trained:
                recommended_price = self._heuristic_pricing(context)
            else:
                recommended_price = self.model.predict(features_scaled)[0]
            
            # Ensure minimum margin
            min_price = cost * 1.15  # 15% minimum margin
            recommended_price = max(recommended_price, min_price)
            
            # Calculate confidence
            confidence = self._calculate_confidence(context)
            
            # Generate rationale
            rationale = self._generate_rationale(context, recommended_price)
            
            # Define price range (±10%)
            price_range = {
                'min': recommended_price * 0.9,
                'max': recommended_price * 1.1,
            }
            
            return {
                'product_id': product_id,
                'recommended_price': round(recommended_price, 2),
                'confidence': round(confidence, 2),
                'rationale': rationale,
                'price_range': {
                    'min': round(price_range['min'], 2),
                    'max': round(price_range['max'], 2),
                },
                'current_price': current_price,
                'price_change_percent': round((recommended_price - current_price) / current_price * 100, 2) if current_price > 0 else 0,
            }
        except Exception as e:
            logger.error(f"Price recommendation failed: {str(e)}")
            return {
                'error': str(e),
                'recommended_price': context.get('current_price'),
                'confidence': 0,
            }
    
    def _heuristic_pricing(self, context: Dict[str, Any]) -> float:
        """
        Fallback pricing logic when model not trained
        """
        cost = context.get('cost', 0)
        demand = context.get('demand', 50)
        inventory = context.get('inventory_level', 100)
        competitor_price = context.get('competitor_price', cost * 2)
        
        # Base price: 2x cost
        base_price = cost * 2
        
        # Adjust for demand (high demand → higher price)
        demand_multiplier = 1 + (demand - 50) / 100 * 0.3  # ±15% based on demand
        
        # Adjust for inventory (high inventory → lower price)
        if inventory > 500:
            inventory_multiplier = 0.85
        elif inventory < 50:
            inventory_multiplier = 1.15
        else:
            inventory_multiplier = 1.0
        
        # Factor in competitor price
        competitive_factor = 0.1  # Weight competitor price at 10%
        
        recommended = (
            base_price * demand_multiplier * inventory_multiplier * 0.9 +
            competitor_price * competitive_factor
        )
        
        return recommended
    
    def _calculate_confidence(self, context: Dict[str, Any]) -> float:
        """
        Calculate confidence in recommendation (0-1)
        """
        # Factors: data completeness, time since last update, etc.
        confidence = 0.8  # Base confidence
        
        # Reduce if inventory is very low
        if context.get('inventory_level', 0) < 10:
            confidence -= 0.1
        
        # Reduce if demand is zero
        if context.get('demand', 0) == 0:
            confidence -= 0.15
        
        return max(0, min(1, confidence))
    
    def _generate_rationale(self, context: Dict[str, Any], recommended: float) -> str:
        """
        Generate human-readable explanation
        """
        current = context.get('current_price', recommended)
        demand = context.get('demand', 50)
        inventory = context.get('inventory_level', 100)
        cost = context.get('cost', 0)
        
        rationale = []
        
        if demand > 70:
            rationale.append("High demand detected - price increase opportunity")
        elif demand < 30:
            rationale.append("Low demand - consider price reduction to boost sales")
        
        if inventory > 400:
            rationale.append("High inventory levels - recommend discount")
        elif inventory < 50:
            rationale.append("Low stock - maintain premium pricing")
        
        if cost > 0:
            margin = (recommended - cost) / cost * 100
            rationale.append(f"Projected margin: {margin:.1f}%")
        
        if recommended > current:
            change = recommended - current
            rationale.append(f"Increase by ${change:.2f}")
        elif recommended < current:
            change = current - recommended
            rationale.append(f"Decrease by ${change:.2f}")
        else:
            rationale.append("Maintain current price")
        
        return " | ".join(rationale)
```

File: `erp-ml/src/api.py` (add pricing endpoint)

```python
from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional, Dict, Any
from pricing.pricing_engine import PricingEngine

app = FastAPI()
pricing_engine = PricingEngine()

class PricingRequest(BaseModel):
    product_id: str
    current_price: float
    cost: float
    demand: float
    inventory_level: int
    competitor_price: Optional[float] = None
    seasonality: Optional[float] = 0.5

class PricingResponse(BaseModel):
    product_id: str
    recommended_price: float
    confidence: float
    rationale: str
    price_range: Dict[str, float]

@app.post('/pricing/recommend', response_model=PricingResponse)
async def recommend_price(request: PricingRequest):
    """
    Get price recommendation for product
    """
    context = {
        'current_price': request.current_price,
        'cost': request.cost,
        'demand': request.demand,
        'inventory_level': request.inventory_level,
        'competitor_price': request.competitor_price or request.current_price,
        'seasonality': request.seasonality,
    }
    
    return pricing_engine.recommend_price(request.product_id, context)

@app.post('/pricing/train')
async def train_pricing_model(training_data: List[Dict[str, Any]]):
    """
    Train pricing model with historical data
    """
    success = pricing_engine.train(training_data)
    return {'success': success}
```

---

## Continue with Voice-to-Text & More...

*File continues with:*
- Voice transcription service
- Intent recognition for orders
- FastAPI integration with NestJS
- OR-Tools vehicle routing
- LSTM demand forecasting
- Testing strategies
- Deployment guide

[See full Phase 2 implementation in separate files]

---

## Timeline & Milestones

### Week 1-2: EDI Protocol
- [ ] Design EDI schema
- [ ] Implement message parsing
- [ ] Create partner integration API
- [ ] Test with sample documents

### Week 3-4: FastAPI Microservice
- [ ] Set up FastAPI project
- [ ] Create pricing engine
- [ ] Add voice service
- [ ] Integrate with NestJS

### Week 5-6: OR-Tools & Routing
- [ ] Design routing database
- [ ] Implement optimization
- [ ] Create delivery dashboard
- [ ] Test with real routes

### Week 7-8: LSTM Forecasting
- [ ] Collect historical data
- [ ] Train models
- [ ] Create visualization dashboard
- [ ] Performance testing

---

## Success Metrics

- EDI documents process 100% automatically
- Pricing recommendations 95%+ accuracy
- Voice ordering works for 50+ common phrases
- Route optimization saves 20%+ on delivery costs
- Demand forecast RMSE < 15%

