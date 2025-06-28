import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  Clock, 
  FileText,
  User,
  Building,
  Calendar,
  Package,
  DollarSign,
  Send
} from 'lucide-react';
import { format } from 'date-fns';
import { SalesAPI } from '../services/salesApi';
import type { SalesOrder } from '../types/sales';
import { toast } from 'react-toastify';

const SalesAdminDashboard: React.FC = () => {
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    loadPendingSalesOrders();
  }, []);

  const loadPendingSalesOrders = async () => {
    try {
      const orders = await SalesAPI.getPendingSalesOrders();
      setSalesOrders(orders);
    } catch (error) {
      toast.error('Error loading sales orders');
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = (order: SalesOrder) => {
    setSelectedOrder(order);
    setAdminNotes(order.admin_notes || '');
  };

  const handleConfirmSale = async (order: SalesOrder) => {
    setActionLoading(order.id);
    try {
      await SalesAPI.confirmSale({
        sale_id: order.id,
        indent_number: order.indent_number,
        quantity: order.bales_quantity,
        customer_email: order.customer_contact?.customer_email || ""
      });
      await loadPendingSalesOrders();
      setSelectedOrder(null);
      setAdminNotes('');
      toast.success('Sale confirmed successfully! Contract generation initiated.');
    } catch (error) {
      toast.error('Failed to confirm sale. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectSale = async (order: SalesOrder) => {
    const rejectionReason = window.prompt('Please provide a reason for rejection:');
    if (!rejectionReason) return;

    setActionLoading(order.id);
    
    try {
      await SalesAPI.updateSalesOrderStatus(order.id, 'cancelled', rejectionReason);
      
      // Refresh the orders list
      await loadPendingSalesOrders();
      setSelectedOrder(null);
      
      toast.success('Sale rejected successfully!');
    } catch (error) {
      toast.error('Failed to reject sale. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusIcon = (status: SalesOrder['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'admin_review':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-blue-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadgeClass = (status: SalesOrder['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'admin_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
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
        <h1 className="text-3xl font-bold text-gray-900">Sales Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Review and approve sales orders</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-blue-900">
                {salesOrders.filter(order => order.status === 'pending').length}
              </div>
              <div className="text-sm text-blue-600">Pending Review</div>
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="flex items-center">
            <Eye className="h-8 w-8 text-yellow-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-yellow-900">
                {salesOrders.filter(order => order.status === 'admin_review').length}
              </div>
              <div className="text-sm text-yellow-600">Under Review</div>
            </div>
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-green-900">0</div>
              <div className="text-sm text-green-600">Confirmed Today</div>
            </div>
          </div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-purple-900">
                ₹{salesOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0).toLocaleString()}
              </div>
              <div className="text-sm text-purple-600">Total Value</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Orders Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Pending Sales Orders</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer & Broker
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity & Value
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
              {salesOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{order.indent_number}</div>
                      <div className="text-sm text-gray-500">{order.buyer_type} - {order.variety}</div>
                      <div className="text-sm text-gray-500">{order.center_name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-gray-900">{order.customer_contact?.customer_name}</div>
                      <div className="text-sm text-gray-500">{order.broker_contact?.broker_name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{order.bales_quantity} bales</div>
                      <div className="text-sm text-gray-500">₹{order.total_amount?.toLocaleString()}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(order.status)}
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(order.status)}`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleViewOrder(order)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {salesOrders.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No sales orders pending review</p>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Sales Order Review</h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Order Details */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Order Information</h4>
                  <div className="space-y-3">
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <FileText className="h-5 w-5 text-gray-500 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Indent Number</p>
                        <p className="font-semibold text-gray-900">{selectedOrder.indent_number}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <Package className="h-5 w-5 text-gray-500 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Quantity & Variety</p>
                        <p className="font-semibold text-gray-900">{selectedOrder.bales_quantity} bales - {selectedOrder.variety}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <DollarSign className="h-5 w-5 text-gray-500 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Total Amount</p>
                        <p className="font-semibold text-gray-900">₹{selectedOrder.total_amount?.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <Calendar className="h-5 w-5 text-gray-500 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Order Date</p>
                        <p className="font-semibold text-gray-900">
                          {format(new Date(selectedOrder.created_at), 'PPpp')}
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
                    placeholder="Add any notes about this sales order..."
                  />
                </div>
              </div>

              {/* Contact Details */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Contact Information</h4>
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center mb-2">
                        <User className="h-5 w-5 text-blue-600 mr-2" />
                        <h5 className="font-medium text-blue-900">Customer</h5>
                      </div>
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">{selectedOrder.customer_contact?.customer_name}</p>
                        <p className="text-gray-600">{selectedOrder.customer_contact?.company_name}</p>
                        <p className="text-gray-600">{selectedOrder.customer_contact?.customer_email}</p>
                        <p className="text-gray-600">{selectedOrder.customer_contact?.customer_phone}</p>
                      </div>
                    </div>

                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center mb-2">
                        <Building className="h-5 w-5 text-green-600 mr-2" />
                        <h5 className="font-medium text-green-900">Broker</h5>
                      </div>
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">{selectedOrder.broker_contact?.broker_name}</p>
                        <p className="text-gray-600">{selectedOrder.broker_contact?.broker_email}</p>
                        <p className="text-gray-600">Commission: {selectedOrder.broker_commission}%</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Allocated Lots */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Allocated Lots</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {selectedOrder.allocated_lots?.map((lot, index) => (
                      <div key={index} className="p-2 bg-gray-50 rounded border">
                        <div className="text-sm font-medium text-gray-900">{lot}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              
              <button
                onClick={() => handleRejectSale(selectedOrder)}
                disabled={actionLoading === selectedOrder.id}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </button>
              
              <button
                onClick={() => handleConfirmSale(selectedOrder)}
                disabled={actionLoading === selectedOrder.id}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center"
              >
                {actionLoading === selectedOrder.id ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Confirm Sale
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesAdminDashboard;