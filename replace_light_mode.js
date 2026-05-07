const fs = require('fs');
const path = require('path');

const replacements = [
  { regex: /text-white\/([0-9]+)/g, replace: (m, p1) => `text-slate-${Math.max(400, 900 - parseInt(p1) * 5)}` }, // rough mapping
  { regex: /text-white/g, replace: 'text-slate-900' },
  { regex: /border-white\/([0-9]+)/g, replace: 'border-slate-200' },
  { regex: /bg-white\/\[0\.0[0-9]+\]/g, replace: 'bg-white' },
  { regex: /bg-white\/[0-9]+/g, replace: 'bg-slate-100' },
  { regex: /bg-black\/[0-9]+/g, replace: 'bg-white/80' },
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Custom manual replacements for specific aesthetics
  content = content.replace(/border-white\/10 bg-white\/\[0\.03\] backdrop-blur-xl/g, 'border-slate-200 bg-white shadow-sm');
  content = content.replace(/text-white\/30 text-xs/g, 'text-slate-500 text-xs');
  content = content.replace(/border-white\/5 bg-white\/\[0\.02\]/g, 'border-slate-100 bg-white');
  content = content.replace(/bg-gradient-to-br from-violet-500\/20 to-cyan-500\/20 border border-white\/10/g, 'bg-gradient-to-br from-violet-100 to-cyan-100 border border-violet-200');
  content = content.replace(/text-white\/40/g, 'text-slate-500');
  content = content.replace(/text-white\/50/g, 'text-slate-500');
  content = content.replace(/text-white\/60/g, 'text-slate-600');
  content = content.replace(/text-white\/70/g, 'text-slate-700');
  content = content.replace(/text-white\/20/g, 'text-slate-400');
  content = content.replace(/border-white\/5/g, 'border-slate-200');
  content = content.replace(/border-white\/8/g, 'border-slate-200');
  content = content.replace(/bg-white\/3/g, 'bg-slate-50');
  content = content.replace(/bg-white\/5/g, 'bg-slate-100');
  content = content.replace(/bg-white\/8/g, 'bg-slate-100');
  content = content.replace(/bg-white\/10/g, 'bg-slate-100');
  content = content.replace(/text-white/g, 'text-slate-900');
  content = content.replace(/border-white/g, 'border-slate-300');
  content = content.replace(/bg-\[\#0d0d1a\]/g, 'bg-white');
  content = content.replace(/bg-black\/20/g, 'bg-white/80');

  fs.writeFileSync(filePath, content, 'utf8');
}

const files = [
  'frontend/src/components/ResultPanel.jsx',
  'frontend/src/components/MetricsBar.jsx',
  'frontend/src/components/SimulationChart.jsx',
  'frontend/src/components/LocationInput.jsx',
  'frontend/src/components/PredictorPanel.jsx',
  'frontend/src/components/Navbar.jsx'
];

files.forEach(f => {
  processFile(path.join(__dirname, f));
});

console.log('Done');
