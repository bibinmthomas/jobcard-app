import { useState, useMemo } from 'react';
import { useJobCards } from '../hooks/useJobCards';
import { useLayouts } from '../hooks/useLayouts';
import { useAccounts } from '../hooks/useAccounts';
import JobCardForm from '../components/JobCardForm';
import JobCardList from '../components/JobCardList';
import { Button } from '../components/ui/button';
import { api } from '../utils/api';

export default function JobCards() {
  const { jobCards, createJobCard, updateJobCard, deleteJobCard } = useJobCards();
  const { layouts } = useLayouts();
  const { accounts } = useAccounts();
  const [isCreating, setIsCreating] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [selectedAccountId, setSelectedAccountId] = useState('all');

  const filteredJobCards = useMemo(() => {
    if (selectedAccountId === 'all') {
      return jobCards;
    }
    return jobCards.filter(card => card.accountId === parseInt(selectedAccountId));
  }, [jobCards, selectedAccountId]);

  const handleCreate = (data) => {
    createJobCard(data);
    setIsCreating(false);
  };

  const handleUpdate = (data) => {
    updateJobCard({ id: editingCard.id, data });
    setEditingCard(null);
  };

  const handleEdit = (jobCard) => {
    setEditingCard(jobCard);
    setIsCreating(false);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this job card?')) {
      deleteJobCard(id);
    }
  };

  const handleGeneratePDF = async (jobCardId) => {
    try {
      // Use the first layout if available
      if (layouts.length === 0) {
        alert('Please create a layout first in the Layouts section');
        return;
      }

      const result = await api.pdf.generate(jobCardId, layouts[0].id);
      if (result.success) {
        alert(`PDF generated successfully!\nSaved to: ${result.path}`);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Job Cards</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">Account:</label>
            <select
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
            >
              <option value="all">All Accounts</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>
          {!isCreating && !editingCard && (
            <Button onClick={() => setIsCreating(true)}>Create New Job Card</Button>
          )}
        </div>
      </div>

      {isCreating && (
        <div className="mb-6">
          <JobCardForm
            onSubmit={handleCreate}
            onCancel={() => setIsCreating(false)}
          />
        </div>
      )}

      {editingCard && (
        <div className="mb-6">
          <JobCardForm
            jobCard={editingCard}
            onSubmit={handleUpdate}
            onCancel={() => setEditingCard(null)}
          />
        </div>
      )}

      <JobCardList
        jobCards={filteredJobCards}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onGeneratePDF={handleGeneratePDF}
      />
    </div>
  );
}
