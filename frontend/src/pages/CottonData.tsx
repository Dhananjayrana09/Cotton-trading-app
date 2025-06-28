import React, { useState, useEffect } from 'react';
import { Database, Search, Filter, Download, Plus } from 'lucide-react';
import CottonDataTable from '../components/CottonDataTable';
import { AllocationAPI, CottonTradingAPI } from '../services/api';
import type { CottonTradeData } from '../types/cotton';

const CottonData: React.FC = () => {
  const [data, setData] = useState<CottonTradeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<CottonTradeData | null>(null);
  const [searchIndent, setSearchIndent] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualForm, setManualForm] = useState<Omit<CottonTradeData, 'id'>>({
    indent_number: '',
    buyer_type: '',
    buyer_name: '',
    center_name: '',
    branch: '',
    date_of_allocation: '',
    firm_name: '',
    variety: '',
    bales_quantity: 0,
    crop_year: '',
    offer_price: 0,
    bid_price: 0,
    lifting_period: '',
    fibre_length: '',
    cotton_fibre_specification: '',
    ccl_discount: 0,
    created_by: '',
    parsing_confidence: 100,
    status: 'pending',
  });
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualLoading, setManualLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [searchTerm, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Loading allocation data...');
      // Fetch all allocations using the new API service
      const allocations = await AllocationAPI.getAllAllocations();
      console.log('Allocation data received:', allocations);
      setData(allocations);
    } catch (error) {
      console.error('Error loading allocation data:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchIndent = async () => {
    if (!searchIndent) return;
    try {
      setLoading(true);
      const allocation = await AllocationAPI.getAllocation(searchIndent);
      setData(allocation ? [allocation] : []);
    } catch (error) {
      console.error('Error fetching allocation by indent:', error);
      setData([]);
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
          <button
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            onClick={() => { setShowManualEntry(true); setManualError(null); }}
          >
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

      {/* Indent Number Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center space-x-2 mb-4">
        <input
          type="text"
          placeholder="Search by Indent Number..."
          value={searchIndent}
          onChange={(e) => setSearchIndent(e.target.value)}
          className="w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          onClick={handleSearchIndent}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Search
        </button>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors"
        >
          Show All
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center">
            <Database className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-blue-900">{(Array.isArray(data) ? data : []).length}</div>
              <div className="text-sm text-blue-600">Total Records</div>
            </div>
          </div>
        </div>
        <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
          <div className="flex items-center">
            <Database className="h-8 w-8 text-emerald-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-emerald-900">
                {(Array.isArray(data) ? data : []).filter(item => item.status === 'approved').length}
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
                {(Array.isArray(data) ? data : []).filter(item => item.status === 'needs_review').length}
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
                {(Array.isArray(data) ? data : []).reduce((sum, item) => sum + (item.bales_quantity || 0), 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Bales</div>
            </div>
          </div>
        </div>
      </div>

      <CottonDataTable data={Array.isArray(data) ? data : []} onEdit={handleEdit} onView={handleView} />

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
                ×</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Indent Number</label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">{selectedItem.indent_number || 'N/A'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Buyer Information</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.buyer_name || 'Unknown'}</p>
                  <p className="text-xs text-gray-500">{selectedItem.buyer_type || 'N/A'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Firm Name</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.firm_name || 'Unknown'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Center & Branch</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.center_name || 'N/A'}</p>
                  <p className="text-xs text-gray-500">{selectedItem.branch || 'N/A'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cotton Variety</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.variety || 'N/A'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fibre Specifications</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.cotton_fibre_specification || 'N/A'}</p>
                  <p className="text-xs text-gray-500">Length: {selectedItem.fibre_length || 'N/A'}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bales Quantity</label>
                  <p className="mt-1 text-sm text-gray-900 font-semibold">{selectedItem.bales_quantity?.toLocaleString() || '0'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Pricing</label>
                  <p className="mt-1 text-sm text-gray-900">Offer: ₹{selectedItem.offer_price?.toLocaleString() || '0'}</p>
                  <p className="text-sm text-gray-900">Bid: ₹{selectedItem.bid_price?.toLocaleString() || '0'}</p>
                  <p className="text-xs text-gray-500">CCL Discount: ₹{selectedItem.ccl_discount || '0'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Crop Year</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.crop_year || 'N/A'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Lifting Period</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.lifting_period || 'N/A'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date of Allocation</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.date_of_allocation || 'N/A'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Parsing Confidence</label>
                  <div className="mt-1 flex items-center">
                    <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                      <div 
                        className={`h-2 rounded-full ${(selectedItem.parsing_confidence || 0) > 80 ? 'bg-emerald-500' : (selectedItem.parsing_confidence || 0) > 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${selectedItem.parsing_confidence || 0}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">{selectedItem.parsing_confidence || 0}%</span>
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

      {/* Manual Entry Modal */}
      {showManualEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Add Manual Cotton Entry</h3>
              <button
                onClick={() => setShowManualEntry(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >×</button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setManualError(null);
                setManualLoading(true);
                // Basic validation
                if (!manualForm.indent_number || !manualForm.buyer_name || !manualForm.firm_name) {
                  setManualError('Indent number, buyer name, and firm name are required.');
                  setManualLoading(false);
                  return;
                }
                try {
                  await CottonTradingAPI.createCottonTradeData(manualForm);
                  setShowManualEntry(false);
                  setManualForm({
                    indent_number: '', buyer_type: '', buyer_name: '', center_name: '', branch: '', date_of_allocation: '', firm_name: '', variety: '', bales_quantity: 0, crop_year: '', offer_price: 0, bid_price: 0, lifting_period: '', fibre_length: '', cotton_fibre_specification: '', ccl_discount: 0, created_by: '', parsing_confidence: 100, status: 'pending',
                  });
                  await loadData();
                } catch (err) {
                  setManualError('Failed to add entry. Please try again.');
                } finally {
                  setManualLoading(false);
                }
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input className="border p-2 rounded" placeholder="Indent Number*" value={manualForm.indent_number} onChange={e => setManualForm(f => ({ ...f, indent_number: e.target.value }))} />
                <input className="border p-2 rounded" placeholder="Buyer Name*" value={manualForm.buyer_name} onChange={e => setManualForm(f => ({ ...f, buyer_name: e.target.value }))} />
                <input className="border p-2 rounded" placeholder="Firm Name*" value={manualForm.firm_name} onChange={e => setManualForm(f => ({ ...f, firm_name: e.target.value }))} />
                <input className="border p-2 rounded" placeholder="Buyer Type" value={manualForm.buyer_type} onChange={e => setManualForm(f => ({ ...f, buyer_type: e.target.value }))} />
                <input className="border p-2 rounded" placeholder="Center Name" value={manualForm.center_name} onChange={e => setManualForm(f => ({ ...f, center_name: e.target.value }))} />
                <input className="border p-2 rounded" placeholder="Branch" value={manualForm.branch} onChange={e => setManualForm(f => ({ ...f, branch: e.target.value }))} />
                <input className="border p-2 rounded" placeholder="Date of Allocation" type="date" value={manualForm.date_of_allocation} onChange={e => setManualForm(f => ({ ...f, date_of_allocation: e.target.value }))} />
                <input className="border p-2 rounded" placeholder="Variety" value={manualForm.variety} onChange={e => setManualForm(f => ({ ...f, variety: e.target.value }))} />
                <input className="border p-2 rounded" placeholder="Bales Quantity" type="number" value={manualForm.bales_quantity} onChange={e => setManualForm(f => ({ ...f, bales_quantity: Number(e.target.value) }))} />
                <input className="border p-2 rounded" placeholder="Crop Year" value={manualForm.crop_year} onChange={e => setManualForm(f => ({ ...f, crop_year: e.target.value }))} />
                <input className="border p-2 rounded" placeholder="Offer Price" type="number" value={manualForm.offer_price} onChange={e => setManualForm(f => ({ ...f, offer_price: Number(e.target.value) }))} />
                <input className="border p-2 rounded" placeholder="Bid Price" type="number" value={manualForm.bid_price} onChange={e => setManualForm(f => ({ ...f, bid_price: Number(e.target.value) }))} />
                <input className="border p-2 rounded" placeholder="Lifting Period" value={manualForm.lifting_period} onChange={e => setManualForm(f => ({ ...f, lifting_period: e.target.value }))} />
                <input className="border p-2 rounded" placeholder="Fibre Length" value={manualForm.fibre_length} onChange={e => setManualForm(f => ({ ...f, fibre_length: e.target.value }))} />
                <input className="border p-2 rounded" placeholder="Cotton Fibre Specification" value={manualForm.cotton_fibre_specification} onChange={e => setManualForm(f => ({ ...f, cotton_fibre_specification: e.target.value }))} />
                <input className="border p-2 rounded" placeholder="CCL Discount" type="number" value={manualForm.ccl_discount} onChange={e => setManualForm(f => ({ ...f, ccl_discount: Number(e.target.value) }))} />
                <input className="border p-2 rounded" placeholder="Created By" value={manualForm.created_by} onChange={e => setManualForm(f => ({ ...f, created_by: e.target.value }))} />
                <select className="border p-2 rounded" value={manualForm.status} onChange={e => setManualForm(f => ({ ...f, status: e.target.value as any }))}>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="needs_review">Needs Review</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              {manualError && <div className="text-red-600 text-sm">{manualError}</div>}
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowManualEntry(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={manualLoading}
                >Cancel</button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  disabled={manualLoading}
                >{manualLoading ? 'Saving...' : 'Save Entry'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CottonData;