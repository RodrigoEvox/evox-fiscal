import fs from 'fs';
import path from 'path';

const DIR = 'client/src/pages/rh';

// Pages that need clear filters button (those with filters but no "Limpar" button)
const pagesNeedingClearFilters = [
  'AcoesBeneficios.tsx', 'ApontamentosFolhaGEG.tsx', 'AtestadosLicencas.tsx',
  'BancoHoras.tsx', 'CarreiraDesenvolvimento.tsx', 'ComissaoRhGEG.tsx',
  'DocumentosColaborador.tsx', 'EquipamentosGEG.tsx', 'FeriasGEG.tsx',
  'SenhasAutorizacoesGEG.tsx', 'ValeTransporteGEG.tsx', 'WorkflowRenovacao.tsx',
  'DayOffGEG.tsx', 'ReajustesGEG.tsx', 'NiveisCargoGEG.tsx',
];

let modifiedCount = 0;

for (const filename of pagesNeedingClearFilters) {
  const filepath = path.join(DIR, filename);
  if (!fs.existsSync(filepath)) continue;
  
  let content = fs.readFileSync(filepath, 'utf8');
  
  // Skip if already has Limpar Filtros
  if (content.includes('Limpar Filtros') || content.includes('Limpar filtros')) continue;
  
  // Add XCircle to lucide imports if not present
  if (!content.includes('XCircle')) {
    const lucideMatch = content.match(/import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/);
    if (lucideMatch) {
      const existing = lucideMatch[1].trimEnd();
      content = content.replace(lucideMatch[0], `import {${existing}, XCircle} from 'lucide-react'`);
    }
  }
  
  // Find the search input or filter section and add a clear button after the Exportar or last filter button
  // Strategy: find the pattern with search/filter and add a clear filters button
  // Look for the search input section
  const searchMatch = content.match(/(Buscar|Pesquisar|search|setSearch)/);
  if (!searchMatch) continue;
  
  // Find all setState calls that look like filter resets
  const stateSetters = [];
  const setterRegex = /const \[(\w+), (set\w+)\] = useState[<(].*?["']?([^"')]*)/g;
  let m;
  while ((m = setterRegex.exec(content)) !== null) {
    const [, varName, setter] = m;
    if (varName.match(/search|filter|status|tipo|setor|mes|ano|periodo|tab|page|sort/i)) {
      stateSetters.push({ varName, setter });
    }
  }
  
  if (stateSetters.length === 0) continue;
  
  // Build the clear function
  const clearLines = stateSetters.map(s => {
    if (s.varName.match(/search/i)) return `${s.setter}("");`;
    if (s.varName.match(/page/i)) return `${s.setter}(1);`;
    if (s.varName.match(/tab/i)) return null; // don't reset tabs
    if (s.varName.match(/sort/i)) return null; // don't reset sort
    return `${s.setter}("");`;
  }).filter(Boolean);
  
  if (clearLines.length === 0) continue;
  
  // Find where to insert the clear filters button - after the Exportar button or search section
  // Look for a pattern like "Exportar" button or "Filtros" section
  const exportarIdx = content.indexOf('Exportar');
  const filtrosIdx = content.indexOf('Filtros');
  
  // Instead of complex insertion, add a simple function at the component level
  // Find the first return ( and add the function before it
  const returnIdx = content.indexOf('return (');
  if (returnIdx === -1) continue;
  
  const clearFn = `\n  const clearAllFilters = () => {\n    ${clearLines.join('\n    ')}\n  };\n`;
  
  content = content.slice(0, returnIdx) + clearFn + content.slice(returnIdx);
  
  // Now add the button in the UI - find the search input area
  // Look for the pattern: Exportar</Button> or similar end of filter row
  const exportBtnEnd = content.match(/(Exportar\s*<\/Button>)/);
  if (exportBtnEnd) {
    const insertAfter = exportBtnEnd[0];
    const clearBtn = `${insertAfter}\n            <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-muted-foreground"><XCircle className="w-4 h-4 mr-1" />Limpar Filtros</Button>`;
    content = content.replace(insertAfter, clearBtn);
  } else {
    // Try to find the end of the filter/search row
    const filterRowEnd = content.match(/(Filtros Avançados\s*<\/Button>)/);
    if (filterRowEnd) {
      const insertAfter = filterRowEnd[0];
      const clearBtn = `${insertAfter}\n            <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-muted-foreground"><XCircle className="w-4 h-4 mr-1" />Limpar Filtros</Button>`;
      content = content.replace(insertAfter, clearBtn);
    } else {
      // Try after the search Input
      const searchInputEnd = content.match(/(placeholder="[^"]*(?:Buscar|Pesquisar|buscar|pesquisar)[^"]*"\s*\/>)/);
      if (searchInputEnd) {
        const insertAfter = searchInputEnd[0];
        const clearBtn = `${insertAfter}\n          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-muted-foreground"><XCircle className="w-4 h-4 mr-1" />Limpar Filtros</Button>`;
        content = content.replace(insertAfter, clearBtn);
      }
    }
  }
  
  fs.writeFileSync(filepath, content);
  modifiedCount++;
  console.log(`✅ Added clear filters to ${filename}`);
}

console.log(`\nModified ${modifiedCount} files with clear filters`);
