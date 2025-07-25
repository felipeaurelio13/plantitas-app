const puppeteer = require('puppeteer');

async function deepDebug() {
  console.log('🔬 Análisis profundo...');
  
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1');
  
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
    await page.goto('https://felipeaurelio13.github.io/plantitas-app/', { 
      waitUntil: 'networkidle0',
      timeout: 20000 
    });
    
    // Esperar más tiempo
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    // Análisis detallado del DOM
    const analysis = await page.evaluate(() => {
      const root = document.getElementById('root');
      const body = document.body;
      
      return {
        rootExists: !!root,
        rootHTML: root ? root.innerHTML.substring(0, 500) + '...' : 'NO ROOT',
        rootChildren: root ? root.children.length : 0,
        bodyText: body.innerText.substring(0, 200),
        bodyChildren: body.children.length,
        hasReact: typeof window.React !== 'undefined',
        hasRouter: typeof window.ReactRouter !== 'undefined',
        scripts: Array.from(document.scripts).map(s => s.src).filter(s => s),
        documentReady: document.readyState,
        url: window.location.href
      };
    });
    
    console.log('\n🔍 ANÁLISIS DOM:');
    console.log(JSON.stringify(analysis, null, 2));
    
    console.log('\n📊 RESUMEN:');
    console.log(`Total logs: ${logs.length}`);
    console.log(`Errores JS: ${errors.length}`);
    console.log(`Root existe: ${analysis.rootExists}`);
    console.log(`Root tiene hijos: ${analysis.rootChildren > 0}`);
    console.log(`Body text: "${analysis.bodyText}"`);
    
    if (errors.length > 0) {
      console.log('\n🚨 ERRORES DETECTADOS:');
      errors.forEach(err => console.log(`  ${err}`));
    }
    
    // Buscar logs específicos de auth
    const authLogs = logs.filter(log => log.includes('[AUTH]'));
    if (authLogs.length > 0) {
      console.log('\n🔐 LOGS DE AUTH:');
      authLogs.forEach(log => console.log(`  ${log}`));
    }
    
    // Buscar logs de router
    const routerLogs = logs.filter(log => log.includes('[ROUTER]'));
    if (routerLogs.length > 0) {
      console.log('\n🛣️ LOGS DE ROUTER:');
      routerLogs.forEach(log => console.log(`  ${log}`));
    }
    
  } catch (error) {
    console.error('Error en test:', error.message);
  } finally {
    await browser.close();
  }
}

deepDebug().catch(console.error);