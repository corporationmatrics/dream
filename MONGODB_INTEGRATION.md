# MongoDB Integration Guide
# Complete setup for IoT & Telemetry Data

## Overview

MongoDB will be used for:
- **IoT Device Telemetry** - Sensor readings, location tracking
- **Real-time Monitoring** - Performance metrics, logs
- **Time-series Data** - Device behavior patterns
- **Separate from PostgreSQL** - Transactions stay in PostgreSQL, telemetry in MongoDB

---

## Architecture

```
IoT Devices / Sensors
        ↓
   MQTT Broker (optional)
        ↓
┌──────────────────────────────────────┐
│      erp-api (NestJS)                │
│  ├─ IoT Controller                   │
│  ├─ Telemetry Service               │
│  └─ Device Management                │
└──────────────────────────────────────┘
        ↓
    MongoDB
    ├─ devices collection
    ├─ telemetry collection
    ├─ device_logs collection
    └─ performance_metrics collection
```

---

## Step 1: Deploy MongoDB

### Update docker-compose.yml

MongoDB is already configured in `docker-compose-all-phases.yml`. No additional configuration needed.

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    container_name: mongodb
    restart: unless-stopped
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: admin123
      MONGO_INITDB_DATABASE: erp
    volumes:
      - mongodb_data:/data/db
      - ./init-mongo.js:/docker-entrypoint-initdb.d/init-mongo.js
    networks:
      - erp-network
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/erp -u admin -p admin123
      interval: 10s
      timeout: 5s
      retries: 5

  mongo-express:
    image: mongo-express:latest
    container_name: mongo-express
    restart: unless-stopped
    ports:
      - "8081:8081"
    environment:
      ME_CONFIG_MONGODB_ADMINUSERNAME: admin
      ME_CONFIG_MONGODB_ADMINPASSWORD: admin123
      ME_CONFIG_MONGODB_URL: mongodb://admin:admin123@mongodb:27017/
      ME_CONFIG_BASICAUTH_USERNAME: admin
      ME_CONFIG_BASICAUTH_PASSWORD: admin123
    depends_on:
      - mongodb
    networks:
      - erp-network

volumes:
  mongodb_data:
    driver: local
```

### MongoDB Initialization Script

Create `erp-infrastructure/init-mongo.js`:

```javascript
db = db.getSiblingDB('admin');
db.auth('admin', 'admin123');

db = db.getSiblingDB('erp');

// Create collections with validation
db.createCollection('devices', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['deviceId', 'deviceType', 'status'],
      properties: {
        _id: { bsonType: 'objectId' },
        deviceId: { bsonType: 'string' },
        deviceType: { enum: ['sensor', 'tracker', 'gateway'] },
        name: { bsonType: 'string' },
        location: { bsonType: 'object' },
        status: { enum: ['active', 'inactive', 'maintenance'] },
        lastSeen: { bsonType: 'date' },
        config: { bsonType: 'object' },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' },
      },
    },
  },
});

db.createCollection('telemetry', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['deviceId', 'timestamp', 'data'],
      properties: {
        _id: { bsonType: 'objectId' },
        deviceId: { bsonType: 'string' },
        timestamp: { bsonType: 'date' },
        data: { bsonType: 'object' },
        value: { bsonType: 'double' },
        unit: { bsonType: 'string' },
        quality: { bsonType: 'int' },
      },
    },
  },
});

db.createCollection('device_logs', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['deviceId', 'timestamp', 'message'],
      properties: {
        _id: { bsonType: 'objectId' },
        deviceId: { bsonType: 'string' },
        timestamp: { bsonType: 'date' },
        level: { enum: ['info', 'warning', 'error'] },
        message: { bsonType: 'string' },
        data: { bsonType: 'object' },
      },
    },
  },
});

// Create indexes for performance
db.devices.createIndex({ deviceId: 1 }, { unique: true });
db.devices.createIndex({ status: 1 });
db.devices.createIndex({ lastSeen: -1 });

db.telemetry.createIndex({ deviceId: 1, timestamp: -1 });
db.telemetry.createIndex({ timestamp: -1 });
db.telemetry.createIndex({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

db.device_logs.createIndex({ deviceId: 1, timestamp: -1 });
db.device_logs.createIndex({ level: 1 });
db.device_logs.createIndex({ timestamp: -1 }, { expireAfterSeconds: 2592000 }); // 30 days

// Create user for application
db.createUser({
  user: 'erp_app',
  pwd: 'erp_app_password',
  roles: [{ role: 'readWrite', db: 'erp' }],
});

print('✓ MongoDB initialized with collections and indexes');
```

### Start MongoDB

```powershell
cd erp-infrastructure
docker-compose up -d mongodb mongo-express

# Verify
docker-compose logs -f mongodb

# Open Mongo Express UI: http://localhost:8081
```

---

## Step 2: NestJS Integration

### 2.1 Install Dependencies

```bash
cd erp-api
npm install --save \
  @nestjs/mongoose \
  mongoose \
  @types/mongoose
```

### 2.2 Create MongoDB Configuration

File: `src/config/mongodb.config.ts`

```typescript
import { MongooseModuleOptions } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';

export class MongoDBConfig {
  static getMongooseConfig(configService: ConfigService): MongooseModuleOptions {
    const mongoUri = configService.get<string>('MONGODB_URI');
    const mongoDb = configService.get<string>('MONGODB_DB');

    return {
      uri: mongoUri,
      dbName: mongoDb,
      retryAttempts: 5,
      retryDelay: 1000,
      autoIndex: true,
      useNewUrlParser: true,
      useUnifiedTopology: true,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    };
  }
}
```

### 2.3 Create IoT Module Structure

```
src/iot/
├── schemas/
│   ├── device.schema.ts
│   ├── telemetry.schema.ts
│   └── device-log.schema.ts
├── dtos/
│   ├── create-device.dto.ts
│   ├── create-telemetry.dto.ts
│   └── device-query.dto.ts
├── controllers/
│   ├── devices.controller.ts
│   └── telemetry.controller.ts
├── services/
│   ├── devices.service.ts
│   ├── telemetry.service.ts
│   └── device-log.service.ts
└── iot.module.ts
```

### 2.4 Create Mongoose Schemas

File: `src/iot/schemas/device.schema.ts`

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DeviceDocument = Device & Document;

@Schema({ timestamps: true })
export class Device {
  @Prop({ required: true, unique: true })
  deviceId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ enum: ['sensor', 'tracker', 'gateway'], default: 'sensor' })
  deviceType: string;

  @Prop({ enum: ['active', 'inactive', 'maintenance'], default: 'inactive' })
  status: string;

  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0],
    },
  })
  location: {
    type: 'Point';
    coordinates: [number, number];
  };

  @Prop()
  lastSeen: Date;

  @Prop({ type: Object })
  config: Record<string, any>;

  @Prop()
  firmwareVersion: string;

  @Prop()
  serialNumber: string;

  @Prop()
  macAddress: string;

  @Prop({ index: true })
  userId: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const DeviceSchema = SchemaFactory.createForClass(Device);

// Create geospatial index for location queries
DeviceSchema.index({ location: '2dsphere' });
DeviceSchema.index({ deviceId: 1 }, { unique: true });
DeviceSchema.index({ userId: 1, status: 1 });
DeviceSchema.index({ lastSeen: -1 });
```

File: `src/iot/schemas/telemetry.schema.ts`

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TelemetryDocument = Telemetry & Document;

@Schema()
export class Telemetry {
  @Prop({ required: true, index: true })
  deviceId: string;

  @Prop({ required: true, index: true, default: () => new Date() })
  timestamp: Date;

  @Prop({ required: true, type: Object })
  data: Record<string, any>;

  @Prop()
  value: number;

  @Prop()
  unit: string;

  @Prop({ default: 100 })
  quality: number; // 0-100, signal quality

  @Prop()
  latitude: number;

  @Prop()
  longitude: number;

  @Prop()
  temperature: number;

  @Prop()
  humidity: number;

  @Prop()
  pressure: number;

  @Prop({ type: Object })
  metadata: Record<string, any>;
}

export const TelemetrySchema = SchemaFactory.createForClass(Telemetry);

// Indexes for common queries
TelemetrySchema.index({ deviceId: 1, timestamp: -1 });
TelemetrySchema.index({ timestamp: -1 });
// TTL index: automatically delete records older than 90 days
TelemetrySchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });
```

File: `src/iot/schemas/device-log.schema.ts`

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DeviceLogDocument = DeviceLog & Document;

@Schema()
export class DeviceLog {
  @Prop({ required: true, index: true })
  deviceId: string;

  @Prop({ required: true, index: true, default: () => new Date() })
  timestamp: Date;

  @Prop({ enum: ['info', 'warning', 'error'], default: 'info' })
  level: string;

  @Prop({ required: true })
  message: string;

  @Prop({ type: Object })
  data: Record<string, any>;

  @Prop()
  stackTrace: string;

  @Prop()
  action: string;
}

export const DeviceLogSchema = SchemaFactory.createForClass(DeviceLog);

// Indexes
DeviceLogSchema.index({ deviceId: 1, timestamp: -1 });
DeviceLogSchema.index({ level: 1, timestamp: -1 });
// TTL index: delete logs older than 30 days
DeviceLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 });
```

### 2.5 Create DTOs

File: `src/iot/dtos/create-device.dto.ts`

```typescript
import { IsString, IsEnum, IsOptional, IsObject } from 'class-validator';

export class CreateDeviceDto {
  @IsString()
  deviceId: string;

  @IsString()
  name: string;

  @IsEnum(['sensor', 'tracker', 'gateway'])
  deviceType: string;

  @IsOptional()
  @IsString()
  serialNumber: string;

  @IsOptional()
  @IsString()
  macAddress: string;

  @IsOptional()
  @IsObject()
  config: Record<string, any>;

  @IsOptional()
  @IsString()
  firmwareVersion: string;
}
```

File: `src/iot/dtos/create-telemetry.dto.ts`

```typescript
import { IsString, IsNumber, IsOptional, IsObject, IsDate } from 'class-validator';

export class CreateTelemetryDto {
  @IsString()
  deviceId: string;

  @IsOptional()
  @IsDate()
  timestamp: Date;

  @IsObject()
  data: Record<string, any>;

  @IsOptional()
  @IsNumber()
  value: number;

  @IsOptional()
  @IsString()
  unit: string;

  @IsOptional()
  @IsNumber()
  quality: number;

  @IsOptional()
  @IsNumber()
  latitude: number;

  @IsOptional()
  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsNumber()
  temperature: number;

  @IsOptional()
  @IsNumber()
  humidity: number;
}
```

### 2.6 Create Services

File: `src/iot/services/devices.service.ts`

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Device, DeviceDocument } from '../schemas/device.schema';
import { CreateDeviceDto } from '../dtos/create-device.dto';

@Injectable()
export class DevicesService {
  constructor(
    @InjectModel(Device.name) private deviceModel: Model<DeviceDocument>,
  ) {}

  async create(createDeviceDto: CreateDeviceDto): Promise<Device> {
    const device = new this.deviceModel(createDeviceDto);
    device.lastSeen = new Date();
    return device.save();
  }

  async findAll(userId: string): Promise<Device[]> {
    return this.deviceModel.find({ userId }).exec();
  }

  async findByDeviceId(deviceId: string): Promise<Device> {
    const device = await this.deviceModel.findOne({ deviceId }).exec();
    if (!device) {
      throw new NotFoundException(`Device ${deviceId} not found`);
    }
    return device;
  }

  async updateStatus(deviceId: string, status: string): Promise<Device> {
    return this.deviceModel.findOneAndUpdate(
      { deviceId },
      { status, lastSeen: new Date() },
      { new: true },
    ).exec();
  }

  async updateLocation(
    deviceId: string,
    latitude: number,
    longitude: number,
  ): Promise<Device> {
    return this.deviceModel.findOneAndUpdate(
      { deviceId },
      {
        location: { type: 'Point', coordinates: [longitude, latitude] },
        lastSeen: new Date(),
      },
      { new: true },
    ).exec();
  }

  async findNearby(latitude: number, longitude: number, maxDistance = 5000): Promise<Device[]> {
    return this.deviceModel.find({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [longitude, latitude] },
          $maxDistance: maxDistance,
        },
      },
    }).exec();
  }

  async delete(deviceId: string): Promise<void> {
    const result = await this.deviceModel.deleteOne({ deviceId }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Device ${deviceId} not found`);
    }
  }
}
```

File: `src/iot/services/telemetry.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Telemetry, TelemetryDocument } from '../schemas/telemetry.schema';
import { CreateTelemetryDto } from '../dtos/create-telemetry.dto';

@Injectable()
export class TelemetryService {
  constructor(
    @InjectModel(Telemetry.name) private telemetryModel: Model<TelemetryDocument>,
  ) {}

  async create(createTelemetryDto: CreateTelemetryDto): Promise<Telemetry> {
    const telemetry = new this.telemetryModel({
      ...createTelemetryDto,
      timestamp: createTelemetryDto.timestamp || new Date(),
    });
    return telemetry.save();
  }

  async createBatch(telemetries: CreateTelemetryDto[]): Promise<Telemetry[]> {
    const docs = telemetries.map(t => ({
      ...t,
      timestamp: t.timestamp || new Date(),
    }));
    return this.telemetryModel.insertMany(docs);
  }

  async getLatestByDevice(deviceId: string, limit = 100): Promise<Telemetry[]> {
    return this.telemetryModel
      .find({ deviceId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec();
  }

  async getByDeviceAndTimeRange(
    deviceId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<Telemetry[]> {
    return this.telemetryModel
      .find({
        deviceId,
        timestamp: { $gte: startTime, $lte: endTime },
      })
      .sort({ timestamp: -1 })
      .exec();
  }

  async getLatestByDeviceId(deviceId: string): Promise<Telemetry | null> {
    return this.telemetryModel
      .findOne({ deviceId })
      .sort({ timestamp: -1 })
      .exec();
  }

  async getAggregateByTimeInterval(
    deviceId: string,
    metric: string,
    intervalMs: number,
  ) {
    return this.telemetryModel.aggregate([
      { $match: { deviceId } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d %H:%M:%S',
              date: '$timestamp',
            },
          },
          avg: { $avg: `$${metric}` },
          min: { $min: `$${metric}` },
          max: { $max: `$${metric}` },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
    ]);
  }
}
```

### 2.7 Create Controllers

File: `src/iot/controllers/devices.controller.ts`

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { DevicesService } from '../services/devices.service';
import { CreateDeviceDto } from '../dtos/create-device.dto';

@Controller('iot/devices')
@UseGuards(JwtGuard)
export class DevicesController {
  constructor(private devicesService: DevicesService) {}

  @Post()
  create(@Body() createDeviceDto: CreateDeviceDto, @Req() req: any) {
    return this.devicesService.create({
      ...createDeviceDto,
      userId: req.user.id,
    });
  }

  @Get()
  findAll(@Req() req: any) {
    return this.devicesService.findAll(req.user.id);
  }

  @Get(':deviceId')
  findOne(@Param('deviceId') deviceId: string) {
    return this.devicesService.findByDeviceId(deviceId);
  }

  @Put(':deviceId/status')
  updateStatus(
    @Param('deviceId') deviceId: string,
    @Body() body: { status: string },
  ) {
    return this.devicesService.updateStatus(deviceId, body.status);
  }

  @Put(':deviceId/location')
  updateLocation(
    @Param('deviceId') deviceId: string,
    @Body() body: { latitude: number; longitude: number },
  ) {
    return this.devicesService.updateLocation(
      deviceId,
      body.latitude,
      body.longitude,
    );
  }

  @Get('nearby')
  findNearby(@Body() body: { latitude: number; longitude: number; maxDistance?: number }) {
    return this.devicesService.findNearby(
      body.latitude,
      body.longitude,
      body.maxDistance,
    );
  }

  @Delete(':deviceId')
  remove(@Param('deviceId') deviceId: string) {
    return this.devicesService.delete(deviceId);
  }
}
```

File: `src/iot/controllers/telemetry.controller.ts`

```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { TelemetryService } from '../services/telemetry.service';
import { CreateTelemetryDto } from '../dtos/create-telemetry.dto';

@Controller('iot/telemetry')
@UseGuards(JwtGuard)
export class TelemetryController {
  constructor(private telemetryService: TelemetryService) {}

  @Post()
  create(@Body() createTelemetryDto: CreateTelemetryDto) {
    return this.telemetryService.create(createTelemetryDto);
  }

  @Post('batch')
  createBatch(@Body() telemetries: CreateTelemetryDto[]) {
    return this.telemetryService.createBatch(telemetries);
  }

  @Get(':deviceId')
  getLatest(@Param('deviceId') deviceId: string, @Query('limit') limit = 100) {
    return this.telemetryService.getLatestByDevice(deviceId, +limit);
  }

  @Get(':deviceId/latest')
  getLatestSingle(@Param('deviceId') deviceId: string) {
    return this.telemetryService.getLatestByDeviceId(deviceId);
  }

  @Get(':deviceId/range')
  getByTimeRange(
    @Param('deviceId') deviceId: string,
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    return this.telemetryService.getByDeviceAndTimeRange(
      deviceId,
      new Date(start),
      new Date(end),
    );
  }

  @Get(':deviceId/aggregate')
  getAggregate(
    @Param('deviceId') deviceId: string,
    @Query('metric') metric: string,
    @Query('interval') interval = 3600000,
  ) {
    return this.telemetryService.getAggregateByTimeInterval(
      deviceId,
      metric,
      +interval,
    );
  }
}
```

### 2.8 Create IoT Module

File: `src/iot/iot.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Device, DeviceSchema } from './schemas/device.schema';
import { Telemetry, TelemetrySchema } from './schemas/telemetry.schema';
import { DeviceLog, DeviceLogSchema } from './schemas/device-log.schema';
import { DevicesService } from './services/devices.service';
import { TelemetryService } from './services/telemetry.service';
import { DevicesController } from './controllers/devices.controller';
import { TelemetryController } from './controllers/telemetry.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Device.name, schema: DeviceSchema },
      { name: Telemetry.name, schema: TelemetrySchema },
      { name: DeviceLog.name, schema: DeviceLogSchema },
    ]),
  ],
  providers: [DevicesService, TelemetryService],
  controllers: [DevicesController, TelemetryController],
  exports: [DevicesService, TelemetryService],
})
export class IotModule {}
```

### 2.9 Update App Module

File: `src/app.module.ts` - add MongoDB configuration:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongoDBConfig } from './config/mongodb.config';
import { AuthModule } from './auth/auth.module';
import { IotModule } from './iot/iot.module';
// ... other imports ...

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      useFactory: (configService: ConfigService) =>
        MongoDBConfig.getMongooseConfig(configService),
      inject: [ConfigService],
    }),
    TypeOrmModule.forRoot({
      // ... existing PostgreSQL config ...
    }),
    AuthModule,
    IotModule,
    // ... other modules ...
  ],
})
export class AppModule {}
```

### 2.10 Environment Variables

Add to `.env.local`:

```bash
# MongoDB
MONGODB_URI=mongodb://erp_app:erp_app_password@localhost:27017/erp?authSource=erp
MONGODB_DB=erp
MONGODB_HOST=localhost
MONGODB_PORT=27017
MONGODB_USERNAME=erp_app
MONGODB_PASSWORD=erp_app_password
```

---

## Step 3: Testing

### Test 1: Register a Device

```bash
curl -X POST http://localhost:3002/iot/devices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "deviceId": "sensor-001",
    "name": "Temperature Sensor - Warehouse A",
    "deviceType": "sensor",
    "serialNumber": "SN123456",
    "macAddress": "00:11:22:33:44:55",
    "firmwareVersion": "v1.2.3",
    "config": {
      "updateInterval": 30000,
      "units": "celsius"
    }
  }'
```

### Test 2: Send Telemetry Data

```bash
curl -X POST http://localhost:3002/iot/telemetry \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "deviceId": "sensor-001",
    "data": {
      "sensorReading": "temperature"
    },
    "value": 23.5,
    "unit": "celsius",
    "quality": 95,
    "latitude": 40.7128,
    "longitude": -74.0060,
    "temperature": 23.5,
    "humidity": 65
  }'
```

### Test 3: Query Telemetry

```bash
curl -X GET "http://localhost:3002/iot/telemetry/sensor-001?limit=50" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Test 4: Query by Time Range

```bash
curl -X GET "http://localhost:3002/iot/telemetry/sensor-001/range?start=2024-01-01T00:00:00Z&end=2024-01-02T00:00:00Z" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

---

## MongoDB Commands (mongosh)

```javascript
// Connect
mongosh "mongodb://admin:admin123@localhost:27017/erp"

// View collections
show collections

// View devices
db.devices.find().pretty()

// Find device by ID
db.devices.findOne({ deviceId: 'sensor-001' })

// Get latest telemetry for device
db.telemetry.find({ deviceId: 'sensor-001' }).sort({ timestamp: -1 }).limit(5).pretty()

// Count telemetry records
db.telemetry.countDocuments({ deviceId: 'sensor-001' })

// Delete old telemetry (test)
db.telemetry.deleteMany({ timestamp: { $lt: new Date('2024-01-01') } })

// Get telemetry statistics
db.telemetry.aggregate([
  { $match: { deviceId: 'sensor-001' } },
  {
    $group: {
      _id: null,
      avgValue: { $avg: '$value' },
      maxValue: { $max: '$value' },
      minValue: { $min: '$value' },
      count: { $sum: 1 }
    }
  }
])

// Create index manually
db.telemetry.createIndex({ deviceId: 1, timestamp: -1 })
db.telemetry.getIndexes()
```

---

## Performance Tips

1. **Use MongoDB Atlas** for production (managed, auto-scaling)
2. **Enable sharding** for large data volumes
3. **Set up proper indexes** (done in init script)
4. **Use bulk inserts** for batch telemetry
5. **Archive old data** to separate cluster
6. **Monitor memory usage** regularly

---

## Next Steps

1. ✅ Deploy MongoDB
2. ✅ Create collections & schemas
3. ✅ Integrate with NestJS
4. Test with sample data
5. Set up backup/restore
6. Configure monitoring & alerts
7. Implement time-series optimization

