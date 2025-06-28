import React, { useState, useEffect } from 'react';
import { Package,  CheckCircle, AlertCircle,} from 'lucide-react';
import { SalesAPI } from '../services/salesApi';
import type { SalesOrder, AvailableLot, CustomerJob, BrokerJob } from '../types/sales';
import { toast } from 'react-toastify';

const SalesOrderForm: React.FC = () => {
  const [orderData, setOrderData] = useState<Partial<SalesOrder>>({
    buyer_type: 'Mill',
    status: 'pending'
  });
  const [availableLots, setAvailableLots] = useState<AvailableLot[]>([]);
  const [selectedLots, setSelectedLots] = useState<string[]>([]);
  const [customers, setCustomers] = useState<CustomerJob[]>([]);
  const [brokers, setBrokers] = useState<BrokerJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'lots' | 'confirmation'>('form');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCustomersAndBrokers();
  }, []);

  const loadCustomersAndBrokers = async () => {
    try {
      const [customersData, brokersData] = await Promise.all([
        SalesAPI.getCustomers(),
        SalesAPI.getBrokers()
      ]);
      setCustomers(customersData);
      setBrokers(brokersData);
    } catch (error) {
      toast.error('Error loading customers and brokers');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setOrderData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleGetOrder = async () => {
    if (!orderData.indent_number) {
      setError('Please enter an indent number');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch available lots for the indent number
      const lots = await SalesAPI.getAvailableLots(orderData.indent_number);
      
      if (lots.length === 0) {
        setError('No available lots found for this indent number');
        return;
      }

      setAvailableLots(lots);
      setStep('lots');
    } catch (error) {
      setError('Failed to fetch available lots. Please try again.');
      toast.error('Error fetching lots');
    } finally {
      setLoading(false);
    }
  };

  const handleLotSelection = (lotNumber: string) => {
    setSelectedLots(prev => 
      prev.includes(lotNumber) 
        ? prev.filter(lot => lot !== lotNumber)
        : [...prev, lotNumber]
    );
  };

  const handleConfirmSelection = () => {
    if (selectedLots.length === 0) {
      setError('Please select at least one lot');
      return;
    }

    const selectedLotData = availableLots.filter(lot => selectedLots.includes(lot.lot_number));
    const totalQuantity = selectedLotData.reduce((sum, lot) => sum + lot.quantity_bales, 0);

    setOrderData(prev => ({
      ...prev,
      bales_quantity: totalQuantity,
      allocated_lots: selectedLots
    }));

    setStep('confirmation');
  };

  const handleSubmitOrder = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await SalesAPI.createSalesOrder({
        ...orderData,
        allocated_lots: selectedLots,
        status: 'pending'
      } as SalesOrder);

      if (result.success) {
        toast.success('Sales order created successfully!');
        // Reset form
        setOrderData({ buyer_type: 'Mill', status: 'pending' });
        setSelectedLots([]);
        setAvailableLots([]);
        setStep('form');
      } else {
        setError(result.message || 'Failed to create sales order');
        toast.error(result.message || 'Failed to create sales order');
      }
    } catch (error) {
      setError('Failed to submit order. Please try again.');
      toast.error('Error submitting order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <Package className="h-6 w-6 text-blue-600 mr-2" />
          <h1 className="text-2xl font-bold text-gray-900">Sales Order Management</h1>
        </div>
        
        {/* Progress Steps */}
        <div className="flex items-center space-x-4 mb-6">
          <div className={`flex items-center ${step === 'form' ? 'text-blue-600' : 'text-green-600'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step === 'form' ? 'bg-blue-100' : 'bg-green-100'
            }`}>
              {step === 'form' ? '1' : <CheckCircle className="h-5 w-5" />}
            </div>
            <span className="ml-2 text-sm font-medium">Order Details</span>
          </div>
          
          <div className={`w-8 h-1 ${step !== 'form' ? 'bg-green-500' : 'bg-gray-200'}`}></div>
          
          <div className={`flex items-center ${
            step === 'lots' ? 'text-blue-600' : 
            step === 'confirmation' ? 'text-green-600' : 'text-gray-400'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step === 'lots' ? 'bg-blue-100' : 
              step === 'confirmation' ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              {step === 'confirmation' ? <CheckCircle className="h-5 w-5" /> : '2'}
            </div>
            <span className="ml-2 text-sm font-medium">Select Lots</span>
          </div>
          
          <div className={`w-8 h-1 ${step === 'confirmation' ? 'bg-green-500' : 'bg-gray-200'}`}></div>
          
          <div className={`flex items-center ${step === 'confirmation' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step === 'confirmation' ? 'bg-blue-100' : 'bg-gray-100'
            }`}>
              3
            </div>
            <span className="ml-2 text-sm font-medium">Confirm Order</span>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Step 1: Order Form */}
      {step === 'form' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Enter Order Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Indent Number *
              </label>
              <div className="flex">
                <input
                  type="text"
                  name="indent_number"
                  value={orderData.indent_number || ''}
                  onChange={handleInputChange}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter indent number"
                />
                <button
                  onClick={handleGetOrder}
                  disabled={loading || !orderData.indent_number}
                  className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Loading...' : 'Get Order'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buyer Type *
              </label>
              <select
                name="buyer_type"
                value={orderData.buyer_type || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Mill">Mill</option>
                <option value="Trader">Trader</option>
                <option value="Exporter">Exporter</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Centre Name *
              </label>
              <input
                type="text"
                name="center_name"
                value={orderData.center_name || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter centre name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Branch *
              </label>
              <input
                type="text"
                name="branch"
                value={orderData.branch || ''}
                onChange={handleInputChange}
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
                value={orderData.date || ''}
                onChange={handleInputChange}
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
                value={orderData.lifting_period || ''}
                onChange={handleInputChange}
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
                value={orderData.fibre_length || ''}
                onChange={handleInputChange}
                step="0.1"
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
                value={orderData.variety || ''}
                onChange={handleInputChange}
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
                value={orderData.bid_price || ''}
                onChange={handleInputChange}
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter bid price"
              />
            </div>
          </div>

          {/* Customer and Broker Selection */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer *
              </label>
              <select
                name="customer_contact"
                onChange={(e) => {
                  const customer = customers.find(c => c.customer_id === e.target.value);
                  setOrderData(prev => ({ ...prev, customer_contact: customer }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Customer</option>
                {customers.map(customer => (
                  <option key={customer.customer_id} value={customer.customer_id}>
                    {customer.customer_name} - {customer.company_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Broker *
              </label>
              <select
                name="broker_contact"
                onChange={(e) => {
                  const broker = brokers.find(b => b.broker_id === e.target.value);
                  setOrderData(prev => ({ 
                    ...prev, 
                    broker_contact: broker,
                    broker_commission: broker?.commission_rate || 0
                  }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Broker</option>
                {brokers.map(broker => (
                  <option key={broker.broker_id} value={broker.broker_id}>
                    {broker.broker_name} - {broker.commission_rate}%
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Lot Selection */}
      {step === 'lots' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Select Available Lots</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {availableLots.map(lot => (
              <div
                key={lot.lot_number}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedLots.includes(lot.lot_number)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleLotSelection(lot.lot_number)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{lot.lot_number}</h3>
                  <input
                    type="checkbox"
                    checked={selectedLots.includes(lot.lot_number)}
                    onChange={() => handleLotSelection(lot.lot_number)}
                    className="h-4 w-4 text-blue-600"
                  />
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Quantity: {lot.quantity_bales} bales</p>
                  <p>Variety: {lot.variety}</p>
                  <p>Fibre Length: {lot.fibre_length}mm</p>
                  <p>Status: <span className="text-green-600">{lot.status}</span></p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Selected: {selectedLots.length} lots, Total Bales: {
                availableLots
                  .filter(lot => selectedLots.includes(lot.lot_number))
                  .reduce((sum, lot) => sum + lot.quantity_bales, 0)
              }
            </div>
            <div className="space-x-3">
              <button
                onClick={() => setStep('form')}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleConfirmSelection}
                disabled={selectedLots.length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Confirm Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Order Confirmation */}
      {step === 'confirmation' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Confirm Sales Order</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Order Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Indent Number:</span>
                  <span className="font-medium">{orderData.indent_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Buyer Type:</span>
                  <span className="font-medium">{orderData.buyer_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Bales:</span>
                  <span className="font-medium">{orderData.bales_quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bid Price:</span>
                  <span className="font-medium">₹{orderData.bid_price?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-medium text-green-600">
                    ₹{((orderData.bales_quantity || 0) * (orderData.bid_price || 0)).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Contact Details</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Customer:</span>
                  <p className="font-medium">{orderData.customer_contact?.customer_name}</p>
                  <p className="text-gray-500">{orderData.customer_contact?.customer_email}</p>
                </div>
                <div>
                  <span className="text-gray-600">Broker:</span>
                  <p className="font-medium">{orderData.broker_contact?.broker_name}</p>
                  <p className="text-gray-500">Commission: {orderData.broker_commission}%</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-medium text-gray-900 mb-3">Selected Lots</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {availableLots
                .filter(lot => selectedLots.includes(lot.lot_number))
                .map(lot => (
                  <div key={lot.lot_number} className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-gray-900">{lot.lot_number}</div>
                    <div className="text-sm text-gray-600">{lot.quantity_bales} bales</div>
                  </div>
                ))}
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={() => setStep('lots')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleSubmitOrder}
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Submitting...' : 'Submit Sales Order'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesOrderForm;