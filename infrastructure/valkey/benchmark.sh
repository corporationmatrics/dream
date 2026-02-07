#!/bin/bash

# Valkey 8.0 Benchmarking Script
# Tests concurrent auction bids (target: 1K+ concurrent clients)
# Usage: ./benchmark-valkey.sh

set -e

VALKEY_HOST=${VALKEY_HOST:-localhost}
VALKEY_PORT=${VALKEY_PORT:-6379}
BENCHMARK_CLIENTS=${BENCHMARK_CLIENTS:-1000}
BENCHMARK_REQUESTS=${BENCHMARK_REQUESTS:-100000}
BENCHMARK_DATA_SIZE=${BENCHMARK_DATA_SIZE:-256}

echo "🚀 Valkey 8.0 Auction Benchmark"
echo "=================================="
echo "Host: $VALKEY_HOST:$VALKEY_PORT"
echo "Clients: $BENCHMARK_CLIENTS"
echo "Requests: $BENCHMARK_REQUESTS"
echo "Data Size: $BENCHMARK_DATA_SIZE bytes"
echo ""

# Test 1: Basic SET/GET Performance
echo "📊 Test 1: SET/GET Operations"
echo "------------------------------"
redis-benchmark -h $VALKEY_HOST -p $VALKEY_PORT \
  -c $BENCHMARK_CLIENTS \
  -n $BENCHMARK_REQUESTS \
  -d $BENCHMARK_DATA_SIZE \
  -t set,get \
  -q

# Test 2: List Operations (for auction queue)
echo ""
echo "📊 Test 2: LIST Operations (Auction Queue)"
echo "-------------------------------------------"
redis-benchmark -h $VALKEY_HOST -p $VALKEY_PORT \
  -c 500 \
  -n $BENCHMARK_REQUESTS \
  -t lpush,rpop \
  -q

# Test 3: Sorted Set Operations (for real-time bidding)
echo ""
echo "📊 Test 3: SORTED SET Operations (Real-time Bids)"
echo "--------------------------------------------------"
redis-benchmark -h $VALKEY_HOST -p $VALKEY_PORT \
  -c 500 \
  -n $((BENCHMARK_REQUESTS / 2)) \
  -t zadd,zrange \
  -q

# Test 4: Pub/Sub Performance (for auction notifications)
echo ""
echo "📊 Test 4: PUB/SUB Performance (Auction Updates)"
echo "-----------------------------------------------"

# Create PUB/SUB subscribers in background
(
  for i in {1..100}; do
    redis-cli -h $VALKEY_HOST -p $VALKEY_PORT SUBSCRIBE "auction:*" > /dev/null 2>&1 &
  done
  sleep 5
)

# Publish messages from multiple clients
redis-benchmark -h $VALKEY_HOST -p $VALKEY_PORT \
  -c 100 \
  -n 10000 \
  -t publish \
  -q

# Kill subscriber background jobs
pkill -f "SUBSCRIBE" || true

# Test 5: Key Expiration (for session management)
echo ""
echo "📊 Test 5: Key Expiration (Session TTL)"
echo "--------------------------------------"
redis-benchmark -h $VALKEY_HOST -p $VALKEY_PORT \
  -c 500 \
  -n $((BENCHMARK_REQUESTS / 2)) \
  -t setex \
  -q

# Test 6: Atomic Operations (for auction bids)
echo ""
echo "📊 Test 6: INCR Operations (Atomic Bid Counter)"
echo "---------------------------------------------"
redis-benchmark -h $VALKEY_HOST -p $VALKEY_PORT \
  -c $BENCHMARK_CLIENTS \
  -n $BENCHMARK_REQUESTS \
  -t incr \
  -q

# Test 7: Pipeline Performance (optimized batch operations)
echo ""
echo "📊 Test 7: Pipeline Performance"
echo "-------------------------------"
(echo -ne "PING\r\nPING\r\nPING\r\nPING\r\nPING\r\n"; sleep 1) | \
  redis-benchmark -h $VALKEY_HOST -p $VALKEY_PORT -p $VALKEY_PORT \
  -c 100 \
  -n 10000 \
  -q || true

echo ""
echo "✅ Benchmark Complete!"
echo ""
echo "📈 Performance Expectations:"
echo "  - SET/GET: 100,000+ OPS/sec"
echo "  - LIST ops: 80,000+ OPS/sec"
echo "  - ZADD: 60,000+ OPS/sec (sorted auction bids)"
echo "  - INCR: 200,000+ OPS/sec (atomic counters)"
echo "  - Publish: 50,000+ msg/sec (auction updates)"
echo ""
echo "🎯 Target: 1,000+ concurrent clients × 100,000 requests = 1.2M+ QPS"
