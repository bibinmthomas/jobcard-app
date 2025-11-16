const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');
const { getAppPaths } = require('../utils/paths');
const { getPrismaClient } = require('../prisma/client');

/**
 * Setup IPC handlers for PDF operations
 */
function setupPdfIPC(ipcMain) {
  const prisma = getPrismaClient();

  // Generate PDF from job card and layout
  ipcMain.handle('pdf:generate', async (event, { jobCardId, layoutId }) => {
    try {
      // Get configured export path from settings
      const exportPathSetting = await prisma.appSettings.findUnique({
        where: { key: 'exportPath' },
      });

      // Use configured path or fall back to default
      let exportPath;
      if (exportPathSetting) {
        exportPath = JSON.parse(exportPathSetting.value);
      } else {
        const paths = getAppPaths();
        exportPath = paths.pdfExports;
      }

      // Ensure export directory exists
      await fs.mkdir(exportPath, { recursive: true });

      // Get job card data
      const jobCard = await prisma.jobCard.findUnique({
        where: { id: jobCardId },
      });

      if (!jobCard) {
        throw new Error('Job card not found');
      }

      // Get layout configuration
      const layout = await prisma.layout.findUnique({
        where: { id: layoutId },
      });

      if (!layout) {
        throw new Error('Layout not found');
      }

      // Parse data
      const customData = jobCard.customData ? JSON.parse(jobCard.customData) : {};
      const layoutConfig = JSON.parse(layout.jsonConfig);

      // Create PDF document
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Render elements from layout
      if (layoutConfig.elements && Array.isArray(layoutConfig.elements)) {
        for (const element of layoutConfig.elements) {
          if (element.type === 'text') {
            let text = element.text || '';

            // Replace placeholders with actual data
            text = text.replace('{{title}}', jobCard.title || '');
            text = text.replace('{{description}}', jobCard.description || '');

            // Replace custom field placeholders
            Object.keys(customData).forEach(key => {
              text = text.replace(`{{${key}}}`, customData[key] || '');
            });

            page.drawText(text, {
              x: element.x || 50,
              y: 841.89 - (element.y || 50), // Invert Y for PDF coordinate system
              size: element.fontSize || 12,
              font: element.bold ? boldFont : font,
              color: rgb(0, 0, 0),
            });
          }
        }
      }

      // Save PDF
      const pdfBytes = await pdfDoc.save();
      const filename = `jobcard_${jobCardId}_${Date.now()}.pdf`;
      const outputPath = path.join(exportPath, filename);

      await fs.writeFile(outputPath, pdfBytes);

      return {
        success: true,
        path: outputPath,
        filename,
      };
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  });

  // Import PDF file
  ipcMain.handle('pdf:import', async (event, filePath) => {
    try {
      const paths = getAppPaths();
      const filename = path.basename(filePath);
      const destPath = path.join(paths.pdfImports, filename);

      // Copy file to imports directory
      const fileData = await fs.readFile(filePath);
      await fs.writeFile(destPath, fileData);

      return {
        success: true,
        path: destPath,
        filename,
      };
    } catch (error) {
      console.error('Error importing PDF:', error);
      throw error;
    }
  });

  // Export PDF (alias for generate for now)
  ipcMain.handle('pdf:export', async (event, { jobCardId, layoutId }) => {
    return ipcMain.emit('pdf:generate', event, { jobCardId, layoutId });
  });

  // Get export path for a filename
  ipcMain.handle('pdf:getExportPath', async (event, filename) => {
    // Get configured export path from settings
    const exportPathSetting = await prisma.appSettings.findUnique({
      where: { key: 'exportPath' },
    });

    // Use configured path or fall back to default
    let exportPath;
    if (exportPathSetting) {
      exportPath = JSON.parse(exportPathSetting.value);
    } else {
      const paths = getAppPaths();
      exportPath = paths.pdfExports;
    }

    return path.join(exportPath, filename);
  });
}

module.exports = setupPdfIPC;
