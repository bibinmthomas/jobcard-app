import { useState, useRef, useCallback, useEffect } from 'react';
import { Stage, Layer, Text, Rect, Image as KonvaImage, Line, Group, Transformer } from 'react-konva';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useFieldCategories } from '../hooks/useFieldCategories';
import { api } from '../utils/api';
import { 
  X, Plus, Trash2, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, 
  ChevronLeft, ChevronRight, Image as ImageIcon, Table, Type, Crop, Move, Copy
} from 'lucide-react';

const A4_WIDTH = 595;
const A4_HEIGHT = 842;
const SCALE = 0.7;

const FONT_FAMILIES = [
  'Helvetica',
  'Times-Roman',
  'Courier',
];

const DEFAULT_COLORS = [
  '#000000', '#333333', '#666666', '#999999', '#CCCCCC',
  '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
  '#800000', '#008000', '#000080', '#808000', '#800080', '#008080',
];

export default function LayoutBuilder({ layout, onSave, selectedCategories = [], onCategoriesChange }) {
  const [pages, setPages] = useState(() => {
    const existingPages = layout?.jsonConfig?.pages;
    if (existingPages && existingPages.length > 0) {
      return existingPages.map(page => ({
        ...page,
        elements: page.elements.map(el => ({ ...el, draggable: true }))
      }));
    }
    const existingElements = layout?.jsonConfig?.elements || [];
    return [{
      id: `page-${Date.now()}`,
      elements: existingElements.map(el => ({ ...el, draggable: true }))
    }];
  });
  
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [newText, setNewText] = useState('');
  const [tool, setTool] = useState('select');
  const [tableConfig, setTableConfig] = useState({ rows: 3, cols: 3 });
  const [cropMode, setCropMode] = useState(false);
  const [cropRect, setCropRect] = useState(null);
  
  const { categories } = useFieldCategories();
  const stageRef = useRef(null);
  const transformerRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageRefs = useRef({});
  
  const currentPage = pages[currentPageIndex] || { elements: [] };
  const elements = currentPage.elements || [];

  useEffect(() => {
    if (transformerRef.current) {
      const stage = stageRef.current;
      if (stage && selectedId) {
        const selectedNode = stage.findOne('#' + selectedId);
        if (selectedNode) {
          transformerRef.current.nodes([selectedNode]);
          transformerRef.current.getLayer().batchDraw();
        } else {
          transformerRef.current.nodes([]);
        }
      } else {
        transformerRef.current.nodes([]);
      }
    }
  }, [selectedId, elements]);

  const updateElements = useCallback((newElements) => {
    setPages(prev => prev.map((page, idx) => 
      idx === currentPageIndex ? { ...page, elements: newElements } : page
    ));
  }, [currentPageIndex]);

  const addPage = () => {
    const newPage = {
      id: `page-${Date.now()}`,
      elements: []
    };
    setPages([...pages, newPage]);
    setCurrentPageIndex(pages.length);
    setSelectedId(null);
  };

  const deletePage = (index) => {
    if (pages.length <= 1) {
      alert('Cannot delete the last page');
      return;
    }
    const newPages = pages.filter((_, i) => i !== index);
    setPages(newPages);
    if (currentPageIndex >= newPages.length) {
      setCurrentPageIndex(newPages.length - 1);
    }
    setSelectedId(null);
  };

  const duplicatePage = (index) => {
    const pageToCopy = pages[index];
    const newPage = {
      id: `page-${Date.now()}`,
      elements: pageToCopy.elements.map(el => ({
        ...el,
        id: `${el.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }))
    };
    const newPages = [...pages];
    newPages.splice(index + 1, 0, newPage);
    setPages(newPages);
  };

  const addTextElement = () => {
    if (!newText.trim()) return;

    const newElement = {
      id: `text-${Date.now()}`,
      type: 'text',
      text: newText,
      x: 50,
      y: 50,
      fontSize: 14,
      fontFamily: 'Helvetica',
      bold: false,
      italic: false,
      underline: false,
      color: '#000000',
      align: 'left',
      draggable: true,
    };

    updateElements([...elements, newElement]);
    setNewText('');
  };

  const addPlaceholder = (placeholder) => {
    const newElement = {
      id: `text-${Date.now()}`,
      type: 'text',
      text: placeholder,
      x: 50,
      y: 50 + elements.length * 30,
      fontSize: 14,
      fontFamily: 'Helvetica',
      bold: false,
      italic: false,
      underline: false,
      color: '#000000',
      align: 'left',
      draggable: true,
    };

    updateElements([...elements, newElement]);
  };

  const [imageWarning, setImageWarning] = useState('');

  const handleImageUpload = async () => {
    try {
      setImageWarning('');
      const result = await api.fileSystem.selectFile({
        filters: [{ name: 'PNG Images', extensions: ['png'] }]
      });
      
      if (result.canceled || !result.filePaths?.[0]) return;
      
      const filePath = result.filePaths[0];
      
      // Verify file is PNG
      const lowerPath = filePath.toLowerCase();
      if (!lowerPath.endsWith('.png')) {
        setImageWarning('Only PNG images are supported. Please select a PNG file.');
        return;
      }
      
      const fileData = await api.fileSystem.readFile(filePath);
      
      if (!fileData.success) {
        console.error('Failed to read file');
        setImageWarning('Failed to read the image file.');
        return;
      }
      
      const base64Data = `data:image/png;base64,${fileData.data}`;
      
      const img = new window.Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        
        const maxWidth = A4_WIDTH * 0.8;
        const maxHeight = A4_HEIGHT * 0.4;
        
        if (width > maxWidth) {
          const ratio = maxWidth / width;
          width = maxWidth;
          height = height * ratio;
        }
        if (height > maxHeight) {
          const ratio = maxHeight / height;
          height = maxHeight;
          width = width * ratio;
        }
        
        const newElement = {
          id: `image-${Date.now()}`,
          type: 'image',
          src: base64Data,
          x: 50,
          y: 50,
          width: width,
          height: height,
          originalWidth: img.width,
          originalHeight: img.height,
          cropX: 0,
          cropY: 0,
          cropWidth: img.width,
          cropHeight: img.height,
          draggable: true,
        };
        
        updateElements([...elements, newElement]);
      };
      img.src = base64Data;
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const addTable = () => {
    const cellWidth = 100;
    const cellHeight = 30;
    const tableWidth = tableConfig.cols * cellWidth;
    const tableHeight = tableConfig.rows * cellHeight;
    
    const cells = [];
    for (let row = 0; row < tableConfig.rows; row++) {
      for (let col = 0; col < tableConfig.cols; col++) {
        cells.push({
          row,
          col,
          text: '',
          width: cellWidth,
          height: cellHeight,
        });
      }
    }
    
    const newElement = {
      id: `table-${Date.now()}`,
      type: 'table',
      x: 50,
      y: 50,
      rows: tableConfig.rows,
      cols: tableConfig.cols,
      cells: cells,
      cellWidth: cellWidth,
      cellHeight: cellHeight,
      width: tableWidth,
      height: tableHeight,
      borderColor: '#000000',
      fontSize: 12,
      fontFamily: 'Helvetica',
      draggable: true,
    };
    
    updateElements([...elements, newElement]);
  };

  const addTableRow = () => {
    if (!selectedId) return;
    const element = elements.find(el => el.id === selectedId);
    if (!element || element.type !== 'table') return;
    
    const newRow = element.rows;
    const newCells = [...element.cells];
    
    for (let col = 0; col < element.cols; col++) {
      newCells.push({
        row: newRow,
        col,
        text: '',
        width: element.cellWidth,
        height: element.cellHeight,
      });
    }
    
    updateElements(elements.map(el => 
      el.id === selectedId 
        ? { 
            ...el, 
            rows: el.rows + 1, 
            cells: newCells,
            height: (el.rows + 1) * el.cellHeight
          } 
        : el
    ));
  };

  const addTableColumn = () => {
    if (!selectedId) return;
    const element = elements.find(el => el.id === selectedId);
    if (!element || element.type !== 'table') return;
    
    const newCol = element.cols;
    const newCells = [...element.cells];
    
    for (let row = 0; row < element.rows; row++) {
      newCells.push({
        row,
        col: newCol,
        text: '',
        width: element.cellWidth,
        height: element.cellHeight,
      });
    }
    
    updateElements(elements.map(el => 
      el.id === selectedId 
        ? { 
            ...el, 
            cols: el.cols + 1, 
            cells: newCells,
            width: (el.cols + 1) * el.cellWidth
          } 
        : el
    ));
  };

  const deleteTableRow = () => {
    if (!selectedId) return;
    const element = elements.find(el => el.id === selectedId);
    if (!element || element.type !== 'table' || element.rows <= 1) return;
    
    const newRows = element.rows - 1;
    const newCells = element.cells.filter(cell => cell.row < newRows);
    
    updateElements(elements.map(el => 
      el.id === selectedId 
        ? { 
            ...el, 
            rows: newRows, 
            cells: newCells,
            height: newRows * el.cellHeight
          } 
        : el
    ));
  };

  const deleteTableColumn = () => {
    if (!selectedId) return;
    const element = elements.find(el => el.id === selectedId);
    if (!element || element.type !== 'table' || element.cols <= 1) return;
    
    const newCols = element.cols - 1;
    const newCells = element.cells.filter(cell => cell.col < newCols);
    
    updateElements(elements.map(el => 
      el.id === selectedId 
        ? { 
            ...el, 
            cols: newCols, 
            cells: newCells,
            width: newCols * el.cellWidth
          } 
        : el
    ));
  };

  const updateTableCell = (cellRow, cellCol, text) => {
    if (!selectedId) return;
    
    updateElements(elements.map(el => {
      if (el.id !== selectedId || el.type !== 'table') return el;
      
      const newCells = el.cells.map(cell => 
        cell.row === cellRow && cell.col === cellCol 
          ? { ...cell, text } 
          : cell
      );
      
      return { ...el, cells: newCells };
    }));
  };

  const handleDragEnd = (id, e) => {
    const updatedElements = elements.map((el) =>
      el.id === id
        ? {
            ...el,
            x: e.target.x(),
            y: e.target.y(),
          }
        : el
    );
    updateElements(updatedElements);
  };

  const handleTransformEnd = (id, e) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    
    node.scaleX(1);
    node.scaleY(1);
    
    updateElements(elements.map(el => {
      if (el.id !== id) return el;
      
      if (el.type === 'image') {
        return {
          ...el,
          x: node.x(),
          y: node.y(),
          width: Math.max(20, node.width() * scaleX),
          height: Math.max(20, node.height() * scaleY),
        };
      }
      
      if (el.type === 'table') {
        const newWidth = Math.max(el.cols * 30, node.width() * scaleX);
        const newHeight = Math.max(el.rows * 20, node.height() * scaleY);
        const newCellWidth = newWidth / el.cols;
        const newCellHeight = newHeight / el.rows;
        
        return {
          ...el,
          x: node.x(),
          y: node.y(),
          width: newWidth,
          height: newHeight,
          cellWidth: newCellWidth,
          cellHeight: newCellHeight,
          cells: el.cells.map(cell => ({
            ...cell,
            width: newCellWidth,
            height: newCellHeight,
          })),
        };
      }
      
      return {
        ...el,
        x: node.x(),
        y: node.y(),
      };
    }));
  };

  const handleSelect = (id) => {
    setSelectedId(id);
    setCropMode(false);
  };

  const deleteSelected = () => {
    if (selectedId) {
      updateElements(elements.filter((el) => el.id !== selectedId));
      setSelectedId(null);
    }
  };

  const duplicateSelected = () => {
    if (!selectedId) return;
    const element = elements.find(el => el.id === selectedId);
    if (!element) return;
    
    const newElement = {
      ...element,
      id: `${element.type}-${Date.now()}`,
      x: element.x + 20,
      y: element.y + 20,
    };
    
    updateElements([...elements, newElement]);
    setSelectedId(newElement.id);
  };

  const updateSelectedProperty = (property, value) => {
    if (selectedId) {
      updateElements(
        elements.map((el) =>
          el.id === selectedId ? { ...el, [property]: value } : el
        )
      );
    }
  };

  const toggleBold = () => updateSelectedProperty('bold', !selectedElement?.bold);
  const toggleItalic = () => updateSelectedProperty('italic', !selectedElement?.italic);
  const toggleUnderline = () => updateSelectedProperty('underline', !selectedElement?.underline);

  const startCrop = () => {
    if (!selectedId) return;
    const element = elements.find(el => el.id === selectedId);
    if (!element || element.type !== 'image') return;
    setCropMode(true);
  };

  const applyCrop = () => {
    if (!selectedId || !cropRect) return;
    
    updateElements(elements.map(el => {
      if (el.id !== selectedId || el.type !== 'image') return el;
      
      return {
        ...el,
        cropX: cropRect.x,
        cropY: cropRect.y,
        cropWidth: cropRect.width,
        cropHeight: cropRect.height,
      };
    }));
    
    setCropMode(false);
    setCropRect(null);
  };

  const handleSave = () => {
    const layoutConfig = {
      pages: pages.map(page => ({
        id: page.id,
        elements: page.elements.map((el) => {
          const { draggable, ...rest } = el;
          return rest;
        }),
      })),
      canvasWidth: A4_WIDTH,
      canvasHeight: A4_HEIGHT,
    };

    onSave(layoutConfig);
  };

  const selectedElement = elements.find((el) => el.id === selectedId);

  const renderElement = (element) => {
    if (element.type === 'text') {
      let fontStyle = '';
      if (element.bold) fontStyle += 'bold ';
      if (element.italic) fontStyle += 'italic';
      fontStyle = fontStyle.trim() || 'normal';
      
      return (
        <Text
          key={element.id}
          id={element.id}
          text={element.text}
          x={element.x}
          y={element.y}
          fontSize={element.fontSize}
          fontFamily={element.fontFamily || 'Helvetica'}
          fontStyle={fontStyle}
          textDecoration={element.underline ? 'underline' : ''}
          fill={selectedId === element.id ? '#3b82f6' : (element.color || '#000000')}
          align={element.align || 'left'}
          draggable={element.draggable}
          onDragEnd={(e) => handleDragEnd(element.id, e)}
          onClick={() => handleSelect(element.id)}
          onTap={() => handleSelect(element.id)}
        />
      );
    }
    
    if (element.type === 'image') {
      return (
        <ImageElement
          key={element.id}
          element={element}
          isSelected={selectedId === element.id}
          onSelect={() => handleSelect(element.id)}
          onDragEnd={(e) => handleDragEnd(element.id, e)}
          onTransformEnd={(e) => handleTransformEnd(element.id, e)}
          imageRefs={imageRefs}
        />
      );
    }
    
    if (element.type === 'table') {
      return (
        <TableElement
          key={element.id}
          element={element}
          isSelected={selectedId === element.id}
          onSelect={() => handleSelect(element.id)}
          onDragEnd={(e) => handleDragEnd(element.id, e)}
          onTransformEnd={(e) => handleTransformEnd(element.id, e)}
        />
      );
    }
    
    return null;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Layout Editor</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                Page {currentPageIndex + 1} of {pages.length}
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Page Navigation */}
          <div className="flex items-center justify-between mb-4 p-2 bg-gray-100 dark:bg-gray-800 rounded">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPageIndex(Math.max(0, currentPageIndex - 1))}
                disabled={currentPageIndex === 0}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <div className="flex gap-1">
                {pages.map((page, index) => (
                  <button
                    key={page.id}
                    onClick={() => setCurrentPageIndex(index)}
                    className={`px-3 py-1 text-sm rounded ${
                      index === currentPageIndex 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPageIndex(Math.min(pages.length - 1, currentPageIndex + 1))}
                disabled={currentPageIndex === pages.length - 1}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={addPage}>
                <Plus className="w-4 h-4 mr-1" /> Add Page
              </Button>
              <Button size="sm" variant="outline" onClick={() => duplicatePage(currentPageIndex)}>
                <Copy className="w-4 h-4 mr-1" /> Duplicate
              </Button>
              <Button 
                size="sm" 
                variant="destructive" 
                onClick={() => deletePage(currentPageIndex)}
                disabled={pages.length <= 1}
              >
                <Trash2 className="w-4 h-4 mr-1" /> Delete Page
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-6">
            {/* Toolbar */}
            <div className="col-span-12 flex gap-2 p-2 bg-gray-100 dark:bg-gray-800 rounded">
              <Button
                size="sm"
                variant={tool === 'select' ? 'default' : 'outline'}
                onClick={() => setTool('select')}
                title="Select"
              >
                <Move className="w-4 h-4" />
              </Button>
              <div className="border-l border-gray-300 dark:border-gray-600 mx-1" />
              <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} title="Add Image">
                <ImageIcon className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={addTable} title="Add Table">
                <Table className="w-4 h-4" />
              </Button>
              <div className="border-l border-gray-300 dark:border-gray-600 mx-1" />
              {selectedElement?.type === 'text' && (
                <>
                  <Button
                    size="sm"
                    variant={selectedElement?.bold ? 'default' : 'outline'}
                    onClick={toggleBold}
                    title="Bold"
                  >
                    <Bold className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedElement?.italic ? 'default' : 'outline'}
                    onClick={toggleItalic}
                    title="Italic"
                  >
                    <Italic className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedElement?.underline ? 'default' : 'outline'}
                    onClick={toggleUnderline}
                    title="Underline"
                  >
                    <Underline className="w-4 h-4" />
                  </Button>
                  <div className="border-l border-gray-300 dark:border-gray-600 mx-1" />
                  <Button
                    size="sm"
                    variant={selectedElement?.align === 'left' ? 'default' : 'outline'}
                    onClick={() => updateSelectedProperty('align', 'left')}
                    title="Align Left"
                  >
                    <AlignLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedElement?.align === 'center' ? 'default' : 'outline'}
                    onClick={() => updateSelectedProperty('align', 'center')}
                    title="Align Center"
                  >
                    <AlignCenter className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedElement?.align === 'right' ? 'default' : 'outline'}
                    onClick={() => updateSelectedProperty('align', 'right')}
                    title="Align Right"
                  >
                    <AlignRight className="w-4 h-4" />
                  </Button>
                </>
              )}
              {selectedElement?.type === 'image' && (
                <Button size="sm" variant="outline" onClick={startCrop} title="Crop Image">
                  <Crop className="w-4 h-4" />
                </Button>
              )}
              <div className="flex-1" />
              {selectedId && (
                <>
                  <Button size="sm" variant="outline" onClick={duplicateSelected} title="Duplicate">
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={deleteSelected} title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>

            {/* Canvas */}
            <div className="col-span-7">
              <div className="border-2 border-gray-300 dark:border-gray-600 rounded inline-block bg-white dark:bg-gray-800 overflow-hidden">
                <Stage
                  width={A4_WIDTH * SCALE}
                  height={A4_HEIGHT * SCALE}
                  scaleX={SCALE}
                  scaleY={SCALE}
                  ref={stageRef}
                  onClick={(e) => {
                    if (e.target === e.target.getStage()) {
                      setSelectedId(null);
                    }
                  }}
                >
                  <Layer>
                    <Rect
                      x={0}
                      y={0}
                      width={A4_WIDTH}
                      height={A4_HEIGHT}
                      fill="white"
                    />
                    
                    {elements.map(renderElement)}
                    
                    <Transformer
                      ref={transformerRef}
                      boundBoxFunc={(oldBox, newBox) => {
                        if (newBox.width < 20 || newBox.height < 20) {
                          return oldBox;
                        }
                        return newBox;
                      }}
                    />
                  </Layer>
                </Stage>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </div>

            {/* Controls Panel */}
            <div className="col-span-5 space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {/* Add Text */}
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Type className="w-4 h-4" /> Add Text
                </h3>
                <div className="flex gap-2">
                  <Input
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    placeholder="Enter text..."
                    onKeyPress={(e) => e.key === 'Enter' && addTextElement()}
                  />
                  <Button onClick={addTextElement}>Add</Button>
                </div>
              </div>

              {/* Placeholders */}
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Placeholders</h3>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => addPlaceholder('{{title}}')}>
                    Title
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => addPlaceholder('{{description}}')}>
                    Description
                  </Button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Placeholders are replaced with actual data when generating PDFs
                </p>
              </div>

              {/* Table Configuration */}
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Table className="w-4 h-4" /> Table
                </h3>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Rows</label>
                    <Input
                      type="number"
                      min="1"
                      max="20"
                      value={tableConfig.rows}
                      onChange={(e) => setTableConfig(prev => ({ ...prev, rows: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Columns</label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={tableConfig.cols}
                      onChange={(e) => setTableConfig(prev => ({ ...prev, cols: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                </div>
                <Button size="sm" onClick={addTable} className="w-full">
                  <Plus className="w-4 h-4 mr-1" /> Add Table
                </Button>
                
                {selectedElement?.type === 'table' && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-medium mb-2 text-gray-700 dark:text-gray-300">Edit Selected Table</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button size="sm" variant="outline" onClick={addTableRow}>+ Row</Button>
                      <Button size="sm" variant="outline" onClick={addTableColumn}>+ Column</Button>
                      <Button size="sm" variant="outline" onClick={deleteTableRow}>- Row</Button>
                      <Button size="sm" variant="outline" onClick={deleteTableColumn}>- Column</Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Image Upload */}
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" /> Image
                </h3>
                <Button size="sm" onClick={handleImageUpload} className="w-full">
                  <Plus className="w-4 h-4 mr-1" /> Upload PNG Image
                </Button>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Only PNG format supported</p>
                {imageWarning && (
                  <div className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded text-xs text-yellow-800 dark:text-yellow-200">
                    {imageWarning}
                  </div>
                )}
                
                {selectedElement?.type === 'image' && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-medium mb-2 text-gray-700 dark:text-gray-300">Image Size</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Width</label>
                        <Input
                          type="number"
                          value={Math.round(selectedElement.width)}
                          onChange={(e) => updateSelectedProperty('width', parseInt(e.target.value) || 100)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Height</label>
                        <Input
                          type="number"
                          value={Math.round(selectedElement.height)}
                          onChange={(e) => updateSelectedProperty('height', parseInt(e.target.value) || 100)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Field Categories */}
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Field Categories</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  Select which field categories this layout will use.
                </p>

                {selectedCategories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedCategories.map((categoryId) => {
                      const category = categories.find(c => c.id === categoryId);
                      if (!category) return null;
                      return (
                        <div
                          key={categoryId}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded"
                        >
                          <span>{category.name}</span>
                          <button
                            type="button"
                            onClick={() => {
                              if (onCategoriesChange) {
                                onCategoriesChange(selectedCategories.filter(id => id !== categoryId));
                              }
                            }}
                            className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <select
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value=""
                  onChange={(e) => {
                    const categoryId = parseInt(e.target.value);
                    if (categoryId && onCategoriesChange && !selectedCategories.includes(categoryId)) {
                      onCategoriesChange([...selectedCategories, categoryId]);
                    }
                  }}
                >
                  <option value="">Select a category to add...</option>
                  {categories
                    .filter(cat => !selectedCategories.includes(cat.id))
                    .map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name} ({category.customFields?.length || 0} fields)
                      </option>
                    ))}
                </select>

                {selectedCategories.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Field Placeholders:</p>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {selectedCategories.map((categoryId) => {
                        const category = categories.find(c => c.id === categoryId);
                        if (!category || !category.customFields) return null;
                        return category.customFields.map((field) => (
                          <button
                            key={`${categoryId}-${field.id}`}
                            type="button"
                            onClick={() => addPlaceholder(`{{${field.name}}}`)}
                            className="block w-full text-left px-2 py-1 text-xs bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded border border-gray-200 dark:border-gray-600"
                          >
                            {field.name} <span className="text-gray-500 dark:text-gray-400">({category.name})</span>
                          </button>
                        ));
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Element Properties */}
              {selectedElement && selectedElement.type === 'text' && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                  <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Text Properties</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Text Content</label>
                      <Input
                        value={selectedElement.text}
                        onChange={(e) => updateSelectedProperty('text', e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Font Size</label>
                        <Input
                          type="number"
                          value={selectedElement.fontSize}
                          onChange={(e) => updateSelectedProperty('fontSize', parseInt(e.target.value) || 12)}
                          min="8"
                          max="72"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Font Family</label>
                        <select
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md"
                          value={selectedElement.fontFamily || 'Helvetica'}
                          onChange={(e) => updateSelectedProperty('fontFamily', e.target.value)}
                        >
                          {FONT_FAMILIES.map(font => (
                            <option key={font} value={font}>{font}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Color</label>
                      <div className="flex flex-wrap gap-1">
                        {DEFAULT_COLORS.map(color => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => updateSelectedProperty('color', color)}
                            className={`w-6 h-6 rounded border-2 ${
                              selectedElement.color === color 
                                ? 'border-blue-500' 
                                : 'border-gray-300 dark:border-gray-600'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">X Position</label>
                        <Input
                          type="number"
                          value={Math.round(selectedElement.x)}
                          onChange={(e) => updateSelectedProperty('x', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Y Position</label>
                        <Input
                          type="number"
                          value={Math.round(selectedElement.y)}
                          onChange={(e) => updateSelectedProperty('y', parseInt(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Table Cell Editor */}
              {selectedElement?.type === 'table' && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                  <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Table Cell Editor</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    Edit cell contents ({selectedElement.rows} rows x {selectedElement.cols} cols)
                  </p>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {Array.from({ length: selectedElement.rows }).map((_, rowIdx) => (
                      <div key={rowIdx} className="flex gap-1">
                        {Array.from({ length: selectedElement.cols }).map((_, colIdx) => {
                          const cell = selectedElement.cells.find(c => c.row === rowIdx && c.col === colIdx);
                          return (
                            <Input
                              key={`${rowIdx}-${colIdx}`}
                              className="flex-1 text-xs p-1"
                              placeholder={`R${rowIdx + 1}C${colIdx + 1}`}
                              value={cell?.text || ''}
                              onChange={(e) => updateTableCell(rowIdx, colIdx, e.target.value)}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Save Layout */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button onClick={handleSave} className="w-full">
                  Save Layout
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ImageElement({ element, isSelected, onSelect, onDragEnd, onTransformEnd, imageRefs }) {
  const [image, setImage] = useState(null);
  
  useEffect(() => {
    const img = new window.Image();
    img.onload = () => {
      setImage(img);
    };
    img.src = element.src;
  }, [element.src]);
  
  if (!image) return null;
  
  return (
    <KonvaImage
      id={element.id}
      image={image}
      x={element.x}
      y={element.y}
      width={element.width}
      height={element.height}
      crop={{
        x: element.cropX || 0,
        y: element.cropY || 0,
        width: element.cropWidth || element.originalWidth,
        height: element.cropHeight || element.originalHeight,
      }}
      draggable={element.draggable}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={onDragEnd}
      onTransformEnd={onTransformEnd}
      stroke={isSelected ? '#3b82f6' : undefined}
      strokeWidth={isSelected ? 2 : 0}
    />
  );
}

function TableElement({ element, isSelected, onSelect, onDragEnd, onTransformEnd }) {
  const { x, y, rows, cols, cells, cellWidth, cellHeight, borderColor, fontSize, fontFamily, width, height } = element;
  
  const tableWidth = width || cols * cellWidth;
  const tableHeight = height || rows * cellHeight;
  const actualCellWidth = tableWidth / cols;
  const actualCellHeight = tableHeight / rows;
  
  return (
    <Group
      id={element.id}
      x={x}
      y={y}
      width={tableWidth}
      height={tableHeight}
      draggable={element.draggable}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={onDragEnd}
      onTransformEnd={onTransformEnd}
    >
      {/* Background */}
      <Rect
        width={tableWidth}
        height={tableHeight}
        fill="white"
        stroke={isSelected ? '#3b82f6' : borderColor}
        strokeWidth={isSelected ? 2 : 1}
      />
      
      {/* Horizontal lines */}
      {Array.from({ length: rows + 1 }).map((_, i) => (
        <Line
          key={`h-${i}`}
          points={[0, i * actualCellHeight, tableWidth, i * actualCellHeight]}
          stroke={borderColor}
          strokeWidth={1}
        />
      ))}
      
      {/* Vertical lines */}
      {Array.from({ length: cols + 1 }).map((_, i) => (
        <Line
          key={`v-${i}`}
          points={[i * actualCellWidth, 0, i * actualCellWidth, tableHeight]}
          stroke={borderColor}
          strokeWidth={1}
        />
      ))}
      
      {/* Cell text */}
      {cells.map((cell, idx) => (
        <Text
          key={idx}
          x={cell.col * actualCellWidth + 4}
          y={cell.row * actualCellHeight + (actualCellHeight - fontSize) / 2}
          width={actualCellWidth - 8}
          height={actualCellHeight}
          text={cell.text}
          fontSize={fontSize}
          fontFamily={fontFamily}
          fill="#000000"
          align="left"
          verticalAlign="middle"
        />
      ))}
    </Group>
  );
}
