#!/bin/bash

# Smoke Tests Runner - CRM ↔ Portal
# اختبارات الدخان - بين CRM والبوابة

echo "🚀 Starting Smoke Tests for CRM ↔ Portal APIs"
echo "================================================"
echo ""

# Check if backend is running
echo "📡 Checking backend connectivity..."
if ! curl -s http://localhost:8000/api/v1/health > /dev/null 2>&1; then
    echo "⚠️  Backend not responding at http://localhost:8000"
    echo "Make sure FastAPI backend is running:"
    echo "  cd travel-agency-custom/fastapi-backend"
    echo "  python -m uvicorn app.main:app --reload --port 8000"
    exit 1
fi

echo "✅ Backend is responding"
echo ""

# Check if frontend is running
echo "📱 Checking frontend connectivity..."
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "⚠️  Frontend not responding at http://localhost:3000"
    echo "Make sure Next.js is running:"
    echo "  npm run dev"
    exit 1
fi

echo "✅ Frontend is responding"
echo ""

# Run the Node.js smoke tests
echo "🧪 Running smoke test suite..."
echo ""

npx ts-node tests/smoke/smoke-test-crm-portal.ts

exit_code=$?

echo ""
echo "================================================"
if [ $exit_code -eq 0 ]; then
    echo "✅ Smoke tests completed successfully!"
else
    echo "❌ Some smoke tests failed. Check output above."
fi

exit $exit_code
