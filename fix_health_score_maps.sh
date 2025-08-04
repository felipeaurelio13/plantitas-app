#!/bin/bash

# Fix healthScoreMap in all files to include 'critical' state
files=(
  "src/components/PlantDetail/PlantEvolutionTracker.tsx"
  "src/components/PlantProgressChart.tsx"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Fixing healthScoreMap in $file"
    # Add critical: 20 to healthScoreMap objects
    sed -i 's/poor: 40$/poor: 40,\n        critical: 20/' "$file" 2>/dev/null || true
    sed -i 's/poor: 30$/poor: 30,\n        critical: 20/' "$file" 2>/dev/null || true
  fi
done

echo "✅ Health score maps fixed"