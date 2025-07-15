import { describe, it, expect, beforeAll } from 'vitest';
import { plantService } from '../src/services/plantService';
import { supabase } from '../src/lib/supabase';

// Las credenciales se tomarán de las variables de entorno
const testEmail = import.meta.env.VITE_TEST_USER_EMAIL;
const testPassword = import.meta.env.VITE_TEST_USER_PASSWORD;

describe('Plant Service Test: Fetching user plants', () => {
  let userId: string | undefined;

  // Intentar iniciar sesión antes de que se ejecuten las pruebas
  beforeAll(async () => {
    if (!testEmail || !testPassword) {
      console.warn('⚠️  Prueba omitida: Las variables de entorno VITE_TEST_USER_EMAIL y VITE_TEST_USER_PASSWORD no están configuradas.');
      console.warn('   Para ejecutar esta prueba, crea un archivo .env en la raíz del proyecto con estas variables.');
      return;
    }

    // Iniciar sesión para obtener una sesión de usuario válida
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (error) {
      console.error('❌ Error al iniciar sesión para la prueba:', error.message);
      return;
    }

    if (data.user) {
      userId = data.user.id;
      console.log(`✅ Sesión iniciada como ${data.user.email} para la prueba.`);
    }
  });

  it('should fetch plants for an authenticated user from Supabase', async () => {
    // Si no se pudo obtener el userId (por falta de credenciales o error de login), se omite la prueba.
    if (!userId) {
      expect.fail('No se pudo obtener el ID de usuario para la prueba. Revisa las credenciales o la conexión.');
      return;
    }

    console.log(`▶️  Intentando obtener plantas para el usuario: ${userId}`);

    let plants;
    let error;

    try {
      plants = await plantService.getUserPlants(userId);
    } catch (e) {
      error = e;
    }

    // Mostramos los resultados en la consola
    console.log('--- Resultados de la consulta ---');
    if (error) {
      console.error('❌ Error al obtener las plantas:', error);
    } else if (plants) {
      console.log(`✅ Consulta exitosa. Se encontraron ${plants.length} plantas.`);
      if (plants.length > 0) {
        console.log('🪴 Plantas recibidas:');
        console.log(JSON.stringify(plants.map(p => ({ id: p.id, name: p.name, species: p.species })), null, 2));
      }
    }
    console.log('-----------------------------');

    // Limpieza: cerrar sesión
    await supabase.auth.signOut();
    console.log('🔌 Sesión de prueba cerrada.');

    // Verificación final del test
    expect(error).toBeUndefined();
    expect(plants).toBeDefined();
    expect(Array.isArray(plants)).toBe(true);
  }, 30000); // Timeout de 30 segundos
}); 