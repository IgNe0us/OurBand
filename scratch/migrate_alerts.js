const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function migrateAlerts() {
  const targetDir = 'e:/BandProject/OurBand/front/ourband/app';
  
  walkDir(targetDir, function(filePath) {
    if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) return;
    
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Check if file uses alert()
    if (!content.includes('alert(')) return;
    
    console.log(`Processing: ${filePath}`);
    
    // Make sure react-hot-toast is imported
    if (!content.includes('from "react-hot-toast"')) {
      // Find the last import statement or beginning of file
      const importRegex = /import .* from ['"].*['"];?\r?\n/g;
      let lastImportMatch = null;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        lastImportMatch = match;
      }
      
      const importStmt = 'import toast from "react-hot-toast";\n';
      if (lastImportMatch) {
        const insertPos = lastImportMatch.index + lastImportMatch[0].length;
        content = content.slice(0, insertPos) + importStmt + content.slice(insertPos);
      } else {
        // Just put it at the very top
        content = importStmt + content;
      }
    }
    
    // Replace alert(...) with toast(...)
    // We use a regex that matches alert( ... ) properly, even with newlines
    // Simplistic regex for alert(something)
    content = content.replace(/alert\(([\s\S]*?)\)/g, (match, args) => {
      // Check if it's a success message
      if (args.includes('성공') || args.includes('완료') || args.includes('되었습니다') || args.includes('수락')) {
        return `toast.success(${args})`;
      } else {
        // Assume error or warning
        return `toast.error(${args})`;
      }
    });
    
    fs.writeFileSync(filePath, content, 'utf-8');
  });
  
  console.log('Migration complete!');
}

migrateAlerts();
