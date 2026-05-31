const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function migrateConfirms() {
  const dirs = [
    'e:/BandProject/OurBand/front/ourband/app',
    'e:/BandProject/OurBand/front/ourband/components'
  ];
  
  dirs.forEach(targetDir => {
    walkDir(targetDir, function(filePath) {
      if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) return;
      
      let content = fs.readFileSync(filePath, 'utf-8');
      
      if (!content.includes('confirm(')) return;
      
      console.log(`Processing: ${filePath}`);
      
      // Make sure useConfirm is imported
      if (!content.includes('from "@/hooks/useConfirm"')) {
        const importStmt = 'import { useConfirm } from "@/hooks/useConfirm";\n';
        const importRegex = /import .* from ['"].*['"];?\r?\n/g;
        let lastImportMatch = null;
        let match;
        while ((match = importRegex.exec(content)) !== null) {
          lastImportMatch = match;
        }
        if (lastImportMatch) {
          const insertPos = lastImportMatch.index + lastImportMatch[0].length;
          content = content.slice(0, insertPos) + importStmt + content.slice(insertPos);
        } else {
          content = importStmt + content;
        }
      }
      
      // Insert `const { confirm } = useConfirm();` inside the component body if not present
      // We can look for `export default function` or `export function`
      if (!content.includes('const { confirm } = useConfirm();')) {
        content = content.replace(/(export (?:default )?(?:function|const) \w+\s*(?:=\s*(?:\([^)]*\)|\w+)\s*=>|\([^)]*\))\s*\{)/, '$1\n  const { confirm } = useConfirm();');
      }
      
      // Replace confirm(...) with await confirm({ message: ... })
      // For `if (confirm("..."))`
      content = content.replace(/confirm\((['"`].*?['"`])\)/g, 'await confirm({ message: $1, isDestructive: true })');
      
      fs.writeFileSync(filePath, content, 'utf-8');
    });
  });
  
  console.log('Confirm migration complete!');
}

migrateConfirms();
