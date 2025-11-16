const { app } = require('electron');
const path = require('path');
const fs = require('fs');

/**
 * Get and create all necessary application paths
 */
function getAppPaths() {
  const userDataPath = app.getPath('userData');

  const paths = {
    userData: userDataPath,
    pdfExports: path.join(userDataPath, 'pdf-exports'),
    pdfImports: path.join(userDataPath, 'pdf-imports'),
    layouts: path.join(userDataPath, 'layouts'),
    database: path.join(userDataPath, 'database'),
  };

  // Create directories if they don't exist
  Object.values(paths).forEach(dirPath => {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });

  return paths;
}

module.exports = { getAppPaths };
