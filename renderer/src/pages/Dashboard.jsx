import { useJobCards } from '../hooks/useJobCards';
import { useLayouts } from '../hooks/useLayouts';
import { useCustomFields } from '../hooks/useCustomFields';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { FileText, Layout, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { jobCards } = useJobCards();
  const { layouts } = useLayouts();
  const { customFields } = useCustomFields();

  const stats = [
    {
      title: 'Total Job Cards',
      value: jobCards.length,
      icon: FileText,
      link: '/jobcards',
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      title: 'PDF Layouts',
      value: layouts.length,
      icon: Layout,
      link: '/layouts',
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      title: 'Custom Fields',
      value: customFields.length,
      icon: Settings,
      link: '/admin',
      color: 'text-purple-600',
      bg: 'bg-purple-100',
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.title} to={stat.link}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{stat.title}</CardTitle>
                    <div className={`p-3 rounded-full ${stat.bg} dark:bg-opacity-20`}>
                      <Icon className={`w-6 h-6 ${stat.color} dark:opacity-80`} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Job Cards</CardTitle>
          </CardHeader>
          <CardContent>
            {jobCards.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No job cards yet</p>
            ) : (
              <div className="space-y-2">
                {jobCards.slice(0, 5).map((card) => (
                  <div
                    key={card.id}
                    className="p-3 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <div className="font-medium text-gray-900 dark:text-gray-100">{card.title}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(card.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link
                to="/jobcards"
                className="block p-3 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-gray-900 dark:text-gray-100"
              >
                Create New Job Card
              </Link>
              <Link
                to="/layouts"
                className="block p-3 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-gray-900 dark:text-gray-100"
              >
                Create New Layout
              </Link>
              <Link
                to="/admin"
                className="block p-3 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-gray-900 dark:text-gray-100"
              >
                Manage Custom Fields
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
