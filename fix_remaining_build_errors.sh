#!/bin/bash

echo "🔧 Fixing remaining build errors..."

# Fix unused parameters by adding underscore prefix
files_with_unused_params=(
  "src/components/UpdateHealthDiagnosisButton.tsx:8:plant:_plant"
  "src/hooks/useChat.ts:3:plantId:_plantId"
  "src/hooks/useChat.ts:6:content:_content"
  "src/hooks/useGardenChat.ts:6:message:_message"
  "src/hooks/usePlantImageMutations.ts:7:{ plantId, imageBase64 }:_"
  "src/hooks/usePlantInfoCompletion.ts:11:user:_user"
  "src/hooks/usePlantInfoCompletion.ts:12:selectedPlant:_selectedPlant"
  "src/hooks/usePlantMutations.ts:14:imageDataUrl:_imageDataUrl"
  "src/services/gardenCacheService.ts:4:data:_data"
  "src/services/gardenChatService.ts:19:sessionId:_sessionId"
  "src/services/gardenChatService.ts:19:userId:_userId"
  "src/services/gardenChatService.ts:90:userId:_userId"
  "src/services/gardenChatService.ts:286:userId:_userId"
  "src/services/healthDiagnosisService.ts:23:userId:_userId"
  "src/services/imageService.ts:66:imageDataUrl:_imageDataUrl"
  "src/services/imageService.ts:67:bucket:_bucket"
  "src/services/imageService.ts:68:path:_path"
  "src/services/performanceService.ts:6:name:_name"
  "src/services/performanceService.ts:10:name:_name"
)

for item in "${files_with_unused_params[@]}"; do
  IFS=':' read -r file line_num old_param new_param <<< "$item"
  if [ -f "$file" ]; then
    echo "Fixing unused parameter in $file"
    sed -i "${line_num}s/${old_param}/${new_param}/g" "$file" 2>/dev/null || true
  fi
done

# Remove unused imports
echo "Removing unused import in gardenCacheService.ts"
sed -i '1d' src/services/gardenCacheService.ts 2>/dev/null || true

# Fix undefined properties by adding safe navigation
echo "Fixing undefined property access..."

# Fix PlantProgressChart.tsx
if [ -f "src/components/PlantProgressChart.tsx" ]; then
  sed -i 's/plant\.images/plant\.images || []/g' src/components/PlantProgressChart.tsx
fi

# Fix PlantStatsCard.tsx
if [ -f "src/components/PlantStatsCard.tsx" ]; then
  sed -i 's/plant\.images\.length/plant\.images?.length || 0/g' src/components/PlantStatsCard.tsx
fi

# Fix storageService.ts
if [ -f "src/services/storageService.ts" ]; then
  sed -i 's/plant\.images\.map/plant\.images?.map || []/g' src/services/storageService.ts
  sed -i 's/plant\.notifications\.map/plant\.notifications?.map || []/g' src/services/storageService.ts
fi

# Fix healthDiagnosisService.ts property access
if [ -f "src/services/healthDiagnosisService.ts" ]; then
  sed -i 's/img\.healthAnalysis\.healthScore/img\.healthAnalysis?.healthScore/g' src/services/healthDiagnosisService.ts
  sed -i 's/img\.healthAnalysis\.overallHealth/img\.healthAnalysis?.overallHealth/g' src/services/healthDiagnosisService.ts
  sed -i 's/plant\.careProfile\.watering/plant\.careProfile?.watering/g' src/services/healthDiagnosisService.ts
  sed -i 's/plant\.careProfile\.sunlight/plant\.careProfile?.sunlight/g' src/services/healthDiagnosisService.ts
fi

# Fix GardenChat.tsx by simplifying the destructuring
if [ -f "src/pages/GardenChat.tsx" ]; then
  echo "Simplifying GardenChat.tsx destructuring..."
  cat > temp_gardenchat.txt << 'EOF'
  const {
    messages,
    isLoading,
    sendMessage,
    refreshData,
  } = useGardenChat();
EOF
  sed -i '/const {/,/} = useGardenChat();/c\
  const {\
    messages,\
    isLoading,\
    sendMessage,\
    refreshData,\
  } = useGardenChat();' src/pages/GardenChat.tsx
fi

echo "✅ Most critical build errors fixed"