import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Search,
  Filter,
  Download,
  Plus,
  Calculator,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns'; // Import date-fns for formatting dates
import StatsCard from '../components/StatsCard';
import PaymentTable from '../components/PaymentTable';
import CostCalculationCard from '../components/CostCalculationCard';
import { PaymentAPI } from '../services/paymentApi';
import type { PaymentTransaction, CostCalculation, PaymentStats } from '../types/payment';

const PaymentDashboard: React.FC = () => {
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [calculations, setCalculations] = useState<CostCalculation[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    total_payments: 0,
    completed_payments: 0,
    pending_payments: 0,
    failed_payments: 0,
    total_amount: 0,
    completed_amount: 0,
    pending_amount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<PaymentTransaction | null>(null);
  const [selectedCalculation, setSelectedCalculation] = useState<CostCalculation | null>(null);

  // Mock data for demonstration
  const mockPayments: PaymentTransaction[] = [
    {
      id: '1',
      payment_id: 'PAY_IND2024001_1705312200000',
      indent_number: 'IND2024001',
      amount: 967500,
      payment_method: 'bank_transfer',
      payment_status: 'completed',
      utr_number: 'UTR123456789',
      payment_date: '2024-01-15T14:30:00Z',
      created_at: '2024-01-15T10:30:00Z',
    },
    {
      id: '2',
      payment_id: 'PAY_IND2024002_1705312800000',
      indent_number: 'IND2024002',
      amount: 1260000,
      payment_method: 'upi',
      payment_status: 'pending',
      created_at: '2024-01-15T11:45:00Z',
    },
    {
      id: '3',
      payment_id: 'PAY_IND2024003_1705313400000',
      indent_number: 'IND2024003',
      amount: 756000,
      payment_method: 'bank_transfer',
      payment_status: 'failed',
      failure_reason: 'Insufficient funds',
      created_at: '2024-01-15T12:15:00Z',
    },
  ];

  const mockCalculations: CostCalculation[] = [
    {
      id: '1',
      indent_number: 'IND2024001',
      base_amount: 900000,
      gst_rate: 7.5,
      cgst_rate: 3.75,
      sgst_rate: 3.75,
      cgst_amount: 33750,
      sgst_amount: 33750,
      gst_amount: 67500,
      total_amount: 967500,
      zone: 'North',
      calculation_status: 'calculated',
      created_at: '2024-01-15T10:00:00Z',
    },
    {
      id: '2',
      indent_number: 'IND2024002',
      base_amount: 1200000,
      gst_rate: 5.0,
      igst_rate: 5.0,
      igst_amount: 60000,
      gst_amount: 60000,
      total_amount: 1260000,
      zone: 'South',
      is_inter_state: true,
      calculation_status: 'calculated',
      created_at: '2024-01-15T11:30:00Z',
      cgst_rate: 0,
      sgst_rate: 0,
      cgst_amount: 0,
      sgst_amount: 0,
    },
  ];

  const mockChartData = [
    { name: 'Completed', value: 15, amount: 2500000, color: '#059669' },
    { name: 'Pending', value: 8, amount: 1200000, color: '#eab308' },
    { name: 'Failed', value: 3, amount: 450000, color: '#dc2626' },
    { name: 'Initiated', value: 2, amount: 300000, color: '#2563eb' },
  ];

  const mockTrendData = [
    { name: 'Mon', completed: 12, pending: 5, failed: 2 },
    { name: 'Tue', completed: 15, pending: 3, failed: 1 },
    { name: 'Wed', completed: 18, pending: 7, failed: 3 },
    { name: 'Thu', completed: 22, pending: 4, failed: 2 },
    { name: 'Fri', completed: 20, pending: 6, failed: 1 },
    { name: 'Sat', completed: 8, pending: 2, failed: 0 },
    { name: 'Sun', completed: 5, pending: 1, failed: 1 },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // In production, these would fetch from the API
      setPayments(mockPayments);
      setCalculations(mockCalculations);
      setStats({
        total_payments: 28,
        completed_payments: 15,
        pending_payments: 10,
        failed_payments: 3,
        total_amount: 4450000,
        completed_amount: 2500000,
        pending_amount: 1500000,
      });
    } catch (error) {
      console.error('Error loading payment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPayment = (payment: PaymentTransaction) => {
    setSelectedPayment(payment);
  };

  const handleRetryPayment = async (payment: PaymentTransaction) => {
    try {
      // In production, this would call the payment retry API
      console.log('Retrying payment:', payment.payment_id);
      // Reload data after retry
      await loadData();
    } catch (error) {
      console.error('Error retrying payment:', error);
    }
  };

  const handleViewCalculation = (calculation: CostCalculation) => {
    setSelectedCalculation(calculation);
  };

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.payment_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.indent_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.utr_number && payment.utr_number.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || payment.payment_status === statusFilter;
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payment Dashboard</h1>
          <p className="text-gray-600 mt-2">Monitor payment processing and cost calculations</p>
        </div>
        <div className="flex space-x-3">
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Calculator className="h-4 w-4 mr-2" />
            Calculate Costs
          </button>
          <button className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Payments"
          value={stats.total_payments}
          icon={CreditCard}
          color="blue"
          trend={{ value: 12, label: 'vs last week' }}
        />
        <StatsCard
          title="Completed Payments"
          value={stats.completed_payments}
          icon={DollarSign}
          color="green"
          trend={{ value: 8, label: 'vs last week' }}
        />
        <StatsCard
          title="Pending Amount"
          value={`₹${(stats.pending_amount / 100000).toFixed(1)}L`}
          icon={TrendingUp}
          color="yellow"
          trend={{ value: -5, label: 'vs last week' }}
        />
        <StatsCard
          title="Failed Payments"
          value={stats.failed_payments}
          icon={AlertTriangle}
          color="red"
          trend={{ value: -20, label: 'vs last week' }}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payment Status Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={mockChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {mockChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [`${value} payments`, name]} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Trends */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mockTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="completed" fill="#059669" name="Completed" />
              <Bar dataKey="pending" fill="#eab308" name="Pending" />
              <Bar dataKey="failed" fill="#dc2626" name="Failed" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cost Calculations */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Recent Cost Calculations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {calculations.map((calculation) => (
            <CostCalculationCard key={calculation.id} calculation={calculation} onView={handleViewCalculation} />
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search by payment ID, indent number, or UTR..."
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
                <option value="pending">Pending</option>
                <option value="initiated">Initiated</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Table */}
      <PaymentTable payments={filteredPayments} onView={handleViewPayment} onRetry={handleRetryPayment} />

      {/* Payment Detail Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Payment Details</h3>
              <button
                onClick={() => setSelectedPayment(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment ID</label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">{selectedPayment.payment_id}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Indent Number</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedPayment.indent_number}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount</label>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    ₹{selectedPayment.amount.toLocaleString()}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                  <p className="mt-1 text-sm text-gray-900 capitalize">
                    {selectedPayment.payment_method.replace('_', ' ')}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span
                    className={`mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedPayment.payment_status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedPayment.payment_status === 'failed'
                        ? 'bg-red-100 text-red-800'
                        : selectedPayment.payment_status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {selectedPayment.payment_status}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">UTR Number</label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">{selectedPayment.utr_number || 'N/A'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Date</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedPayment.payment_date ? format(new Date(selectedPayment.payment_date), 'PPpp') : 'N/A'}
                  </p>
                </div>

                {selectedPayment.failure_reason && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Failure Reason</label>
                    <p className="mt-1 text-sm text-red-600">{selectedPayment.failure_reason}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setSelectedPayment(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              {selectedPayment.payment_status === 'failed' && (
                <button
                  onClick={() => handleRetryPayment(selectedPayment)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Retry Payment
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cost Calculation Detail Modal */}
      {selectedCalculation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Cost Calculation Details</h3>
              <button
                onClick={() => setSelectedCalculation(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Indent Number</label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">{selectedCalculation.indent_number}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Zone</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedCalculation.zone}</p>
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium text-gray-900 mb-3">Tax Breakdown</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Base Amount:</span>
                    <span className="text-sm font-medium">
                      ₹{selectedCalculation.base_amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">CGST ({selectedCalculation.cgst_rate || 0}%):</span>
                    <span className="text-sm font-medium">
                      ₹{(selectedCalculation.cgst_amount || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">SGST ({selectedCalculation.sgst_rate || 0}%):</span>
                    <span className="text-sm font-medium">
                      ₹{(selectedCalculation.sgst_amount || 0).toLocaleString()}
                    </span>
                  </div>
                  {selectedCalculation.igst_amount && selectedCalculation.igst_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">IGST ({selectedCalculation.igst_rate || 0}%):</span>
                      <span className="text-sm font-medium">
                        ₹{(selectedCalculation.igst_amount || 0).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {selectedCalculation.additional_charges && selectedCalculation.additional_charges > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Additional Charges:</span>
                      <span className="text-sm font-medium">
                        ₹{(selectedCalculation.additional_charges || 0).toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between">
                    <span className="text-base font-semibold text-gray-900">Total Amount:</span>
                    <span className="text-base font-bold text-green-600">
                      ₹{selectedCalculation.total_amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedCalculation(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentDashboard;