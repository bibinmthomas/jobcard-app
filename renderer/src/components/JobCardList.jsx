import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Trash2, Edit, FileDown } from 'lucide-react';

export default function JobCardList({ jobCards, onEdit, onDelete, onGeneratePDF }) {
  const [selectedLayout, setSelectedLayout] = useState(null);

  if (jobCards.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-gray-500 dark:text-gray-400">
          No job cards found. Create your first job card to get started.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {jobCards.map((jobCard) => (
        <Card key={jobCard.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">{jobCard.title}</CardTitle>
                {jobCard.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{jobCard.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                {onGeneratePDF && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onGeneratePDF(jobCard.id)}
                  >
                    <FileDown className="w-4 h-4 mr-1" />
                    PDF
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(jobCard)}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onDelete(jobCard.id)}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </CardHeader>
          {Object.keys(jobCard.customData || {}).length > 0 && (
            <CardContent>
              <div className="text-sm">
                <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Custom Fields:</h4>
                <dl className="grid grid-cols-2 gap-2">
                  {Object.entries(jobCard.customData).map(([key, value]) => (
                    <div key={key}>
                      <dt className="text-gray-500 dark:text-gray-400">{key}:</dt>
                      <dd className="font-medium text-gray-900 dark:text-gray-100">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}
