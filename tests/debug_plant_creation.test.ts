import { createClient } from '@supabase/supabase-js';

// Get environment variables directly from process.env
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cvvvybrkxypfsfcbmbcq.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2dnZ5YnJreHlwZnNmY2JtYmNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTk2ODIyNzcsImV4cCI6MjAzNTI1ODI3N30.2d7tksOCKPFHEsB49O9c52WznUWkrC1gksj1HITGbXY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test script to debug the plant creation flow
async function debugPlantCreation() {
  console.log('🔍 Debugging plant creation flow...');
  
  // First, let's see the latest plants in the database
  console.log('\n📊 Current plants in database:');
  const { data: plants, error } = await supabase
    .from('plants')
    .select('id, name, species, description, fun_facts, created_at')
    .order('created_at', { ascending: false })
    .limit(10);
    
  if (error) {
    console.error('❌ Error fetching plants:', error);
    return;
  }
  
  if (!plants || plants.length === 0) {
    console.log('No plants found in database');
    return;
  }
  
  plants.forEach((plant, index) => {
    console.log(`${index + 1}. ${plant.name} (${plant.species})`);
    console.log(`   Description: ${plant.description || 'NULL'}`);
    console.log(`   Fun Facts: ${plant.fun_facts ? `[${plant.fun_facts.length} facts]` : 'NULL'}`);
    console.log(`   Created: ${plant.created_at}`);
    console.log('');
  });
  
  // Summary statistics
  const plantsWithDescription = plants.filter(p => p.description && p.description !== 'No se pudo generar una descripción.');
  const plantsWithFallbackDescription = plants.filter(p => p.description === 'No se pudo generar una descripción.');
  const plantsWithNullDescription = plants.filter(p => !p.description);
  
  console.log('\n📈 Summary:');
  console.log(`Plants with valid descriptions: ${plantsWithDescription.length}`);
  console.log(`Plants with fallback description: ${plantsWithFallbackDescription.length}`);
  console.log(`Plants with null description: ${plantsWithNullDescription.length}`);
  
  if (plantsWithDescription.length > 0) {
    console.log('\n✅ Good news! Some plants have valid descriptions:');
    plantsWithDescription.slice(0, 2).forEach(plant => {
      console.log(`- ${plant.name}: ${plant.description?.substring(0, 100)}...`);
    });
  }
  
  console.log('\n✅ Debug completed');
}

// Run the debug function
debugPlantCreation().catch(console.error); 