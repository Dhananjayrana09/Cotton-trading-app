import React, { useState } from 'react';
import { Package, Users, TrendingUp, Clock, CheckCircle, DollarSign } from 'lucide-react';
import SalesOrderForm from '../components/SalesOrderForm';
import SalesAdminDashboard from '../components/SalesAdminDashboard';
import StatsCard from '../components/StatsCard';

const SalesManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'orders' | 'admin'>('orders');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Sales Management</h1>
        <p className="text-gray-600 mt-2">
          Manage sales orders, lot allocations, and contract generation
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Sales"
          value="₹45.2L"
          icon={DollarSign}
          color="blue"
          trend={{ value: 15, label: 'vs last month' }}
        />
        <StatsCard
          title="Pending Orders"
          value="12"
          icon={Clock}
          color="yellow"
          trend={{ value: -8, label: 'vs last week' }}
        />
        <StatsCard
          title="Completed Sales"
          value="156"
          icon={CheckCircle}
          color="green"
          trend={{ value: 12, label: 'vs last month' }}
        />
        <StatsCard
          title="Active Customers"
          value="89"
          icon={Users}
          color="red"
          trend={{ value: 5, label: 'vs last month' }}
        />
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'orders'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Package className="h-4 w-4 mr-2" />
                Sales Orders
              </div>
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'admin'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Admin Dashboard
              </div>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'orders' && <SalesOrderForm />}
          {activeTab === 'admin' && <SalesAdminDashboard />}
        </div>
      </div>

      {/* Information Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Sales Process Flow</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Order Placement:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Enter order details and select customer/broker</li>
              <li>• Fetch available lots from inventory</li>
              <li>• Select and allocate specific lots</li>
              <li>• Submit order for admin review</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Admin Process:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Review and confirm sales orders</li>
              <li>• Block allocated lots in inventory</li>
              <li>• Generate draft and final contracts</li>
              <li>• Send contracts to customers via email</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesManagement;