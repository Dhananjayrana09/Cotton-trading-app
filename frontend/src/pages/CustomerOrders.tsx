import React from 'react';
import { Package, ShoppingCart, TrendingUp, Clock } from 'lucide-react';
import CustomerOrderForm from '../components/CustomerOrderForm';
import StatsCard from '../components/StatsCard';

const CustomerOrders: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Customer Orders</h1>
        <p className="text-gray-600 mt-2">
          Manage customer orders with automated validation and quantity checking
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Orders"
          value="156"
          icon={ShoppingCart}
          color="blue"
          trend={{ value: 12, label: 'vs last week' }}
        />
        <StatsCard
          title="Validated Orders"
          value="142"
          icon={Package}
          color="green"
          trend={{ value: 8, label: 'vs last week' }}
        />
        <StatsCard
          title="Pending Orders"
          value="14"
          icon={Clock}
          color="yellow"
          trend={{ value: -5, label: 'vs last week' }}
        />
        <StatsCard
          title="Order Value"
          value="₹45.2L"
          icon={TrendingUp}
          color="blue"
          trend={{ value: 15, label: 'vs last week' }}
        />
      </div>

      {/* Order Form */}
      <CustomerOrderForm />

      {/* Information Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Order Processing Flow</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Validation Steps:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Check if indent number exists in allocation table</li>
              <li>• Validate order details against allocation data</li>
              <li>• Verify requested quantity ≤ available quantity</li>
              <li>• Confirm center, branch, variety, and price match</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Next Steps:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Place validated order</li>
              <li>• Generate sales contract PDF</li>
              <li>• Process payment</li>
              <li>• Send contract to customer</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerOrders;