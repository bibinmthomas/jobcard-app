import { useState } from 'react';
import { useFieldCategories } from '../hooks/useFieldCategories';
import { Trash2, Edit2, Plus, ChevronRight } from 'lucide-react';

export default function AdminFieldCategories({ onSelectCategory }) {
  const { categories, isLoading, createCategory, updateCategory, deleteCategory, isCreating, isDeleting } = useFieldCategories();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', order: 0 });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (editingCategory) {
      updateCategory(
        { id: editingCategory.id, data: formData },
        {
          onSuccess: () => {
            setIsFormOpen(false);
            setEditingCategory(null);
            setFormData({ name: '', description: '', order: 0 });
          },
        }
      );
    } else {
      createCategory(formData, {
        onSuccess: () => {
          setIsFormOpen(false);
          setFormData({ name: '', description: '', order: 0 });
        },
      });
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      order: category.order,
    });
    setIsFormOpen(true);
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete the category "${name}"? This will also hide all fields in this category.`)) {
      deleteCategory(id);
    }
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingCategory(null);
    setFormData({ name: '', description: '', order: 0 });
  };

  if (isLoading) {
    return <div className="text-center py-8 text-gray-600 dark:text-gray-400">Loading categories...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Field Categories</h2>
          <p className="text-sm text-gray-600 mt-1 dark:text-gray-400">
            Organize custom fields into categories. Each layout can use fields from multiple categories.
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Category
        </button>
      </div>

      {/* Create/Edit Form */}
      {isFormOpen && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {editingCategory ? 'Edit Category' : 'Create New Category'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                placeholder="e.g., Customer Information, Job Details, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                placeholder="Describe what kind of fields belong in this category..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Display Order
              </label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Lower numbers appear first</p>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="submit"
                disabled={isCreating}
                className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories List */}
      <div className="space-y-3">
        {categories.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
            <p className="text-gray-600 dark:text-gray-400 mb-4">No field categories yet</p>
            <button
              onClick={() => setIsFormOpen(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Category
            </button>
          </div>
        ) : (
          categories.map((category) => (
            <div
              key={category.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{category.name}</h3>
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium rounded">
                      {category.customFields?.length || 0} fields
                    </span>
                  </div>
                  {category.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{category.description}</p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Order: {category.order}</p>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => onSelectCategory(category)}
                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-md transition-colors"
                    title="Manage fields"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleEdit(category)}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                    title="Edit category"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(category.id, category.name)}
                    disabled={isDeleting}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded-md transition-colors disabled:opacity-50"
                    title="Delete category"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
