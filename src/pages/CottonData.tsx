import React, { useState, useEffect } from 'react';
import { Database, Search, Filter, Download, Plus } from 'lucide-react';
import CottonDataTable from '../components/CottonDataTable';
import { CottonTradingAPI } from '../services/api';
import type { CottonTradeData } from '../types/cotton';

const CottonData: React.FC = () => {
  const [data, setData] = useState<CottonTradeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<CottonTradeData | null>(null);

  // Mock data for demonstration
  const mockData: CottonTradeData[] = [
    {
      id: '1',
      indent_number: 'IND2024001',
      buyer_type: 'Mill',
      buyer_name: 'Gujarat Cotton Mills Ltd',
      center_name: 'Ahmedabad',
      branch: 'Gujarat Branch',
      date_of_allocation: '2024-01-15',
      firm_name: 'Riddhi Siddhi Traders',
      variety: 'Shankar-6',
      bales_quantity: 150,
      crop_year: '2023-24',
      offer_price: 6500,
      bid_price: 6450,
      lifting_period: '30 days',
      fibre_length: '28.5mm',
      cotton_fibre_specification: 'Premium Grade',
      ccl_discount: 50,
      created_by: 'system',
      parsing_confidence: 92,
      status: 'approved',
      created_at: '2024-01-15T10:30:00Z',
      updated_at: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      indent_number: 'IND2024002',
      buyer_type: 'Trader',
      buyer_name: 'Maharashtra Cotton Traders',
      center_name: 'Nagpur',
      branch: 'Maharashtra Branch',
      date_of_allocation: '2024-01-15',
      firm_name: 'Sai Cotton Enterprises',
      variety: 'Bt Cotton',
      bales_quantity: 200,
      crop_year: '2023-24',
      offer_price: 6300,
      bid_price: 6250,
      lifting_period: '45 days',
      fibre_length: '27.8mm',
      cotton_fibre_specification: 'Standard Grade',
      ccl_discount: 40,
      created_by: 'system',
      parsing_confidence: 67,
      status: 'needs_review',
      created_at: '2024-01-15T09:45:00Z',
      updated_at: '2024-01-15T09:45:00Z'
    }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // In production, this would fetch from the API
      // const cottonData = await CottonTradingAPI.getCottonTradeData();
      setData(mockData);
    } catch (error) {
      console.error('Error loading cotton data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: CottonTradeData) => {
    setSelectedItem(item);
  };

  const handleView = (item: CottonTradeData) => {
    setSelectedItem(item);
  };

  const filteredData = data.filter(item => {
    const matchesSearch = item.buyer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.firm_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.indent_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cotton Trading Data</h1>
          <p className="text-gray-600 mt-2">Manage and review parsed cotton trading information</p>
        </div>
        <div className="flex space-x-3">
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="h-4 w-4 mr-2" />
            Add Manual Entry
          </button>
          <button className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </button>
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
                placeholder="Search by buyer, firm name, or indent number..."
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
                <option value="approved">Approved</option>
                <option value="needs_review">Needs Review</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center">
            <Database className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-blue-900">{data.length}</div>
              <div className="text-sm text-blue-600">Total Records</div>
            </div>
          </div>
        </div>
        <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
          <div className="flex items-center">
            <Database className="h-8 w-8 text-emerald-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-emerald-900">
                {data.filter(item => item.status === 'approved').length}
              </div>
              <div className="text-sm text-emerald-600">Approved</div>
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="flex items-center">
            <Database className="h-8 w-8 text-yellow-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-yellow-900">
                {data.filter(item => item.status === 'needs_review').length}
              </div>
              <div className="text-sm text-yellow-600">Needs Review</div>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Database className="h-8 w-8 text-gray-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {data.reduce((sum, item) => sum + item.bales_quantity, 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Bales</div>
            </div>
          </div>
        </div>
      </div>

      {/* Cotton Data Table */}
      <CottonDataTable data={filteredData} onEdit={handleEdit} onView={handleView} />

      {/* Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Cotton Trading Details</h3>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Indent Number</label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">{selectedItem.indent_number}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Buyer Information</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.buyer_name}</p>
                  <p className="text-xs text-gray-500">{selectedItem.buyer_type}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Firm Name</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.firm_name}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Center & Branch</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.center_name}</p>
                  <p className="text-xs text-gray-500">{selectedItem.branch}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cotton Variety</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.variety}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fibre Specifications</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.cotton_fibre_specification}</p>
                  <p className="text-xs text-gray-500">Length: {selectedItem.fibre_length}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bales Quantity</label>
                  <p className="mt-1 text-sm text-gray-900 font-semibold">{selectedItem.bales_quantity.toLocaleString()}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Pricing</label>
                  <p className="mt-1 text-sm text-gray-900">Offer: ₹{selectedItem.offer_price.toLocaleString()}</p>
                  <p className="text-sm text-gray-900">Bid: ₹{selectedItem.bid_price.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">CCL Discount: ₹{selectedItem.ccl_discount}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Crop Year</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.crop_year}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Lifting Period</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.lifting_period}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date of Allocation</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.date_of_allocation}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Parsing Confidence</label>
                  <div className="mt-1 flex items-center">
                    <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                      <div 
                        className={`h-2 rounded-full ${selectedItem.parsing_confidence > 80 ? 'bg-emerald-500' : selectedItem.parsing_confidence > 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${selectedItem.parsing_confidence}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">{selectedItem.parsing_confidence}%</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Edit Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CottonData;