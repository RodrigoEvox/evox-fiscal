import fs from 'fs';
import path from 'path';

const DIR = 'client/src/pages/rh';

// Manual definitions for each remaining page
const pages = [
  {
    file: 'BancoHoras.tsx',
    clearCode: `setFiltroColaborador("todos");`,
    insertAfterPattern: /(<Select value=\{filtroColaborador\}[\s\S]*?<\/Select>)/,
  },
  {
    file: 'WorkflowRenovacao.tsx',
    clearCode: `setFiltroStatus("todos");`,
    insertAfterPattern: /(<Select value=\{filtroStatus\}[\s\S]*?<\/Select>)/,
  },
  {
    file: 'ApontamentosFolhaGEG.tsx',
    clearCode: `setMesRef(new Date().getMonth() + 1); setAnoRef(new Date().getFullYear());`,
    insertAfterPattern: null, // will add after the anoRef Input
  },
  {
    file: 'ComissaoRhGEG.tsx',
    clearCode: `setMesRef(new Date().getMonth() + 1); setAnoRef(new Date().getFullYear());`,
    insertAfterPattern: null,
  },
  {
    file: 'ValeTransporteGEG.tsx',
    clearCode: `setMesRef(new Date().getMonth() + 1); setAnoRef(new Date().getFullYear());`,
    insertAfterPattern: null,
  },
];

let count = 0;

for (const pg of pages) {
  const filepath = path.join(DIR, pg.file);
  if (!fs.existsSync(filepath)) { console.log(`⏭ ${pg.file} not found`); continue; }
  
  let content = fs.readFileSync(filepath, 'utf8');
  if (content.includes('Limpar Filtros') || content.includes('Limpar filtros')) {
    console.log(`⏭ ${pg.file} already has clear filters`);
    continue;
  }
  
  // Add XCircle to lucide imports
  if (!content.includes('XCircle')) {
    const lucideMatch = content.match(/import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/);
    if (lucideMatch) {
      const existing = lucideMatch[1].trimEnd();
      content = content.replace(lucideMatch[0], `import {${existing}, XCircle} from 'lucide-react'`);
    }
  }
  
  // Add clear function before return (
  const returnIdx = content.indexOf('return (');
  if (returnIdx === -1) { console.log(`⏭ ${pg.file} no return found`); continue; }
  
  const clearFn = `\n  const clearAllFilters = () => { ${pg.clearCode} };\n`;
  content = content.slice(0, returnIdx) + clearFn + content.slice(returnIdx);
  
  // Add the button - find the filter area
  // For Select-based filters, add after the Select
  // For month/year filters, add after the year Input
  const anoInputMatch = content.match(/(className="w-\[100px\]"\s*\/>)/);
  const selectEndMatch = content.match(/(onValueChange=\{setFiltro\w+\}[\s\S]*?<\/Select>)/);
  
  const clearBtn = `\n          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-muted-foreground"><XCircle className="w-4 h-4 mr-1" />Limpar Filtros</Button>`;
  
  if (anoInputMatch && pg.clearCode.includes('setMesRef')) {
    content = content.replace(anoInputMatch[0], anoInputMatch[0] + clearBtn);
  } else if (selectEndMatch) {
    // Find the last closing </Select> in the filter row
    const filterSelectMatch = content.match(/(onValueChange=\{setFiltro\w+\}[\s\S]*?<\/SelectContent>\s*<\/Select>)/);
    if (filterSelectMatch) {
      content = content.replace(filterSelectMatch[0], filterSelectMatch[0] + clearBtn);
    }
  }
  
  fs.writeFileSync(filepath, content);
  count++;
  console.log(`✅ Added clear filters to ${pg.file}`);
}

console.log(`\nModified ${count} additional files`);
