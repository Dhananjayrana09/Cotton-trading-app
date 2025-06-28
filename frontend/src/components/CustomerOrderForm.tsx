import React, { useState } from 'react';
import { Package, AlertCircle, CheckCircle, Calculator, Send } from 'lucide-react';
import { CustomerOrderAPI } from '../services/api';

interface OrderFormData {
  indent_number: string;
  buyer_type: string;
  bales_quantity: number;
  center_name: string;
  branch: string;
  date: string;
  lifting_period: number;
  fibre_length: number;
  variety: string;
  bid_price: number;
}

interface AllocationData {
  id: string;
  indent_number: string;
  bales_quantity: number;
  center_name: string;
  branch: string;
  variety: string;
  bid_price: number;
  status: string;
}

interface ValidationResult {
  isValid: boolean;
  message: string;
  allocationData?: AllocationData;
  quantityCheck?: {
    requested: number;
    available: number;
    isValid: boolean;
  };
}

const CustomerOrderForm: React.FC = () => {
  const [formData, setFormData] = useState<OrderFormData>({
    indent_number: '',
    buyer_type: 'Mill',
    bales_quantity: 0,
    center_name: '',
    branch: '',
    date: '',
    lifting_period: 30,
    fibre_length: 0,
    variety: '',
    bid_price: 0,
  });

  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [step, setStep] = useState<'form' | 'validation' | 'quantity-check' | 'confirmed'>('form');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const validateOrder = async () => {
    setLoading(true);
    try {
      console.log('Validating order with data:', formData);
      
      // Call the new API for order validation
      const result = await CustomerOrderAPI.validateOrder(formData);
      console.log('Validation result:', result);
      
      setValidationResult(result);
      
      if (result.isValid && result.quantityCheck?.isValid) {
        setStep('confirmed');
      } else {
        setStep('validation');
      }
    } catch (error) {
      console.error('Validation error:', error);
      setValidationResult({
        isValid: false,
        message: 'Failed to validate order. Please try again.',
      });
      setStep('validation');
    } finally {
      setLoading(false);
    }
  };

  const placeOrder = async () => {
    setPlacingOrder(true);
    try {
      console.log('Placing order with data:', formData);
      
      const result = await CustomerOrderAPI.placeOrder(formData);
      console.log('Order placed successfully:', result);
      
      // Show success message and reset form
      alert('Order placed successfully! Order ID: ' + result.order.id);
      resetForm();
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setPlacingOrder(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    validateOrder();
  };

  const resetForm = () => {
    setFormData({
      indent_number: '',
      buyer_type: 'Mill',
      bales_quantity: 0,
      center_name: '',
      branch: '',
      date: '',
      lifting_period: 30,
      fibre_length: 0,
      variety: '',
      bid_price: 0,
    });
    setValidationResult(null);
    setStep('form');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <Package className="h-6 w-6 text-blue-600 mr-2" />
          <h1 className="text-2xl font-bold text-gray-900">Customer Order Entry</h1>
        </div>
        
        {/* Progress Steps */}
        <div className="flex items-center space-x-4 mb-6">
          <div className={`flex items-center ${step === 'form' ? 'text-blue-600' : 'text-green-600'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step === 'form' ? 'bg-blue-100' : 'bg-green-100'
            }`}>
              {step === 'form' ? '1' : <CheckCircle className="h-5 w-5" />}
            </div>
            <span className="ml-2 text-sm font-medium">Enter Order</span>
          </div>
          
          <div className={`w-8 h-1 ${step === 'form' ? 'bg-gray-200' : 'bg-green-500'}`}></div>
          
          <div className={`flex items-center ${
            step === 'validation' || step === 'quantity-check' ? 'text-blue-600' : 
            step === 'confirmed' ? 'text-green-600' : 'text-gray-400'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step === 'validation' || step === 'quantity-check' ? 'bg-blue-100' : 
              step === 'confirmed' ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              {step === 'confirmed' ? <CheckCircle className="h-5 w-5" /> : '2'}
            </div>
            <span className="ml-2 text-sm font-medium">Validate & Check Quantity</span>
          </div>
          
          <div className={`w-8 h-1 ${step === 'confirmed' ? 'bg-green-500' : 'bg-gray-200'}`}></div>
          
          <div className={`flex items-center ${step === 'confirmed' ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step === 'confirmed' ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              {step === 'confirmed' ? <CheckCircle className="h-5 w-5" /> : '3'}
            </div>
            <span className="ml-2 text-sm font-medium">Confirmed</span>
          </div>
        </div>
      </div>

      {/* Order Form */}
      {step === 'form' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Indent Number *
                </label>
                <input
                  type="text"
                  name="indent_number"
                  value={formData.indent_number}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter indent number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buyer Type *
                </label>
                <select
                  name="buyer_type"
                  value={formData.buyer_type}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Mill">Mill</option>
                  <option value="Trader">Trader</option>
                  <option value="Exporter">Exporter</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bales Quantity *
                </label>
                <input
                  type="number"
                  name="bales_quantity"
                  value={formData.bales_quantity}
                  onChange={handleInputChange}
                  required
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter bales quantity"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Center Name *
                </label>
                <input
                  type="text"
                  name="center_name"
                  value={formData.center_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter center name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Branch *
                </label>
                <input
                  type="text"
                  name="branch"
                  value={formData.branch}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter branch"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lifting Period (days) *
                </label>
                <input
                  type="number"
                  name="lifting_period"
                  value={formData.lifting_period}
                  onChange={handleInputChange}
                  required
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter lifting period"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fibre Length (mm) *
                </label>
                <input
                  type="number"
                  name="fibre_length"
                  value={formData.fibre_length}
                  onChange={handleInputChange}
                  required
                  step="0.1"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter fibre length"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Variety *
                </label>
                <input
                  type="text"
                  name="variety"
                  value={formData.variety}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter cotton variety"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bid Price (₹) *
                </label>
                <input
                  type="number"
                  name="bid_price"
                  value={formData.bid_price}
                  onChange={handleInputChange}
                  required
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter bid price"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Validating...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Validate Order
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Validation Results */}
      {(step === 'validation' || step === 'quantity-check') && validationResult && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            {validationResult.isValid ? (
              <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
            ) : (
              <AlertCircle className="h-6 w-6 text-red-600 mr-2" />
            )}
            <h2 className="text-xl font-semibold text-gray-900">
              {validationResult.isValid ? 'Validation Successful' : 'Validation Failed'}
            </h2>
          </div>

          <div className={`p-4 rounded-lg border ${
            validationResult.isValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <p className={`text-sm ${
              validationResult.isValid ? 'text-green-700' : 'text-red-700'
            }`}>
              {validationResult.message}
            </p>
          </div>

          {/* Quantity Check Details */}
          {validationResult.quantityCheck && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center mb-2">
                <Calculator className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="font-medium text-blue-900">Quantity Check</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Requested Quantity:</span>
                  <span className="ml-2 font-semibold">{validationResult.quantityCheck.requested} bales</span>
                </div>
                <div>
                  <span className="text-blue-700">Available Quantity:</span>
                  <span className="ml-2 font-semibold">{validationResult.quantityCheck.available} bales</span>
                </div>
              </div>
              <div className={`mt-2 text-sm font-medium ${
                validationResult.quantityCheck.isValid ? 'text-green-700' : 'text-red-700'
              }`}>
                {validationResult.quantityCheck.isValid 
                  ? '✓ Quantity is within available limits' 
                  : '✗ Requested quantity exceeds available stock'}
              </div>
            </div>
          )}

          {/* Allocation Details */}
          {validationResult.allocationData && (
            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">Allocation Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Indent Number:</span>
                  <span className="ml-2 font-medium">{validationResult.allocationData.indent_number}</span>
                </div>
                <div>
                  <span className="text-gray-600">Center:</span>
                  <span className="ml-2 font-medium">{validationResult.allocationData.center_name}</span>
                </div>
                <div>
                  <span className="text-gray-600">Branch:</span>
                  <span className="ml-2 font-medium">{validationResult.allocationData.branch}</span>
                </div>
                <div>
                  <span className="text-gray-600">Variety:</span>
                  <span className="ml-2 font-medium">{validationResult.allocationData.variety}</span>
                </div>
                <div>
                  <span className="text-gray-600">Available Bales:</span>
                  <span className="ml-2 font-medium">{validationResult.allocationData.bales_quantity}</span>
                </div>
                <div>
                  <span className="text-gray-600">Bid Price:</span>
                  <span className="ml-2 font-medium">₹{validationResult.allocationData.bid_price}</span>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end space-x-4">
            <button
              onClick={resetForm}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Start New Order
            </button>
            {validationResult.isValid && validationResult.quantityCheck?.isValid && (
              <button
                onClick={() => setStep('confirmed')}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Proceed to Place Order
              </button>
            )}
          </div>
        </div>
      )}

      {/* Order Confirmed */}
      {step === 'confirmed' && validationResult && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Order Ready for Placement</h2>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-700">
              Your order has been validated and quantity checked successfully. You can now proceed to place the order.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">Order Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Indent Number:</span>
                  <span className="font-medium">{formData.indent_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Buyer Type:</span>
                  <span className="font-medium">{formData.buyer_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bales Quantity:</span>
                  <span className="font-medium">{formData.bales_quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Center:</span>
                  <span className="font-medium">{formData.center_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Branch:</span>
                  <span className="font-medium">{formData.branch}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">Additional Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">{formData.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Lifting Period:</span>
                  <span className="font-medium">{formData.lifting_period} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fibre Length:</span>
                  <span className="font-medium">{formData.fibre_length} mm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Variety:</span>
                  <span className="font-medium">{formData.variety}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bid Price:</span>
                  <span className="font-medium">₹{formData.bid_price}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              onClick={resetForm}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Start New Order
            </button>
            <button
              onClick={placeOrder}
              disabled={placingOrder}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {placingOrder ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Placing Order...
                </>
              ) : (
                <>
                  <Package className="h-4 w-4 mr-2" />
                  Place Order
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerOrderForm;