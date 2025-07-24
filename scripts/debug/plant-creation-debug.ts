#!/usr/bin/env node

/**
 * 🔍 Script de Debugging para Creación de Plantas
 * 
 * Este script ayuda a diagnosticar problemas en el flujo de creación de plantas
 * y verificar el estado de la base de datos.
 */

import { createClient } from '@supabase/supabase-js';

// Configuración desde variables de entorno
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Variables de entorno SUPABASE_URL y SUPABASE_ANON_KEY son requeridas');
  console.log('💡 Ejemplo de uso:');
  console.log('   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co');
  console.log('   VITE_SUPABASE_ANON_KEY=tu-anon-key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface PlantData {
  id: string;
  name: string;
  species: string;
  description: string | null;
  fun_facts: string[] | null;
  created_at: string;
  plant_environment: string | null;
  light_requirements: string | null;
  health_score: number;
}

async function debugPlantCreation() {
  console.log('🔍 Iniciando debugging de creación de plantas...\n');
  
  try {
    // 1. Verificar conexión a Supabase
    console.log('📡 Verificando conexión a Supabase...');
    const { data: testData, error: testError } = await supabase
      .from('plants')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Error de conexión:', testError.message);
      return;
    }
    console.log('✅ Conexión exitosa a Supabase\n');

    // 2. Obtener plantas más recientes
    console.log('📊 Analizando plantas en la base de datos...');
    const { data: plants, error } = await supabase
      .from('plants')
      .select('id, name, species, description, fun_facts, created_at, plant_environment, light_requirements, health_score')
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (error) {
      console.error('❌ Error al obtener plantas:', error.message);
      return;
    }
    
    if (!plants || plants.length === 0) {
      console.log('ℹ️ No se encontraron plantas en la base de datos');
      return;
    }
    
    console.log(`✅ Se encontraron ${plants.length} plantas\n`);
    
    // 3. Mostrar plantas con detalles
    console.log('🌱 Plantas encontradas:');
    plants.forEach((plant: PlantData, index: number) => {
      console.log(`\n${index + 1}. ${plant.name} (${plant.species})`);
      console.log(`   ID: ${plant.id}`);
      console.log(`   Descripción: ${plant.description || 'NULL'}`);
      console.log(`   Fun Facts: ${plant.fun_facts ? `[${plant.fun_facts.length} facts]` : 'NULL'}`);
      console.log(`   Ambiente: ${plant.plant_environment || 'NULL'}`);
      console.log(`   Luz: ${plant.light_requirements || 'NULL'}`);
      console.log(`   Salud: ${plant.health_score}/100`);
      console.log(`   Creada: ${new Date(plant.created_at).toLocaleString()}`);
    });
    
    // 4. Análisis estadístico
    console.log('\n📈 Análisis estadístico:');
    
    const plantsWithDescription = plants.filter(p => p.description && p.description !== 'No se pudo generar una descripción.');
    const plantsWithFallbackDescription = plants.filter(p => p.description === 'No se pudo generar una descripción.');
    const plantsWithNullDescription = plants.filter(p => !p.description);
    const plantsWithEnvironment = plants.filter(p => p.plant_environment);
    const plantsWithLight = plants.filter(p => p.light_requirements);
    
    console.log(`   Plantas con descripción válida: ${plantsWithDescription.length}`);
    console.log(`   Plantas con descripción fallback: ${plantsWithFallbackDescription.length}`);
    console.log(`   Plantas sin descripción: ${plantsWithNullDescription.length}`);
    console.log(`   Plantas con ambiente: ${plantsWithEnvironment.length}`);
    console.log(`   Plantas con luz: ${plantsWithLight.length}`);
    
    // 5. Recomendaciones
    console.log('\n💡 Recomendaciones:');
    
    if (plantsWithDescription.length > 0) {
      console.log('✅ Algunas plantas tienen descripciones válidas');
      plantsWithDescription.slice(0, 2).forEach(plant => {
        console.log(`   - ${plant.name}: ${plant.description?.substring(0, 100)}...`);
      });
    }
    
    if (plantsWithNullDescription.length > 0) {
      console.log('⚠️ Algunas plantas no tienen descripción');
      console.log('   Considera usar la función "Completar con IA"');
    }
    
    if (plantsWithEnvironment.length === 0) {
      console.log('⚠️ Ninguna planta tiene ambiente especificado');
      console.log('   Considera usar la función "Completar con IA"');
    }
    
    if (plantsWithLight.length === 0) {
      console.log('⚠️ Ninguna planta tiene luz especificada');
      console.log('   Considera usar la función "Completar con IA"');
    }
    
    // 6. Verificar Edge Functions
    console.log('\n🔧 Verificando Edge Functions...');
    try {
      const { data: functionTest, error: functionError } = await supabase.functions.invoke('analyze-image', {
        body: { imageDataUrl: 'data:image/jpeg;base64,test' }
      });
      
      if (functionError) {
        console.log('⚠️ Edge Functions pueden tener problemas:', functionError.message);
      } else {
        console.log('✅ Edge Functions están disponibles');
      }
    } catch (e) {
      console.log('⚠️ No se pudo verificar Edge Functions');
    }
    
    console.log('\n✅ Debugging completado');
    
  } catch (error) {
    console.error('💥 Error inesperado:', error);
  }
}

// Ejecutar el script
if (require.main === module) {
  debugPlantCreation().catch(console.error);
}

export { debugPlantCreation }; 