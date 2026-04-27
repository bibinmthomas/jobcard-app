import { useJobCards } from '../hooks/useJobCards';
import { useAccounts } from '../hooks/useAccounts';
import { useFormFields } from '../hooks/useFormFields';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Building2, Sliders, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

function StatCard({ icon: Icon, label, value, color, to }) {
  const content = (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow`}>
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      </div>
    </div>
  );
  return to ? <Link to={to}>{content}</Link> : content;
}

export default function Dashboard() {
  const { jobCards }   = useJobCards();
  const { accounts }   = useAccounts();
  const { formFields } = useFormFields();
  const { user }       = useAuth();

  const recent = [...jobCards].slice(0, 5);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Welcome */}
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Welcome back, <span className="text-blue-600">{user?.username}</span>
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Here's a summary of your job card data.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard icon={FileText}  label="Job Cards"   value={jobCards.length}   color="bg-blue-500"   to="/jobcards" />
        <StatCard icon={Building2} label="Accounts"    value={accounts.length}   color="bg-emerald-500" to="/accounts" />
        <StatCard icon={Sliders}   label="Extra Fields" value={formFields.length} color="bg-purple-500"  to="/admin" />
      </div>

      {/* Quick actions */}
      <div className="flex gap-3 mb-8">
        <Link
          to="/jobcards"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
        >
          <Plus className="w-4 h-4" /> New Job Card
        </Link>
        <Link
          to="/accounts"
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium rounded-lg"
        >
          <Building2 className="w-4 h-4" /> Manage Accounts
        </Link>
      </div>

      {/* Recent job cards */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">
          Recent Job Cards
        </h2>
        {recent.length === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center">
            No job cards yet.
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {['Job No', 'Account', 'Part Name', 'Date', 'Amount'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {recent.map(card => (
                  <tr key={card.id} className="group hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors duration-150">
                    <td className="px-4 py-3 font-mono font-semibold text-blue-600 dark:text-blue-400 border-l-2 border-transparent group-hover:border-blue-400 transition-colors duration-150">
                      {card.jobNo}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200 font-medium">
                      {card.account?.acctName || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {card.partName || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {new Date(card.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {card.amount || '0.00'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
