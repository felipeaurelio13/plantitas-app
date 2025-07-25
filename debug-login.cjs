const puppeteer = require('puppeteer');

async function testLogin() {
  console.log('🔍 Testing login functionality...');
  
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  const logs = [];
  const errors = [];
  
  page.on('console', msg => {
    const text = `[${msg.type().toUpperCase()}] ${msg.text()}`;
    console.log(text);
    logs.push(text);
  });

  page.on('pageerror', error => {
    const errorText = `[JS ERROR] ${error.message}`;
    console.error(errorText);
    errors.push(errorText);
  });

  try {
    console.log('📱 Navegando a auth page...');
    await page.goto('http://localhost:5173/plantitas-app/auth', { 
      waitUntil: 'networkidle0',
      timeout: 15000 
    });

    console.log('⌛ Esperando formulario de login...');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    console.log('📧 Ingresando credenciales...');
    await page.type('input[type="email"]', 'test@example.com');
    await page.type('input[type="password"]', 'password123');
    
    console.log('🚀 Intentando login...');
    await page.click('button[type="submit"]');
    
    // Esperar respuesta
    await page.waitForTimeout(3000);
    
    // Verificar si hay errores
    const authErrors = logs.filter(log => 
      log.includes('error') || 
      log.includes('Error') || 
      log.includes('Invalid') ||
      log.includes('Credenciales')
    );
    
    console.log('\n📊 RESULTADO:');
    console.log(`Errores de auth: ${authErrors.length}`);
    console.log(`Errores JS: ${errors.length}`);
    
    if (authErrors.length > 0) {
      console.log('\n🚨 ERRORES DE AUTH:');
      authErrors.forEach(err => console.log(`  ${err}`));
    }
    
    if (errors.length > 0) {
      console.log('\n🚨 ERRORES JS:');
      errors.forEach(err => console.log(`  ${err}`));
    }
    
    // Verificar URL actual
    const currentUrl = page.url();
    console.log(`\n📍 URL actual: ${currentUrl}`);
    
    if (currentUrl.includes('/auth')) {
      console.log('❌ Aún en página de auth - login falló');
    } else {
      console.log('✅ Navegó fuera de auth - login exitoso');
    }
    
  } catch (error) {
    console.error('💥 Error en test:', error.message);
  } finally {
    await browser.close();
  }
}

testLogin().catch(console.error);