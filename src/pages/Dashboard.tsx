import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Database, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  FileText,
  Users,
  DollarSign
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import StatsCard from '../components/StatsCard';
import { CottonTradingAPI } from '../services/api';
import type { ParsingStats } from '../types/cotton';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<ParsingStats>({
    total_emails: 0,
    successful_parsing: 0,
    failed_parsing: 0,
    pending_review: 0,
    average_confidence: 0
  });
  const [loading, setLoading] = useState(true);

  const mockChartData = [
    { name: 'Mon', emails: 12, success: 10, failed: 2 },
    { name: 'Tue', emails: 19, success: 16, failed: 3 },
    { name: 'Wed', emails: 15, success: 14, failed: 1 },
    { name: 'Thu', emails: 22, success: 18, failed: 4 },
    { name: 'Fri', emails: 18, success: 15, failed: 3 },
    { name: 'Sat', emails: 8, success: 7, failed: 1 },
    { name: 'Sun', emails: 5, success: 5, failed: 0 },
  ];

  const mockConfidenceData = [
    { name: 'Week 1', confidence: 85 },
    { name: 'Week 2', confidence: 87 },
    { name: 'Week 3', confidence: 82 },
    { name: 'Week 4', confidence: 89 },
  ];

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const statsData = await CottonTradingAPI.getParsingStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Cotton Trading Dashboard</h1>
        <p className="text-gray-600 mt-2">Monitor email processing and cotton trading data in real-time</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Emails"
          value={stats.total_emails}
          icon={Mail}
          color="blue"
          trend={{ value: 12, label: 'vs last week' }}
        />
        <StatsCard
          title="Successful Processing"
          value={stats.successful_parsing}
          icon={CheckCircle}
          color="green"
          trend={{ value: 8, label: 'vs last week' }}
        />
        <StatsCard
          title="Pending Review"
          value={stats.pending_review}
          icon={AlertTriangle}
          color="yellow"
          trend={{ value: -15, label: 'vs last week' }}
        />
        <StatsCard
          title="Average Confidence"
          value={`${stats.average_confidence}%`}
          icon={TrendingUp}
          color="blue"
          trend={{ value: 3, label: 'vs last week' }}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Email Processing Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Processing Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mockChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="success" fill="#059669" name="Successful" />
              <Bar dataKey="failed" fill="#dc2626" name="Failed" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Confidence Trends */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Parsing Confidence Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mockConfidenceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[70, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="confidence" stroke="#2563eb" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Mail className="h-8 w-8 text-blue-600 mr-3" />
            <div className="text-left">
              <div className="font-medium text-gray-900">View Recent Emails</div>
              <div className="text-sm text-gray-500">Check latest processing</div>
            </div>
          </button>
          
          <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Database className="h-8 w-8 text-emerald-600 mr-3" />
            <div className="text-left">
              <div className="font-medium text-gray-900">Export Data</div>
              <div className="text-sm text-gray-500">Download cotton data</div>
            </div>
          </button>
          
          <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <AlertTriangle className="h-8 w-8 text-yellow-600 mr-3" />
            <div className="text-left">
              <div className="font-medium text-gray-900">Review Queue</div>
              <div className="text-sm text-gray-500">Manual review items</div>
            </div>
          </button>
          
          <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <FileText className="h-8 w-8 text-gray-600 mr-3" />
            <div className="text-left">
              <div className="font-medium text-gray-900">Processing Logs</div>
              <div className="text-sm text-gray-500">View system logs</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;