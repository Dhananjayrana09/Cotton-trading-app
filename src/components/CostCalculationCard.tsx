import React from 'react';
import { Calculator, TrendingUp, DollarSign, Receipt } from 'lucide-react';
import type { CostCalculation } from '../types/payment';

interface CostCalculationCardProps {
  calculation: CostCalculation;
  onView?: (calculation: CostCalculation) => void;
}

const CostCalculationCard: React.FC<CostCalculationCardProps> = ({ calculation, onView }) => {
  const taxBreakdown = [
    { label: 'Base Amount', value: calculation.base_amount, color: 'text-gray-900' },
    { label: 'CGST', value: calculation.cgst_amount, rate: calculation.cgst_rate, color: 'text-blue-600' },
    { label: 'SGST', value: calculation.sgst_amount, rate: calculation.sgst_rate, color: 'text-green-600' },
  ];

  if (calculation.igst_amount && calculation.igst_amount > 0) {
    taxBreakdown.push({ 
      label: 'IGST', 
      value: calculation.igst_amount, 
      rate: calculation.igst_rate, 
      color: 'text-purple-600' 
    });
  }

  if (calculation.additional_charges && calculation.additional_charges > 0) {
    taxBreakdown.push({ 
      label: 'Additional Charges', 
      value: calculation.additional_charges, 
      color: 'text-orange-600' 
    });
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Calculator className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Cost Calculation</h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            calculation.calculation_status === 'calculated' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {calculation.calculation_status}
          </span>
          <span className="text-sm text-gray-500">{calculation.zone}</span>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Indent Number:</span>
          <span className="text-sm font-mono text-gray-900">{calculation.indent_number}</span>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {taxBreakdown.map((item, index) => (
          <div key={index} className="flex justify-between items-center py-1">
            <div className="flex items-center">
              <span className="text-sm text-gray-600">{item.label}</span>
              {item.rate !== undefined && (
                <span className="ml-1 text-xs text-gray-400">({item.rate}%)</span>
              )}
            </div>
            <span className={`text-sm font-medium ${item.color}`}>
              ₹{typeof item.value === 'number' ? item.value.toLocaleString() : 'N/A'}
            </span>
          </div>
        ))}
      </div>

      <div className="border-t pt-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Receipt className="h-4 w-4 text-gray-500 mr-1" />
            <span className="text-base font-semibold text-gray-900">Total Amount</span>
          </div>
          <span className="text-lg font-bold text-green-600">
            ₹{typeof calculation.total_amount === 'number' ? calculation.total_amount.toLocaleString() : 'N/A'}
          </span>
        </div>
      </div>

      {calculation.is_inter_state && (
        <div className="mt-3 p-2 bg-blue-50 rounded-md">
          <div className="flex items-center">
            <TrendingUp className="h-4 w-4 text-blue-600 mr-1" />
            <span className="text-xs text-blue-700">Inter-state transaction (IGST applicable)</span>
          </div>
        </div>
      )}

      {onView && (
        <div className="mt-4">
          <button
            onClick={() => onView(calculation)}
            className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            View Details
          </button>
        </div>
      )}
    </div>
  );
};

export default CostCalculationCard;
