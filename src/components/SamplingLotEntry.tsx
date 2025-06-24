import React, { useState, useEffect } from 'react';
import { Plus, Minus, Package, AlertCircle, CheckCircle, Save } from 'lucide-react';
import { SamplingAPI } from '../services/samplingApi';
import type { AllocationData, SamplingCalculation, LotEntry } from '../types/sampling';

interface SamplingLotEntryProps {
  allocationData: AllocationData;
  calculation: SamplingCalculation;
  onSubmissionComplete: (success: boolean, message: string) => void;
}

const SamplingLotEntry: React.FC<SamplingLotEntryProps> = ({ 
  allocationData, 
  calculation,
  onSubmissionComplete 
}) => {
  const [lotEntries, setLotEntries] = useState<LotEntry[]>([]);
  const [validating, setValidating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Initialize lot entries based on calculation
  useEffect(() => {
    const initialEntries: LotEntry[] = Array.from({ length: calculation.total }, (_, index) => ({
      id: `lot-${index + 1}`,
      lot_number: '',
      is_valid: false
    }));
    setLotEntries(initialEntries);
  }, [calculation.total]);

  const handleLotNumberChange = (id: string, value: string) => {
    setLotEntries(prev => prev.map(entry => 
      entry.id === id 
        ? { ...entry, lot_number: value, is_valid: false, error_message: undefined }
        : entry
    ));
    setValidationErrors([]);
  };

  const addLotField = () => {
    const newEntry: LotEntry = {
      id: `lot-${lotEntries.length + 1}`,
      lot_number: '',
      is_valid: false
    };
    setLotEntries(prev => [...prev, newEntry]);
  };

  const removeLotField = (id: string) => {
    if (lotEntries.length > 1) {
      setLotEntries(prev => prev.filter(entry => entry.id !== id));
    }
  };

  const validateLotNumbers = async () => {
    const lotNumbers = lotEntries
      .map(entry => entry.lot_number.trim())
      .filter(lot => lot !== '');

    if (lotNumbers.length === 0) {
      setValidationErrors(['Please enter at least one lot number']);
      return false;
    }

    // Check for duplicates
    const duplicates = lotNumbers.filter((lot, index) => lotNumbers.indexOf(lot) !== index);
    if (duplicates.length > 0) {
      setValidationErrors([`Duplicate lot numbers found: ${duplicates.join(', ')}`]);
      return false;
    }

    setValidating(true);
    setValidationErrors([]);

    try {
      const validationResult = await SamplingAPI.validateLotNumbers(
        allocationData.indent_number,
        lotNumbers,
        allocationData
      );

      if (validationResult.isValid) {
        // Update lot entries with validation status
        setLotEntries(prev => prev.map(entry => ({
          ...entry,
          is_valid: entry.lot_number.trim() !== '',
          error_message: undefined
        })));
        return true;
      } else {
        setValidationErrors(validationResult.errors);
        return false;
      }
    } catch (error) {
      setValidationErrors(['Validation failed. Please try again.']);
      return false;
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async () => {
    const isValid = await validateLotNumbers();
    if (!isValid) return;

    const lotNumbers = lotEntries
      .map(entry => entry.lot_number.trim())
      .filter(lot => lot !== '');

    setSubmitting(true);

    try {
      const result = await SamplingAPI.submitSamplingData(
        allocationData.indent_number,
        lotNumbers,
        allocationData,
        calculation,
        'admin' // In production, this would be the actual user ID
      );

      if (result.success) {
        onSubmissionComplete(true, result.message);
        // Reset form
        setLotEntries(prev => prev.map(entry => ({
          ...entry,
          lot_number: '',
          is_valid: false,
          error_message: undefined
        })));
      } else {
        onSubmissionComplete(false, result.message);
      }
    } catch (error) {
      onSubmissionComplete(false, 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <Package className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Lot Number Entry</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={addLotField}
              className="flex items-center px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Lot
            </button>
          </div>
        </div>
        <p className="text-gray-600">
          Enter lot numbers for sampling. Required: {calculation.total} lots (calculated), 
          Current: {lotEntries.length} fields
        </p>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center mb-2">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <h4 className="font-medium text-red-800">Validation Errors</h4>
          </div>
          <ul className="text-sm text-red-700 space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Lot Entry Fields */}
      <div className="space-y-4 mb-6">
        {lotEntries.map((entry, index) => (
          <div key={entry.id} className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-12 text-center">
              <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
            </div>
            
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder={`Enter lot number ${index + 1}`}
                value={entry.lot_number}
                onChange={(e) => handleLotNumberChange(entry.id, e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  entry.is_valid 
                    ? 'border-green-300 bg-green-50' 
                    : entry.error_message 
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-300'
                }`}
              />
              {entry.is_valid && (
                <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-600" />
              )}
              {entry.error_message && (
                <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-600" />
              )}
            </div>

            {lotEntries.length > 1 && (
              <button
                onClick={() => removeLotField(entry.id)}
                className="flex-shrink-0 p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                title="Remove lot field"
              >
                <Minus className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-6">
        <h4 className="font-medium text-gray-900 mb-3">Entry Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Required Lots:</span>
            <span className="ml-2 font-semibold text-gray-900">{calculation.total}</span>
          </div>
          <div>
            <span className="text-gray-600">Current Fields:</span>
            <span className="ml-2 font-semibold text-gray-900">{lotEntries.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Filled Fields:</span>
            <span className="ml-2 font-semibold text-gray-900">
              {lotEntries.filter(entry => entry.lot_number.trim() !== '').length}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Valid Entries:</span>
            <span className="ml-2 font-semibold text-green-600">
              {lotEntries.filter(entry => entry.is_valid).length}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <button
          onClick={validateLotNumbers}
          disabled={validating || lotEntries.every(entry => entry.lot_number.trim() === '')}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {validating ? 'Validating...' : 'Validate Lots'}
        </button>
        
        <button
          onClick={handleSubmit}
          disabled={submitting || !lotEntries.some(entry => entry.is_valid)}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center"
        >
          {submitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Submitting...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Submit Sampling Data
            </>
          )}
        </button>
      </div>

      {/* Information Panel */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-medium text-blue-900 mb-2">Lot Entry Guidelines</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Each lot number must be unique within this sampling entry</li>
          <li>• Lot numbers will be validated against existing inventory</li>
          <li>• You can add or remove lot fields as needed</li>
          <li>• All data will be saved to the inventory table upon submission</li>
        </ul>
      </div>
    </div>
  );
};

export default SamplingLotEntry;