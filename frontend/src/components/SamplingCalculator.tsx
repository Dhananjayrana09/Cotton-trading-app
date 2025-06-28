import React, { useEffect, useState } from 'react';
import { Calculator, Hash, Plus, Target } from 'lucide-react';
import { SamplingAPI } from '../services/samplingApi';
import type { AllocationData, SamplingCalculation } from '../types/sampling';

interface SamplingCalculatorProps {
  allocationData: AllocationData;
  onCalculationComplete: (calculation: SamplingCalculation) => void;
}

const SamplingCalculator: React.FC<SamplingCalculatorProps> = ({ 
  allocationData, 
  onCalculationComplete 
}) => {
  const [calculation, setCalculation] = useState<SamplingCalculation | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCalculation = async () => {
      if (!allocationData || !allocationData.indent_number || !allocationData.bales_quantity) {
        return;
      }
      
      setLoading(true);
      try {
        const result = await SamplingAPI.calculateLots(allocationData.indent_number, allocationData.bales_quantity);
        setCalculation(result);
        onCalculationComplete(result);
      } catch (error) {
        console.error('Error fetching calculation:', error);
        setCalculation(null);
      } finally {
        setLoading(false);
      }
    };
    fetchCalculation();
  }, [allocationData]);

  if (loading || !calculation) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex items-center justify-center h-32">
        <span className="text-blue-600 animate-spin">Calculating lots...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <Calculator className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">Sampling Calculation</h2>
        </div>
        <p className="text-gray-600">Automatic calculation of required sampling lots based on bales quantity</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Base Calculation */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center mb-2">
            <Hash className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="font-semibold text-blue-900">Base Lots</h3>
          </div>
          <div className="text-2xl font-bold text-blue-900 mb-1">{calculation.base}</div>
          <div className="text-sm text-blue-700">
            Formula: {allocationData.bales_quantity} ÷ 100 = {calculation.base}
          </div>
        </div>

        {/* Extra Calculation */}
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center mb-2">
            <Plus className="h-5 w-5 text-green-600 mr-2" />
            <h3 className="font-semibold text-green-900">Extra Lots</h3>
          </div>
          <div className="text-2xl font-bold text-green-900 mb-1">{calculation.extra}</div>
          <div className="text-sm text-green-700">
            Formula: floor({calculation.base} × 0.2) = {calculation.extra}
            {calculation.extra === 0 && <span className="block">(Minimum 0 applied)</span>}
          </div>
        </div>

        {/* Total Calculation */}
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center mb-2">
            <Target className="h-5 w-5 text-purple-600 mr-2" />
            <h3 className="font-semibold text-purple-900">Total Lots</h3>
          </div>
          <div className="text-2xl font-bold text-purple-900 mb-1">{calculation.total}</div>
          <div className="text-sm text-purple-700">
            Formula: {calculation.base} + {calculation.extra} = {calculation.total}
          </div>
        </div>
      </div>

      {/* Calculation Details */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-3">Calculation Details</h4>
        <div className="space-y-2 text-sm text-gray-700">
          <div className="flex justify-between">
            <span>Bales Quantity:</span>
            <span className="font-medium">{allocationData.bales_quantity.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Base Calculation (Bales ÷ 100):</span>
            <span className="font-medium">{calculation.base} lots</span>
          </div>
          <div className="flex justify-between">
            <span>Extra Calculation (Base × 20%):</span>
            <span className="font-medium">{calculation.extra} lots</span>
          </div>
          <div className="border-t pt-2 flex justify-between font-semibold">
            <span>Total Sampling Lots Required:</span>
            <span className="text-purple-600">{calculation.total} lots</span>
          </div>
        </div>
      </div>

      {/* Information Panel */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-medium text-blue-900 mb-2">Sampling Guidelines</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Base lots are calculated as 1 lot per 100 bales</li>
          <li>• Extra lots are 20% of base lots (minimum 0)</li>
          <li>• You can manually adjust the number of lot fields if needed</li>
          <li>• Each lot requires a unique lot number for tracking</li>
        </ul>
      </div>
    </div>
  );
};

export default SamplingCalculator;
