import React, { useState } from 'react';
import { Package, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import SamplingSearch from '../components/SamplingSearch';
import SamplingCalculator from '../components/SamplingCalculator';
import SamplingLotEntry from '../components/SamplingLotEntry';
import type { AllocationData, SamplingCalculation } from '../types/sampling';

const SamplingEntry: React.FC = () => {
  const [allocationData, setAllocationData] = useState<AllocationData | null>(null);
  const [calculation, setCalculation] = useState<SamplingCalculation | null>(null);
  const [submissionResult, setSubmissionResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleAllocationFound = (allocation: AllocationData) => {
    setAllocationData(allocation);
    setCalculation(null);
    setSubmissionResult(null);
  };

  const handleCalculationComplete = (calc: SamplingCalculation) => {
    setCalculation(calc);
  };

  const handleSubmissionComplete = (success: boolean, message: string) => {
    setSubmissionResult({ success, message });
  };

  const resetProcess = () => {
    setAllocationData(null);
    setCalculation(null);
    setSubmissionResult(null);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Sampling Entry</h1>
        <p className="text-gray-600 mt-2">
          Enter sampling data for cotton allocation lots with automated calculation and validation
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          {/* Step 1: Search */}
          <div className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              allocationData ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
            }`}>
              <Package className="h-4 w-4" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Search Allocation</p>
              <p className="text-xs text-gray-500">Find indent details</p>
            </div>
          </div>

          <ArrowRight className={`h-5 w-5 ${allocationData ? 'text-green-500' : 'text-gray-300'}`} />

          {/* Step 2: Calculate */}
          <div className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              calculation ? 'bg-green-500 text-white' : 
              allocationData ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-500'
            }`}>
              <Package className="h-4 w-4" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Calculate Lots</p>
              <p className="text-xs text-gray-500">Auto calculation</p>
            </div>
          </div>

          <ArrowRight className={`h-5 w-5 ${calculation ? 'text-green-500' : 'text-gray-300'}`} />

          {/* Step 3: Entry */}
          <div className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              submissionResult?.success ? 'bg-green-500 text-white' : 
              calculation ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-500'
            }`}>
              <Package className="h-4 w-4" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Enter Lots</p>
              <p className="text-xs text-gray-500">Input lot numbers</p>
            </div>
          </div>

          <ArrowRight className={`h-5 w-5 ${submissionResult?.success ? 'text-green-500' : 'text-gray-300'}`} />

          {/* Step 4: Complete */}
          <div className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              submissionResult?.success ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-500'
            }`}>
              <CheckCircle className="h-4 w-4" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Complete</p>
              <p className="text-xs text-gray-500">Data saved</p>
            </div>
          </div>
        </div>
      </div>

      {/* Step 1: Search Component */}
      <SamplingSearch onAllocationFound={handleAllocationFound} />

      {/* Step 2: Calculation Component */}
      {allocationData && (
        <SamplingCalculator 
          allocationData={allocationData}
          onCalculationComplete={handleCalculationComplete}
        />
      )}

      {/* Step 3: Lot Entry Component */}
      {allocationData && calculation && (
        <SamplingLotEntry
          allocationData={allocationData}
          calculation={calculation}
          onSubmissionComplete={handleSubmissionComplete}
        />
      )}

      {/* Submission Result */}
      {submissionResult && (
        <div className={`p-6 rounded-lg border ${
          submissionResult.success 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center">
            {submissionResult.success ? (
              <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
            ) : (
              <AlertCircle className="h-6 w-6 text-red-600 mr-3" />
            )}
            <div>
              <h3 className={`text-lg font-semibold ${
                submissionResult.success ? 'text-green-900' : 'text-red-900'
              }`}>
                {submissionResult.success ? 'Sampling Entry Successful!' : 'Sampling Entry Failed'}
              </h3>
              <p className={`mt-1 ${
                submissionResult.success ? 'text-green-700' : 'text-red-700'
              }`}>
                {submissionResult.message}
              </p>
            </div>
          </div>
          
          {submissionResult.success && (
            <div className="mt-4 p-4 bg-white rounded-lg border border-green-200">
              <h4 className="font-medium text-green-900 mb-2">Next Steps:</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Sampling data has been saved to the inventory table</li>
                <li>• Audit log has been created for tracking</li>
                <li>• Lot numbers are now available for further processing</li>
                <li>• You can view the inventory in the inventory management section</li>
              </ul>
            </div>
          )}

          <div className="mt-4">
            <button
              onClick={resetProcess}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Start New Sampling Entry
            </button>
          </div>
        </div>
      )}

      {/* Information Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Sampling Entry Process</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Process Flow:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Search for allocation by indent number</li>
              <li>• System calculates required sampling lots</li>
              <li>• Enter lot numbers for each sample</li>
              <li>• Validate and submit to inventory</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Calculation Rules:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Base lots = Bales quantity ÷ 100</li>
              <li>• Extra lots = Base lots × 20% (min 0)</li>
              <li>• Total lots = Base + Extra</li>
              <li>• Manual adjustment allowed</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SamplingEntry;