import React, { useState, useEffect } from 'react';
import { Mail, Search, Filter, Download } from 'lucide-react';
import EmailLogsTable from '../components/EmailLogsTable';
import { CottonTradingAPI } from '../services/api';
import type { EmailLog } from '../types/cotton';

const EmailLogs: React.FC = () => {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    received: 0,
    processed: 0,
    pending_review: 0,
    failed: 0
  });

  useEffect(() => {
    loadLogs();
    loadStats();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const logsData = await CottonTradingAPI.getEmailLogs();
      setLogs(Array.isArray(logsData) ? logsData : []);
    } catch (error) {
      console.error('Error loading logs:', error);
      // Fallback to empty array if API fails
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await CottonTradingAPI.getParsingStats();
      // The backend returns stats in the format we need directly
      setStats({
        total: statsData.total || 0,
        received: statsData.received || 0,
        processed: statsData.processed || 0,
        pending_review: statsData.pending_review || 0,
        failed: statsData.failed || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      // Calculate stats from logs if API fails
      const calculatedStats = {
        total: logs.length,
        received: logs.filter(log => log.processing_status === 'received').length,
        processed: logs.filter(log => log.processing_status === 'processed').length,
        pending_review: logs.filter(log => log.processing_status === 'pending_review').length,
        failed: logs.filter(log => log.processing_status === 'failed').length
      };
      setStats(calculatedStats);
    }
  };

  const handleViewDetails = (log: EmailLog) => {
    setSelectedLog(log);
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.email_subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.sender_email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || log.processing_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Email Processing Logs</h1>
          <p className="text-gray-600 mt-2">Monitor incoming emails and their processing status</p>
        </div>
        <button 
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          onClick={loadLogs}
        >
          <Download className="h-4 w-4 mr-2" />
          Refresh Logs
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search emails..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="received">Received</option>
                <option value="processed">Processed</option>
                <option value="pending_review">Pending Review</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center">
            <Mail className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
              <div className="text-sm text-blue-600">Total Emails</div>
            </div>
          </div>
        </div>
        <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
          <div className="flex items-center">
            <Mail className="h-8 w-8 text-emerald-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-emerald-900">{stats.processed}</div>
              <div className="text-sm text-emerald-600">Processed</div>
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="flex items-center">
            <Mail className="h-8 w-8 text-yellow-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-yellow-900">{stats.pending_review}</div>
              <div className="text-sm text-yellow-600">Pending Review</div>
            </div>
          </div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="flex items-center">
            <Mail className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-red-900">{stats.failed}</div>
              <div className="text-sm text-red-600">Failed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Email Logs Table */}
      <EmailLogsTable logs={filteredLogs} onViewDetails={handleViewDetails} />

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Email Details</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Subject</label>
                <p className="mt-1 text-sm text-gray-900">{selectedLog.email_subject}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Sender</label>
                <p className="mt-1 text-sm text-gray-900">{selectedLog.sender_email}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Received At</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(selectedLog.received_at).toLocaleString()}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  selectedLog.processing_status === 'processed' ? 'bg-green-100 text-green-800' :
                  selectedLog.processing_status === 'pending_review' ? 'bg-yellow-100 text-yellow-800' :
                  selectedLog.processing_status === 'failed' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {selectedLog.processing_status}
                </span>
              </div>
              
              {selectedLog.parsing_confidence && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Parsing Confidence</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedLog.parsing_confidence}%</p>
                </div>
              )}
              
              {selectedLog.has_pdf && selectedLog.pdf_filename && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">PDF File</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedLog.pdf_filename}</p>
                  {selectedLog.pdf_s3_url && (
                    <a 
                      href={selectedLog.pdf_s3_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View PDF
                    </a>
                  )}
                </div>
              )}
              
              {selectedLog.error_message && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Error Message</label>
                  <p className="mt-1 text-sm text-red-600">{selectedLog.error_message}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailLogs;