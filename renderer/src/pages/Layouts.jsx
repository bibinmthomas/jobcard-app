import { useState } from 'react';
import { useLayouts } from '../hooks/useLayouts';
import LayoutBuilder from '../components/LayoutBuilder';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Trash2, Edit } from 'lucide-react';

export default function Layouts() {
  const { layouts, createLayout, updateLayout, deleteLayout } = useLayouts();
  const [isCreating, setIsCreating] = useState(false);
  const [editingLayout, setEditingLayout] = useState(null);
  const [layoutName, setLayoutName] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);

  const handleSave = (jsonConfig) => {
    if (!layoutName.trim()) {
      alert('Please enter a layout name');
      return;
    }

    const data = {
      name: layoutName,
      jsonConfig,
      categoryIds: selectedCategoryIds,
    };

    if (editingLayout) {
      updateLayout({ id: editingLayout.id, data });
      setEditingLayout(null);
    } else {
      createLayout(data);
      setIsCreating(false);
    }

    setLayoutName('');
    setSelectedCategoryIds([]);
  };

  const handleEdit = (layout) => {
    setEditingLayout(layout);
    setLayoutName(layout.name);
    // Extract category IDs from layout categories
    const categoryIds = layout.categories?.map(lc => lc.categoryId) || [];
    setSelectedCategoryIds(categoryIds);
    setIsCreating(false);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this layout?')) {
      deleteLayout(id);
    }
  };

  const startNewLayout = () => {
    setIsCreating(true);
    setEditingLayout(null);
    setLayoutName('');
    setSelectedCategoryIds([]);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">PDF Layouts</h1>
        {!isCreating && !editingLayout && (
          <Button onClick={startNewLayout}>Create New Layout</Button>
        )}
      </div>

      {(isCreating || editingLayout) && (
        <div className="mb-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Layout Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Layout Name *</label>
                <Input
                  value={layoutName}
                  onChange={(e) => setLayoutName(e.target.value)}
                  placeholder="Enter layout name"
                />
              </div>
            </CardContent>
          </Card>

          <LayoutBuilder
            layout={editingLayout}
            onSave={handleSave}
            selectedCategories={selectedCategoryIds}
            onCategoriesChange={setSelectedCategoryIds}
          />

          <Button
            variant="outline"
            onClick={() => {
              setIsCreating(false);
              setEditingLayout(null);
              setLayoutName('');
              setSelectedCategoryIds([]);
            }}
          >
            Cancel
          </Button>
        </div>
      )}

      {!isCreating && !editingLayout && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Saved Layouts</h2>
          {layouts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500 dark:text-gray-400">
                No layouts found. Create your first layout to get started.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {layouts.map((layout) => (
                <Card key={layout.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{layout.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      {layout.jsonConfig?.elements?.length || 0} elements
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(layout)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(layout.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
