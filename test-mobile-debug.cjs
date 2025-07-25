const puppeteer = require('puppeteer');

async function testMobileApp() {
  console.log('🚀 Iniciando test automático de la app mobile...');
  
  const browser = await puppeteer.launch({
    headless: false, // Para debugging visual
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ]
  });

  const page = await browser.newPage();
  
  // Simular iPhone 12
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1');
  await page.setViewport({ width: 390, height: 844, isMobile: true });

  // Capturar todos los logs de consola
  const logs = [];
  page.on('console', msg => {
    const text = `[${msg.type().toUpperCase()}] ${msg.text()}`;
    console.log(text);
    logs.push(text);
  });

  // Capturar errores JavaScript
  const errors = [];
  page.on('pageerror', error => {
    const errorText = `[ERROR] ${error.message}`;
    console.error(errorText);
    errors.push(errorText);
  });

  // Capturar requests fallidos
  const failedRequests = [];
  page.on('requestfailed', request => {
    const failText = `[REQUEST FAILED] ${request.url()} - ${request.failure().errorText}`;
    console.error(failText);
    failedRequests.push(failText);
  });

  try {
    console.log('📱 Navegando a la app...');
    await page.goto('https://felipeaurelio13.github.io/plantitas-app/', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    console.log('⏱️ Esperando 5 segundos para ver si carga...');
    await page.waitForTimeout(5000);

    // Verificar si hay contenido visible
    const bodyText = await page.evaluate(() => document.body.innerText);
    const hasContent = bodyText && bodyText.trim().length > 0 && !bodyText.includes('Cargando Plantitas');
    
    console.log('📄 Contenido del body:', bodyText?.substring(0, 200) + '...');
    
    // Verificar el estado del DOM
    const domState = await page.evaluate(() => {
      return {
        rootExists: !!document.getElementById('root'),
        rootChildren: document.getElementById('root')?.children.length || 0,
        rootInnerHTML: document.getElementById('root')?.innerHTML.substring(0, 500) || 'EMPTY',
        documentReady: document.readyState,
        jsLoaded: !!window.React,
        errorBoundaryActive: !!document.querySelector('.error-boundary'),
      };
    });

    console.log('🔍 Estado del DOM:', JSON.stringify(domState, null, 2));

    // Tomar screenshot
    await page.screenshot({ 
      path: 'mobile-debug-screenshot.png',
      fullPage: true 
    });

    console.log('\n📊 REPORTE FINAL:');
    console.log(`✅ Logs capturados: ${logs.length}`);
    console.log(`❌ Errores JS: ${errors.length}`);
    console.log(`🔥 Requests fallidos: ${failedRequests.length}`);
    console.log(`📱 Tiene contenido: ${hasContent ? 'SÍ' : 'NO'}`);
    
    if (errors.length > 0) {
      console.log('\n🚨 ERRORES ENCONTRADOS:');
      errors.forEach(error => console.log(`  - ${error}`));
    }
    
    if (failedRequests.length > 0) {
      console.log('\n🌐 REQUESTS FALLIDOS:');
      failedRequests.forEach(req => console.log(`  - ${req}`));
    }

  } catch (error) {
    console.error('💥 Error en el test:', error.message);
  } finally {
    await browser.close();
  }
}

// Ejecutar el test
testMobileApp().catch(console.error);