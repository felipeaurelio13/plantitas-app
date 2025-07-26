const puppeteer = require('puppeteer');

async function quickTest() {
  console.log('🔍 Verificación rápida post-fix...');
  
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Simular mobile
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1');
  
  let supabaseError = false;
  let hasContent = false;
  
  page.on('console', msg => {
    const text = msg.text();
    console.log(`[${msg.type().toUpperCase()}] ${text}`);
    if (text.includes('Missing Supabase')) {
      supabaseError = true;
    }
  });

  try {
    await page.goto('https://felipeaurelio13.github.io/plantitas-app/', { 
      waitUntil: 'domcontentloaded',
      timeout: 15000 
    });
    
    // Esperar un poco
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const bodyText = await page.evaluate(() => document.body.innerText);
    hasContent = bodyText && bodyText.trim().length > 50 && !bodyText.includes('Cargando Plantitas');
    
    console.log('\n📊 RESULTADO:');
    console.log(`❌ Error Supabase: ${supabaseError ? 'SÍ' : 'NO'}`);
    console.log(`✅ Tiene contenido: ${hasContent ? 'SÍ' : 'NO'}`);
    console.log(`📄 Contenido (primeros 100 chars): ${bodyText?.substring(0, 100) || 'VACÍO'}`);
    
    if (!supabaseError && hasContent) {
      console.log('\n🎉 ¡ÉXITO! La app parece estar funcionando');
    } else {
      console.log('\n🚨 Aún hay problemas');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

quickTest().catch(console.error);