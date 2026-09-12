const fs = require('fs');
const content = fs.readFileSync('src/lib/i18n/translations.ts', 'utf8');

// Find the Arabic common block ending
const arCommonIdx = content.indexOf('common: {', 4439);
const arCommonEnd = content.indexOf('\r\n    },\r\n    // Footer', arCommonIdx);
console.log('Arabic common end context:', JSON.stringify(content.substring(arCommonEnd - 50, arCommonEnd + 30)));

// Find the English common block ending
const enCommonIdx = content.indexOf('common: {', 10345);
const enCommonEnd = content.indexOf('\r\n    },\r\n    footer:', enCommonIdx);
console.log('English common end context:', JSON.stringify(content.substring(enCommonEnd - 50, enCommonEnd + 30)));