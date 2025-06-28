import React, { useState, useEffect } from 'react';
import { Calculator, X } from 'lucide-react';
import { PaymentAPI } from '../services/paymentApi';
import type { ZoneTaxRate } from '../types/payment';

interface CostCalculationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onCalculationComplete: () => void;
}

const CostCalculationForm: React.FC<CostCalculationFormProps> = ({
  isOpen,
  onClose,
  onCalculationComplete,
}) => {
  const [formData, setFormData] = useState({
    indent_number: '',
    base_amount: '',
    zone: 'South',
    is_inter_state: false,
  });
  const [taxRates, setTaxRates] = useState<ZoneTaxRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [calculation, setCalculation] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      loadTaxRates();
    }
  }, [isOpen]);

  const loadTaxRates = async () => {
    try {
      const rates = await PaymentAPI.getZoneTaxRates();
      setTaxRates(Array.isArray(rates) ? rates : []);
    } catch (error) {
      console.error('Error loading tax rates:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleCalculate = async () => {
    if (!formData.indent_number || !formData.base_amount) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const baseAmount = parseFloat(formData.base_amount);
      const selectedZone = taxRates.find(rate => rate.zone === formData.zone) || {
        zone: formData.zone,
        cgst_rate: 2.5,
        sgst_rate: 2.5,
        igst_rate: 5,
        additional_tax: 0,
        effective_from: new Date().toISOString(),
      };

      const calculatedCosts = PaymentAPI.calculateCosts(
        baseAmount,
        formData.zone,
        selectedZone,
        formData.is_inter_state
      );

      setCalculation({
        ...calculatedCosts,
        indent_number: formData.indent_number,
      });
    } catch (error) {
      console.error('Error calculating costs:', error);
      alert('Failed to calculate costs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!calculation) return;

    setLoading(true);
    try {
      await PaymentAPI.createCostCalculation(calculation);
      alert('Cost calculation saved successfully!');
      onCalculationComplete();
      onClose();
      setCalculation(null);
      setFormData({
        indent_number: '',
        base_amount: '',
        zone: 'South',
        is_inter_state: false,
      });
    } catch (error) {
      console.error('Error saving calculation:', error);
      alert('Failed to save calculation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <Calculator className="h-5 w-5 mr-2" />
            Cost Calculation
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {!calculation ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Indent Number *
              </label>
              <input
                type="text"
                name="indent_number"
                value={formData.indent_number}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter indent number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Base Amount (₹) *
              </label>
              <input
                type="number"
                name="base_amount"
                value={formData.base_amount}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter base amount"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Zone
              </label>
              <select
                name="zone"
                value={formData.zone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {taxRates.map((rate) => (
                  <option key={rate.zone} value={rate.zone}>
                    {rate.zone}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_inter_state"
                checked={formData.is_inter_state}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Inter-state transaction
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCalculate}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Calculating...' : 'Calculate'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-medium text-gray-900 mb-3">Calculation Results</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Base Amount:</span>
                  <span className="text-sm font-medium">
                    ₹{calculation.base_amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">CGST ({calculation.cgst_rate}%):</span>
                  <span className="text-sm font-medium">
                    ₹{calculation.cgst_amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">SGST ({calculation.sgst_rate}%):</span>
                  <span className="text-sm font-medium">
                    ₹{calculation.sgst_amount.toLocaleString()}
                  </span>
                </div>
                {calculation.igst_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">IGST ({calculation.igst_rate}%):</span>
                    <span className="text-sm font-medium">
                      ₹{calculation.igst_amount.toLocaleString()}
                    </span>
                  </div>
                )}
                {calculation.additional_charges > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Additional Charges:</span>
                    <span className="text-sm font-medium">
                      ₹{calculation.additional_charges.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between">
                  <span className="text-base font-semibold text-gray-900">Total Amount:</span>
                  <span className="text-base font-bold text-green-600">
                    ₹{calculation.total_amount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setCalculation(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Calculation'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CostCalculationForm; 