import { useState } from 'react';
import { Trash2, Pencil, Eye, Download } from 'lucide-react';
import PDFPreviewModal from './PDFPreviewModal';

export default function JobCardList({ jobCards, onEdit, onDelete, emptyMessage }) {
  const [previewCard, setPreviewCard] = useState(null);

  if (jobCards.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          {emptyMessage || 'No job cards yet. Create one to get started.'}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <tr>
              {['Job No', 'Date', 'Account', 'Part Name', 'Operator', 'Amount', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300 text-xs uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {jobCards.map(card => (
              <tr key={card.id} className="group hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors duration-150">
                <td className="px-4 py-3 font-mono font-semibold text-blue-600 dark:text-blue-400 border-l-2 border-transparent group-hover:border-blue-400 transition-colors duration-150">
                  {card.jobNo}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                  {new Date(card.date).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-200 font-medium">
                  {card.account?.acctName || '—'}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                  {card.partName || '—'}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                  {card.operator || '—'}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                  {card.amount || '0.00'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <button
                      onClick={() => setPreviewCard(card)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                      title="Preview PDF"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEdit(card)}
                      className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-md transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(card.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-md transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PDF Preview / Download Modal */}
      {previewCard && (
        <PDFPreviewModal
          jobCard={previewCard}
          onClose={() => setPreviewCard(null)}
        />
      )}
    </>
  );
}
