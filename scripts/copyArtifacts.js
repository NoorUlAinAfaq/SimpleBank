// scripts/copyArtifacts.js
const fs = require('fs');
const path = require('path');

const sourcePath = path.join(__dirname, '../artifacts/contracts/SimpleBank.sol/SimpleBank.json');
const destDir = path.join(__dirname, '../frontend/src/contracts');
const destPath = path.join(destDir, 'SimpleBank.json');

// Create directory if it doesn't exist
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Copy the file
fs.copyFile(sourcePath, destPath, (err) => {
  if (err) {
    console.error('Error copying contract artifact:', err);
    process.exit(1);
  }
  console.log('Contract artifact copied to frontend successfully!');
});