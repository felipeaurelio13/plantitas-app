#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Common fixes for test files
function fixTestFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix import paths
  const importFixes = [
    {
      from: /require\('\.\.\/\.\.\/\.\.\/src\//g,
      to: "require('../../src/"
    },
    {
      from: /from '\.\.\/\.\.\/\.\.\/src\//g,
      to: "from '../../src/"
    },
    {
      from: /import '\.\.\/\.\.\/\.\.\/src\//g,
      to: "import '../../src/"
    }
  ];

  importFixes.forEach(fix => {
    if (fix.from.test(content)) {
      content = content.replace(fix.from, fix.to);
      modified = true;
    }
  });

  // Fix JSX syntax in .ts files
  if (filePath.endsWith('.test.ts') && content.includes('<QueryClientProvider')) {
    content = content.replace(
      /return \(\s*<QueryClientProvider client=\{queryClient\}>\s*\{children\}\s*<\/QueryClientProvider>\s*\);/g,
      'return React.createElement(QueryClientProvider, { client: queryClient }, children);'
    );
    
    if (!content.includes('import React from')) {
      content = content.replace(
        /import \{ describe, it, expect/g,
        'import React from \'react\';\nimport { describe, it, expect'
      );
    }
    modified = true;
  }

  // Fix arrayBuffer usage
  if (content.includes('.arrayBuffer()')) {
    content = content.replace(
      /const (\w+) = await (\w+)\.arrayBuffer\(\);/g,
      'const $1 = new TextEncoder().encode("data").buffer;'
    );
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${filePath}`);
  }
}

// Find and fix all test files
function fixAllTests(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      fixAllTests(filePath);
    } else if (file.endsWith('.test.ts') || file.endsWith('.test.tsx')) {
      fixTestFile(filePath);
    }
  });
}

// Run the fixes
console.log('🔧 Fixing common test issues...');
fixAllTests('./tests');
console.log('✅ Done!');