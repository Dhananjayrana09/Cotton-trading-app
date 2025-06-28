import React, { useState } from 'react';
import { Search, FileText, Building, User, Calendar, Package } from 'lucide-react';
import { ContractAPI } from '../services/contractApi';
import type { ProcurementDetails } from '../types/contract';
import { toast } from 'react-toastify';

interface ContractSearchProps {
  onIndentFound: (details: ProcurementDetails) => void;
}

const ContractSearch: React.FC<ContractSearchProps> = ({ onIndentFound }) => {
  const [indentNumber, setIndentNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<ProcurementDetails | null>(null);

  const handleSearch = async () => {
    if (!indentNumber.trim()) {
      setError('Please enter an indent number');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await ContractAPI.searchIndentNumber(indentNumber.trim());
      
      if (result) {
        setSearchResult(result);
        onIndentFound(result);
      } else {
        setError('No procurement details found for this indent number');
        setSearchResult(null);
      }
    } catch (err: any) {
      // Handle different types of errors
      let errorMessage = 'Failed to search indent number. Please try again.';
      
      if (err.response) {
        // Server responded with error status
        if (err.response.status === 404) {
          errorMessage = err.response.data?.error || 'No procurement details found for this indent number';
        } else if (err.response.status === 400) {
          errorMessage = err.response.data?.error || 'Invalid indent number format';
        } else if (err.response.status === 500) {
          errorMessage = err.response.data?.error || 'Server error occurred. Please try again later.';
        } else {
          errorMessage = err.response.data?.error || errorMessage;
        }
      } else if (err.request) {
        // Network error
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      toast.error(errorMessage);
      setError(errorMessage);
      setSearchResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Search Procurement Details</h2>
        <p className="text-gray-600">Enter an indent number to fetch procurement details and upload purchase contract</p>
      </div>

      {/* Search Input */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Enter Indent Number (e.g., IND2024001)"
            value={indentNumber}
            onChange={(e) => setIndentNumber(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Search Results */}
      {searchResult && (
        <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
          <div className="flex items-center mb-4">
            <FileText className="h-6 w-6 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Procurement Details Found</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center p-3 bg-white rounded-lg border border-gray-200">
              <FileText className="h-5 w-5 text-gray-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Indent Number</p>
                <p className="font-semibold text-gray-900">{searchResult.indent_number}</p>
              </div>
            </div>

            <div className="flex items-center p-3 bg-white rounded-lg border border-gray-200">
              <User className="h-5 w-5 text-gray-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Buyer Type</p>
                <p className="font-semibold text-gray-900">{searchResult.buyer_type}</p>
              </div>
            </div>

            <div className="flex items-center p-3 bg-white rounded-lg border border-gray-200">
              <Building className="h-5 w-5 text-gray-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Buyer Name</p>
                <p className="font-semibold text-gray-900">{searchResult.buyer_name}</p>
              </div>
            </div>

            <div className="flex items-center p-3 bg-white rounded-lg border border-gray-200">
              <Building className="h-5 w-5 text-gray-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Firm Name</p>
                <p className="font-semibold text-gray-900">{searchResult.firm_name}</p>
              </div>
            </div>

            <div className="flex items-center p-3 bg-white rounded-lg border border-gray-200">
              <Building className="h-5 w-5 text-gray-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Center</p>
                <p className="font-semibold text-gray-900">{searchResult.center_name}</p>
              </div>
            </div>

            <div className="flex items-center p-3 bg-white rounded-lg border border-gray-200">
              <Building className="h-5 w-5 text-gray-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Branch</p>
                <p className="font-semibold text-gray-900">{searchResult.branch}</p>
              </div>
            </div>

            <div className="flex items-center p-3 bg-white rounded-lg border border-gray-200">
              <Package className="h-5 w-5 text-gray-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Variety</p>
                <p className="font-semibold text-gray-900">{searchResult.variety}</p>
              </div>
            </div>

            <div className="flex items-center p-3 bg-white rounded-lg border border-gray-200">
              <Package className="h-5 w-5 text-gray-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Bales Quantity</p>
                <p className="font-semibold text-gray-900">{searchResult.bales_quantity.toLocaleString()}</p>
              </div>
            </div>

            <div className="flex items-center p-3 bg-white rounded-lg border border-gray-200">
              <Calendar className="h-5 w-5 text-gray-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Crop Year</p>
                <p className="font-semibold text-gray-900">{searchResult.crop_year}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-blue-700">Offer Price: ₹{searchResult.offer_price.toLocaleString()}</p>
                <p className="text-sm text-blue-700">Bid Price: ₹{searchResult.bid_price.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-700">Lifting Period: {searchResult.lifting_period}</p>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  searchResult.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {searchResult.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractSearch;