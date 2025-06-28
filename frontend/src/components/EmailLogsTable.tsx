import React from 'react';
import { format } from 'date-fns';
import { CheckCircle, XCircle, Clock, AlertTriangle, FileText, ExternalLink } from 'lucide-react';
import type { EmailLog } from '../types/cotton';

interface EmailLogsTableProps {
  logs: EmailLog[];
  onViewDetails: (log: EmailLog) => void;
}

const EmailLogsTable: React.FC<EmailLogsTableProps> = ({ logs, onViewDetails }) => {
  const getStatusIcon = (status: EmailLog['processing_status']) => {
    switch (status) {
      case 'processed':
        return <CheckCircle className="h-5 w-5 text-emerald-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'pending_review':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'received':
        return <Clock className="h-5 w-5 text-blue-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: EmailLog['processing_status']) => {
    switch (status) {
      case 'processed':
        return 'Processed';
      case 'failed':
        return 'Failed';
      case 'pending_review':
        return 'Needs Review';
      case 'received':
        return 'Received';
      default:
        return 'Unknown';
    }
  };

  const getStatusBadgeClass = (status: EmailLog['processing_status']) => {
    switch (status) {
      case 'processed':
        return 'bg-emerald-100 text-emerald-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'received':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Email Processing Logs</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                PDF
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Confidence
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Received
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{log.email_subject}</div>
                    <div className="text-sm text-gray-500">{log.sender_email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {getStatusIcon(log.processing_status)}
                    <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(log.processing_status)}`}>
                      {getStatusText(log.processing_status)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {log.has_pdf ? (
                      <div className="flex items-center text-emerald-600">
                        <FileText className="h-4 w-4 mr-1" />
                        <span className="text-sm">Available</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">No PDF</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {log.parsing_confidence !== null && log.parsing_confidence !== undefined ? (
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className={`h-2 rounded-full ${log.parsing_confidence > 80 ? 'bg-emerald-500' : log.parsing_confidence > 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${log.parsing_confidence}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{log.parsing_confidence}%</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">N/A</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {format(new Date(log.received_at), 'MMM dd, yyyy HH:mm')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => onViewDetails(log)}
                    className="text-blue-600 hover:text-blue-900 flex items-center"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmailLogsTable;