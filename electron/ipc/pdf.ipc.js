const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');
const { getAppPaths } = require('../utils/paths');
const { getPrismaClient } = require('../prisma/client');

// Helper to convert hex color to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return rgb(
      parseInt(result[1], 16) / 255,
      parseInt(result[2], 16) / 255,
      parseInt(result[3], 16) / 255
    );
  }
  return rgb(0, 0, 0);
}

// Helper to get appropriate font
async function getFont(pdfDoc, fontFamily, bold, italic, fontsCache) {
  const key = `${fontFamily}-${bold}-${italic}`;
  if (fontsCache[key]) return fontsCache[key];
  
  let fontName;
  if (fontFamily === 'Times-Roman' || fontFamily === 'Times') {
    if (bold && italic) fontName = StandardFonts.TimesRomanBoldItalic;
    else if (bold) fontName = StandardFonts.TimesRomanBold;
    else if (italic) fontName = StandardFonts.TimesRomanItalic;
    else fontName = StandardFonts.TimesRoman;
  } else if (fontFamily === 'Courier') {
    if (bold && italic) fontName = StandardFonts.CourierBoldOblique;
    else if (bold) fontName = StandardFonts.CourierBold;
    else if (italic) fontName = StandardFonts.CourierOblique;
    else fontName = StandardFonts.Courier;
  } else {
    if (bold && italic) fontName = StandardFonts.HelveticaBoldOblique;
    else if (bold) fontName = StandardFonts.HelveticaBold;
    else if (italic) fontName = StandardFonts.HelveticaOblique;
    else fontName = StandardFonts.Helvetica;
  }
  
  const font = await pdfDoc.embedFont(fontName);
  fontsCache[key] = font;
  return font;
}

// Helper to replace placeholders
function replacePlaceholders(text, jobCard, customData) {
  let result = text || '';
  result = result.replace(/\{\{title\}\}/g, jobCard.title || '');
  result = result.replace(/\{\{description\}\}/g, jobCard.description || '');
  
  Object.keys(customData).forEach(key => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, customData[key] || '');
  });
  
  return result;
}

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
      const fontsCache = {};
      
      const PAGE_WIDTH = 595.28;
      const PAGE_HEIGHT = 841.89;

      // Handle multi-page layouts
      const pages = layoutConfig.pages || [{ elements: layoutConfig.elements || [] }];
      
      for (const pageConfig of pages) {
        const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        const pageElements = pageConfig.elements || [];

        for (const element of pageElements) {
          if (element.type === 'text') {
            let text = replacePlaceholders(element.text, jobCard, customData);
            
            const font = await getFont(
              pdfDoc, 
              element.fontFamily || 'Helvetica', 
              element.bold, 
              element.italic,
              fontsCache
            );
            
            const fontSize = element.fontSize || 12;
            const color = element.color ? hexToRgb(element.color) : rgb(0, 0, 0);
            const x = element.x || 50;
            const y = PAGE_HEIGHT - (element.y || 50) - fontSize;

            // Handle text alignment
            let textX = x;
            if (element.align === 'center' || element.align === 'right') {
              const textWidth = font.widthOfTextAtSize(text, fontSize);
              if (element.align === 'center') {
                textX = x - textWidth / 2;
              } else if (element.align === 'right') {
                textX = x - textWidth;
              }
            }

            page.drawText(text, {
              x: textX,
              y: y,
              size: fontSize,
              font: font,
              color: color,
            });

            // Draw underline if enabled
            if (element.underline) {
              const textWidth = font.widthOfTextAtSize(text, fontSize);
              page.drawLine({
                start: { x: textX, y: y - 2 },
                end: { x: textX + textWidth, y: y - 2 },
                thickness: 1,
                color: color,
              });
            }
          }
          
          // Handle image elements
          if (element.type === 'image' && element.src) {
            try {
              // Extract base64 data
              const base64Match = element.src.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/);
              if (base64Match) {
                const imageType = base64Match[1];
                const base64Data = base64Match[2];
                const imageBytes = Buffer.from(base64Data, 'base64');
                
                let image;
                if (imageType === 'png') {
                  image = await pdfDoc.embedPng(imageBytes);
                } else {
                  image = await pdfDoc.embedJpg(imageBytes);
                }
                
                const x = element.x || 50;
                const y = PAGE_HEIGHT - (element.y || 50) - (element.height || 100);
                
                page.drawImage(image, {
                  x: x,
                  y: y,
                  width: element.width || 100,
                  height: element.height || 100,
                });
              }
            } catch (imgError) {
              console.error('Error embedding image:', imgError);
            }
          }
          
          // Handle table elements
          if (element.type === 'table') {
            const tableX = element.x || 50;
            const tableY = PAGE_HEIGHT - (element.y || 50);
            const rows = element.rows || 1;
            const cols = element.cols || 1;
            const borderColor = element.borderColor ? hexToRgb(element.borderColor) : rgb(0, 0, 0);
            const fontSize = element.fontSize || 12;
            
            const font = await getFont(pdfDoc, element.fontFamily || 'Helvetica', false, false, fontsCache);
            
            // Use actual width/height if set, otherwise calculate from cellWidth/cellHeight
            const tableWidth = element.width || (cols * (element.cellWidth || 100));
            const tableHeight = element.height || (rows * (element.cellHeight || 30));
            const cellWidth = tableWidth / cols;
            const cellHeight = tableHeight / rows;
            
            // Draw horizontal lines
            for (let i = 0; i <= rows; i++) {
              page.drawLine({
                start: { x: tableX, y: tableY - i * cellHeight },
                end: { x: tableX + tableWidth, y: tableY - i * cellHeight },
                thickness: 1,
                color: borderColor,
              });
            }
            
            // Draw vertical lines
            for (let i = 0; i <= cols; i++) {
              page.drawLine({
                start: { x: tableX + i * cellWidth, y: tableY },
                end: { x: tableX + i * cellWidth, y: tableY - tableHeight },
                thickness: 1,
                color: borderColor,
              });
            }
            
            // Draw cell text
            if (element.cells && Array.isArray(element.cells)) {
              for (const cell of element.cells) {
                let cellText = replacePlaceholders(cell.text || '', jobCard, customData);
                if (cellText) {
                  const cellX = tableX + cell.col * cellWidth + 4;
                  const cellY = tableY - cell.row * cellHeight - cellHeight / 2 - fontSize / 2 + 4;
                  
                  page.drawText(cellText, {
                    x: cellX,
                    y: cellY,
                    size: fontSize,
                    font: font,
                    color: rgb(0, 0, 0),
                  });
                }
              }
            }
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
