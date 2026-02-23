import fs from 'fs';
import path from 'path';

const DIR = 'client/src/pages/rh';

// Pages that have Dialog forms for editing/creating
const pages = fs.readdirSync(DIR).filter(f => f.endsWith('.tsx'));

let count = 0;

for (const filename of pages) {
  const filepath = path.join(DIR, filename);
  let content = fs.readFileSync(filepath, 'utf8');
  
  // Skip if already has useUnsavedChanges
  if (content.includes('useUnsavedChanges')) continue;
  
  // Only add to pages that have Dialog forms (setOpen, setShowDialog, setShowCreate, setEdit, etc.)
  const hasDialog = content.includes('DialogContent') || content.includes('Dialog>');
  const hasForm = content.includes('setShowCreate') || content.includes('setShowDialog') || 
                  content.includes('setEditDialog') || content.includes('setEdit(') ||
                  content.includes('setOpenDialog') || content.includes('setDialogOpen');
  
  if (!hasDialog || !hasForm) continue;
  
  // Add import
  const importLine = `import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';\n`;
  
  // Find the first import line and add before it
  const firstImport = content.indexOf('import ');
  if (firstImport === -1) continue;
  
  content = content.slice(0, firstImport) + importLine + content.slice(firstImport);
  
  // Find the dialog open state variable
  const dialogStateMatch = content.match(/const \[(\w+(?:show|open|edit|dialog)\w*), (set\w+)\] = useState/i);
  if (!dialogStateMatch) continue;
  
  const [, stateVar] = dialogStateMatch;
  
  // Add the hook call after the last useState
  const lastUseState = content.lastIndexOf('useState');
  const lineEnd = content.indexOf('\n', lastUseState);
  if (lineEnd === -1) continue;
  
  const hookCall = `\n  useUnsavedChanges(${stateVar} !== false && ${stateVar} !== null && ${stateVar} !== undefined && !!${stateVar});\n`;
  content = content.slice(0, lineEnd + 1) + hookCall + content.slice(lineEnd + 1);
  
  fs.writeFileSync(filepath, content);
  count++;
  console.log(`✅ Added useUnsavedChanges to ${filename} (tracking: ${stateVar})`);
}

console.log(`\nModified ${count} files with unsaved changes hook`);
