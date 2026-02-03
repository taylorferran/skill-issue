#!/usr/bin/env bash

set -e

if [ -n "$GOOGLE_SERVICES_JSON" ]; then
  echo "📦 Creating google-services.json from secret..."
  echo "$GOOGLE_SERVICES_JSON" | base64 --decode > google-services.json
  echo "✅ google-services.json created successfully"
  
  # Verify file was created and is valid JSON
  if [ -f google-services.json ]; then
    echo "✓ File exists"
    # Optional: verify it's valid JSON
    if command -v jq &> /dev/null; then
      if jq empty google-services.json 2>/dev/null; then
        echo "✓ Valid JSON"
      else
        echo "⚠️  Warning: File may not be valid JSON"
      fi
    fi
  else
    echo "✗ Failed to create file"
    exit 1
  fi
else
  echo "⚠️  GOOGLE_SERVICES_JSON secret not found"
  exit 1
fi
