import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  Send, 
  Clock, 
  FileText,
  User,
  Building,
  Calendar,
  Download
} from 'lucide-react';
import { format } from 'date-fns';
import { ContractAPI } from '../services/contractApi';
import type { PurchaseContract, ContractAuditLog } from '../types/contract';
import { toast } from 'react-toastify';

const AdminContractDashboard: React.FC = () => {
  const [contracts, setContracts] = useState<PurchaseContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<PurchaseContract | null>(null);
  const [auditLogs, setAuditLogs] = useState<ContractAuditLog[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    loadPendingContracts();
  }, []);

  const loadPendingContracts = async () => {
    try {
      const pendingContracts = await ContractAPI.getPendingApprovals();
      setContracts(Array.isArray(pendingContracts) ? pendingContracts : []);
    } catch (error) {
      toast.error('Error loading contracts');
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = async (indentNumber: string) => {
    try {
      const logs = await ContractAPI.getAuditLogs(indentNumber);
      setAuditLogs(logs);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    }
  };

  const handleViewContract = async (contract: PurchaseContract) => {
    setSelectedContract(contract);
    await loadAuditLogs(contract.indent_number);
  };

  const handleApproveContract = async (contract: PurchaseContract) => {
    setActionLoading(contract.id);
    
    try {
      // Update contract status to approved
      await ContractAPI.updateContractStatus(
        contract.id,
        'approved',
        adminNotes,
        'admin' // In production, this would be the actual admin user ID
      );

      // Trigger n8n workflow to send email to branch
      const response = await fetch(`${import.meta.env.VITE_N8N_WEBHOOK_URL}/contract-approval`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contract_id: contract.id,
          indent_number: contract.indent_number,
          firm_name: contract.firm_name,
          contract_url: contract.contract_s3_url,
          admin_notes: adminNotes
        }),
      });

      if (response.ok) {
        // Refresh the contracts list
        await loadPendingContracts();
        setSelectedContract(null);
        setAdminNotes('');
        toast.success('Contract approved and sent to branch successfully!');
      } else {
        throw new Error('Failed to send contract to branch');
      }
    } catch (error) {
      toast.error('Failed to approve contract. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectContract = async (contract: PurchaseContract) => {
    const rejectionReason = window.prompt('Please provide a reason for rejection:');
    if (!rejectionReason) return;

    setActionLoading(contract.id);
    
    try {
      await ContractAPI.updateContractStatus(
        contract.id,
        'rejected',
        rejectionReason,
        'admin'
      );

      // Refresh the contracts list
      await loadPendingContracts();
      setSelectedContract(null);
      
      toast.success('Contract rejected successfully!');
    } catch (error) {
      toast.error('Failed to reject contract. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusIcon = (status: PurchaseContract['upload_status']) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'pending_approval':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadgeClass = (status: PurchaseContract['upload_status']) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending_approval':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Contract Approval Dashboard</h1>
        <p className="text-gray-600 mt-2">Review and approve purchase contracts</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-yellow-900">{contracts.length}</div>
              <div className="text-sm text-yellow-600">Pending Approval</div>
            </div>
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-green-900">0</div>
              <div className="text-sm text-green-600">Approved Today</div>
            </div>
          </div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-blue-900">{contracts.length}</div>
              <div className="text-sm text-blue-600">Total Contracts</div>
            </div>
          </div>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Pending Contract Approvals</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contract Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Firm Information
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Upload Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {contracts.map((contract) => (
                <tr key={contract.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{contract.indent_number}</div>
                      <div className="text-sm text-gray-500">{contract.contract_filename}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{contract.firm_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-gray-900">By: {contract.uploaded_by}</div>
                      <div className="text-sm text-gray-500">
                        {format(new Date(contract.uploaded_at), 'MMM dd, yyyy HH:mm')}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(contract.upload_status)}
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(contract.upload_status)}`}>
                        {contract.upload_status.replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewContract(contract)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <a
                        href={contract.contract_s3_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-900"
                        title="Download Contract"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {contracts.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No contracts pending approval</p>
          </div>
        )}
      </div>

      {/* Contract Detail Modal */}
      {selectedContract && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Contract Review</h3>
              <button
                onClick={() => setSelectedContract(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Contract Details */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Contract Information</h4>
                  <div className="space-y-3">
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <FileText className="h-5 w-5 text-gray-500 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Indent Number</p>
                        <p className="font-semibold text-gray-900">{selectedContract.indent_number}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <Building className="h-5 w-5 text-gray-500 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Firm Name</p>
                        <p className="font-semibold text-gray-900">{selectedContract.firm_name}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <User className="h-5 w-5 text-gray-500 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Uploaded By</p>
                        <p className="font-semibold text-gray-900">{selectedContract.uploaded_by}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <Calendar className="h-5 w-5 text-gray-500 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Upload Date</p>
                        <p className="font-semibold text-gray-900">
                          {format(new Date(selectedContract.uploaded_at), 'PPpp')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Admin Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Notes (Optional)
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Add any notes about this contract approval..."
                  />
                </div>
              </div>

              {/* Audit Logs */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Activity Log</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{log.action}</p>
                          <p className="text-xs text-gray-600">By: {log.performed_by}</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          {format(new Date(log.timestamp), 'MMM dd, HH:mm')}
                        </p>
                      </div>
                      {log.details && (
                        <div className="mt-2 text-xs text-gray-600">
                          {JSON.stringify(log.details, null, 2)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setSelectedContract(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              
              <button
                onClick={() => handleRejectContract(selectedContract)}
                disabled={actionLoading === selectedContract.id}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </button>
              
              <button
                onClick={() => handleApproveContract(selectedContract)}
                disabled={actionLoading === selectedContract.id}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center"
              >
                {actionLoading === selectedContract.id ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Approve & Send
                  </>
                )}
              </button>
            </div>

            {/* Contract Preview */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-blue-900">Contract Document</p>
                  <p className="text-sm text-blue-700">{selectedContract.contract_filename}</p>
                </div>
                <a
                  href={selectedContract.contract_s3_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  View Contract
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminContractDashboard;