import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useCustomFields } from '../hooks/useCustomFields';
import { Trash2, Edit, Plus } from 'lucide-react';

export default function AdminCustomFields() {
  const { customFields, createCustomField, updateCustomField, deleteCustomField } = useCustomFields();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'text',
    required: false,
    options: '',
  });

  const fieldTypes = [
    { value: 'text', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'select', label: 'Select (Dropdown)' },
  ];

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'text',
      required: false,
      options: '',
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const data = {
      name: formData.name,
      type: formData.type,
      required: formData.required,
      options: formData.type === 'select' && formData.options
        ? formData.options.split(',').map(o => o.trim())
        : null,
      order: customFields.length,
    };

    if (editingId) {
      updateCustomField({ id: editingId, data });
    } else {
      createCustomField(data);
    }

    resetForm();
  };

  const handleEdit = (field) => {
    setEditingId(field.id);
    setFormData({
      name: field.name,
      type: field.type,
      required: field.required,
      options: Array.isArray(field.options) ? field.options.join(', ') : '',
    });
    setIsAdding(true);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this custom field?')) {
      deleteCustomField(id);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Custom Fields Management</CardTitle>
            {!isAdding && (
              <Button onClick={() => setIsAdding(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Add Field
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isAdding && (
            <form onSubmit={handleSubmit} className="mb-6 p-4 border rounded-lg bg-gray-50">
              <h3 className="font-semibold mb-4">
                {editingId ? 'Edit Custom Field' : 'Add New Custom Field'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Field Name *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Customer Name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Field Type *</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    {fieldTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.type === 'select' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Options (comma-separated)
                    </label>
                    <Input
                      value={formData.options}
                      onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                      placeholder="e.g., Option 1, Option 2, Option 3"
                    />
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="required"
                    checked={formData.required}
                    onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="required" className="text-sm font-medium">
                    Required Field
                  </label>
                </div>

                <div className="flex gap-2">
                  <Button type="submit">
                    {editingId ? 'Update' : 'Add'} Field
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </div>
            </form>
          )}

          <div className="space-y-2">
            <h3 className="font-semibold mb-3">Existing Custom Fields</h3>
            {customFields.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No custom fields defined. Add your first custom field to get started.
              </p>
            ) : (
              <div className="space-y-2">
                {customFields.map((field) => (
                  <div
                    key={field.id}
                    className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <div className="font-medium">
                        {field.name}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </div>
                      <div className="text-sm text-gray-500">
                        Type: {field.type}
                        {field.options && ` (${field.options.length} options)`}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(field)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(field.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
