import fs from 'fs';
import path from 'path';

const DIR = 'client/src/pages/rh';

// Pages that need ArrowLeft back button (those that don't have it yet)
const pagesNeedingBackButton = [
  'AcademiaGEG.tsx', 'AcoesBeneficios.tsx', 'ApontamentosFolhaGEG.tsx',
  'AtestadosLicencas.tsx', 'AvaliacaoDesempenho.tsx', 'BancoHoras.tsx',
  'BiRH.tsx', 'CargosSalarios.tsx', 'CarreiraDesenvolvimento.tsx',
  'ComissaoRhGEG.tsx', 'DayOffGEG.tsx', 'DoacaoSangueGEG.tsx',
  'DocumentosColaborador.tsx', 'EmailAniversariante.tsx', 'EquipamentosGEG.tsx',
  'FeriasGEG.tsx', 'MetasIndividuais.tsx', 'NiveisCargoGEG.tsx',
  'NovaTarefaGEG.tsx', 'OnboardingDigital.tsx', 'PesquisaClima.tsx',
  'ProjecaoFinanceiraGEG.tsx', 'ReajustesGEG.tsx', 'RelatoriosRH.tsx',
  'RescisaoPage.tsx', 'SenhasAutorizacoesGEG.tsx', 'SimuladorFeriasGEG.tsx',
  'ValeTransporteGEG.tsx', 'WorkflowRenovacao.tsx',
];

// Pages that need clear filters button (those with filters but no "Limpar" button)
const pagesNeedingClearFilters = [
  'AcoesBeneficios.tsx', 'ApontamentosFolhaGEG.tsx', 'AtestadosLicencas.tsx',
  'BancoHoras.tsx', 'CarreiraDesenvolvimento.tsx', 'ComissaoRhGEG.tsx',
  'DocumentosColaborador.tsx', 'EquipamentosGEG.tsx', 'FeriasGEG.tsx',
  'SenhasAutorizacoesGEG.tsx', 'ValeTransporteGEG.tsx', 'WorkflowRenovacao.tsx',
];

let modifiedCount = 0;

for (const filename of pagesNeedingBackButton) {
  const filepath = path.join(DIR, filename);
  if (!fs.existsSync(filepath)) continue;
  
  let content = fs.readFileSync(filepath, 'utf8');
  
  // Check if ArrowLeft is already imported
  if (content.includes('ArrowLeft')) continue;
  
  // Add ArrowLeft to lucide-react import
  const lucideImportMatch = content.match(/import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/);
  if (lucideImportMatch) {
    const existingImports = lucideImportMatch[1];
    const newImports = existingImports.trimEnd() + ', ArrowLeft';
    content = content.replace(lucideImportMatch[0], `import {${newImports}} from 'lucide-react'`);
  } else {
    // No lucide-react import, add one
    content = `import { ArrowLeft } from 'lucide-react';\n` + content;
  }
  
  // Add Link import if not present
  if (!content.includes("from 'wouter'") && !content.includes('from "wouter"')) {
    content = `import { Link } from 'wouter';\n` + content;
  } else if (!content.includes('Link')) {
    content = content.replace(/import\s*\{([^}]+)\}\s*from\s*['"]wouter['"]/, (match, imports) => {
      return `import {${imports}, Link} from 'wouter'`;
    });
  }
  
  // Add Button import if not present
  if (!content.includes("@/components/ui/button")) {
    content = `import { Button } from '@/components/ui/button';\n` + content;
  }
  
  // Find the h1 tag and add back button before it
  // Pattern: find the first <h1 and add a back button row before it
  const h1Match = content.match(/(\s*)<h1\s+className="[^"]*">/);
  if (h1Match) {
    const indent = h1Match[1];
    const backButton = `${indent}<div className="flex items-center gap-3 mb-6">\n${indent}  <Link href="/rh/dashboard"><Button variant="ghost" size="icon" className="shrink-0"><ArrowLeft className="w-5 h-5" /></Button></Link>\n${indent}  <div>\n${indent}  `;
    
    // Find the h1 and its closing, plus the subtitle p tag if present
    // We'll wrap the h1 + subtitle in a div with back button
    const h1Regex = /(\s*)<h1\s+className="([^"]*)">([\s\S]*?)<\/h1>\s*(?:<p\s+className="([^"]*)">([\s\S]*?)<\/p>)?/;
    const fullMatch = content.match(h1Regex);
    
    if (fullMatch) {
      const [original, ws, h1Class, h1Content, pClass, pContent] = fullMatch;
      let replacement = `${ws}<div className="flex items-center gap-3 mb-6">\n${ws}  <Link href="/rh/dashboard"><Button variant="ghost" size="icon" className="shrink-0"><ArrowLeft className="w-5 h-5" /></Button></Link>\n${ws}  <div>\n${ws}    <h1 className="${h1Class}">${h1Content}</h1>`;
      if (pClass && pContent) {
        replacement += `\n${ws}    <p className="${pClass}">${pContent}</p>`;
      }
      replacement += `\n${ws}  </div>\n${ws}</div>`;
      
      content = content.replace(original, replacement);
      modifiedCount++;
    }
  }
  
  fs.writeFileSync(filepath, content);
  console.log(`✅ Added back button to ${filename}`);
}

console.log(`\nModified ${modifiedCount} files with back buttons`);
