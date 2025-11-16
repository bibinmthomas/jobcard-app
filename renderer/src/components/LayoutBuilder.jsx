import { useState, useRef } from 'react';
import { Stage, Layer, Text, Rect, Image as KonvaImage } from 'react-konva';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useFieldCategories } from '../hooks/useFieldCategories';
import { X } from 'lucide-react';

const A4_WIDTH = 595;
const A4_HEIGHT = 842;
const SCALE = 0.7;

export default function LayoutBuilder({ layout, onSave, selectedCategories = [], onCategoriesChange }) {
  const [elements, setElements] = useState(layout?.jsonConfig?.elements || []);
  const [selectedId, setSelectedId] = useState(null);
  const [newText, setNewText] = useState('');
  const { categories } = useFieldCategories();
  const stageRef = useRef(null);

  const addTextElement = () => {
    if (!newText.trim()) return;

    const newElement = {
      id: `text-${Date.now()}`,
      type: 'text',
      text: newText,
      x: 50,
      y: 50,
      fontSize: 14,
      bold: false,
      draggable: true,
    };

    setElements([...elements, newElement]);
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
      bold: false,
      draggable: true,
    };

    setElements([...elements, newElement]);
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
    setElements(updatedElements);
  };

  const handleSelect = (id) => {
    setSelectedId(id);
  };

  const deleteSelected = () => {
    if (selectedId) {
      setElements(elements.filter((el) => el.id !== selectedId));
      setSelectedId(null);
    }
  };

  const updateSelectedFont = (fontSize) => {
    if (selectedId) {
      setElements(
        elements.map((el) =>
          el.id === selectedId ? { ...el, fontSize: parseInt(fontSize) } : el
        )
      );
    }
  };

  const toggleBold = () => {
    if (selectedId) {
      setElements(
        elements.map((el) =>
          el.id === selectedId ? { ...el, bold: !el.bold } : el
        )
      );
    }
  };

  const handleSave = () => {
    const layoutConfig = {
      elements: elements.map((el) => ({
        ...el,
        draggable: undefined, // Remove draggable property for storage
      })),
      canvasWidth: A4_WIDTH,
      canvasHeight: A4_HEIGHT,
    };

    onSave(layoutConfig);
  };

  const selectedElement = elements.find((el) => el.id === selectedId);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Layout Editor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            {/* Canvas */}
            <div>
              <div className="border-2 border-gray-300 dark:border-gray-600 rounded inline-block bg-white dark:bg-gray-800">
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
                    {/* Background */}
                    <Rect
                      x={0}
                      y={0}
                      width={A4_WIDTH}
                      height={A4_HEIGHT}
                      fill="white"
                    />

                    {/* Elements */}
                    {elements.map((element) => {
                      if (element.type === 'text') {
                        return (
                          <Text
                            key={element.id}
                            id={element.id}
                            text={element.text}
                            x={element.x}
                            y={element.y}
                            fontSize={element.fontSize}
                            fontFamily={element.bold ? 'Helvetica-Bold' : 'Helvetica'}
                            draggable={element.draggable}
                            fill={selectedId === element.id ? '#3b82f6' : '#000000'}
                            onDragEnd={(e) => handleDragEnd(element.id, e)}
                            onClick={() => handleSelect(element.id)}
                          />
                        );
                      }
                      return null;
                    })}
                  </Layer>
                </Stage>
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-4">
              {/* Add Text */}
              <div>
                <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Add Text</h3>
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
              <div>
                <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Add Placeholders</h3>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addPlaceholder('{{title}}')}
                  >
                    Title
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addPlaceholder('{{description}}')}
                  >
                    Description
                  </Button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Placeholders will be replaced with actual data when generating PDFs
                </p>
              </div>

              {/* Field Categories */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Associated Field Categories</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  Select which field categories this layout will use. Job cards using this layout will show fields from these categories.
                </p>

                {/* Selected Categories */}
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

                {/* Add Category Dropdown */}
                <select
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
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

                {/* Field Placeholders from Selected Categories */}
                {selectedCategories.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Available Field Placeholders:</p>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {selectedCategories.map((categoryId) => {
                        const category = categories.find(c => c.id === categoryId);
                        if (!category || !category.customFields) return null;
                        return category.customFields.map((field) => (
                          <button
                            key={`${categoryId}-${field.id}`}
                            type="button"
                            onClick={() => addPlaceholder(`{{${field.name}}}`)}
                            className="block w-full text-left px-2 py-1 text-xs bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded"
                          >
                            {field.name} <span className="text-gray-500 dark:text-gray-400">({category.name})</span>
                          </button>
                        ));
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Element Controls */}
              {selectedElement && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Selected Element</h3>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Font Size</label>
                      <Input
                        type="number"
                        value={selectedElement.fontSize}
                        onChange={(e) => updateSelectedFont(e.target.value)}
                        min="8"
                        max="72"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={selectedElement.bold ? 'default' : 'outline'}
                        onClick={toggleBold}
                      >
                        Bold
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={deleteSelected}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Save Layout */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
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
