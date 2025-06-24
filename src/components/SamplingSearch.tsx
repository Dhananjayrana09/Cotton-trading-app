import React, { useState } from 'react';
import { Search, Package, Building, Calendar, Ruler, Wheat, DollarSign } from 'lucide-react';
import { SamplingAPI } from '../services/samplingApi';
import type { AllocationData } from '../types/sampling';

interface SamplingSearchProps {
  onAllocationFound: (allocation: AllocationData) => void;
}

const SamplingSearch: React.FC<SamplingSearchProps> = ({ onAllocationFound }) => {
  const [indentNumber, setIndentNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<AllocationData | null>(null);

  const handleSearch = async () => {
    if (!indentNumber.trim()) {
      setError('Please enter an indent number');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await SamplingAPI.searchAllocation(indentNumber.trim());
      
      if (result) {
        setSearchResult(result);
        onAllocationFound(result);
      } else {
        setError('Indent not found in allocation table');
        setSearchResult(null);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search indent number. Please try again.');
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
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Search Allocation</h2>
        <p className="text-gray-600">Enter an indent number to fetch allocation details for sampling</p>
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
            <Package className="h-6 w-6 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Allocation Details Found</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center p-3 bg-white rounded-lg border border-gray-200">
              <Package className="h-5 w-5 text-gray-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Indent Number</p>
                <p className="font-semibold text-gray-900">{searchResult.indent_number}</p>
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
              <Building className="h-5 w-5 text-gray-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Centre Name</p>
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
              <Calendar className="h-5 w-5 text-gray-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Date</p>
                <p className="font-semibold text-gray-900">{searchResult.date}</p>
              </div>
            </div>

            <div className="flex items-center p-3 bg-white rounded-lg border border-gray-200">
              <Calendar className="h-5 w-5 text-gray-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Lifting Period</p>
                <p className="font-semibold text-gray-900">{searchResult.lifting_period} days</p>
              </div>
            </div>

            <div className="flex items-center p-3 bg-white rounded-lg border border-gray-200">
              <Ruler className="h-5 w-5 text-gray-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Fibre Length</p>
                <p className="font-semibold text-gray-900">{searchResult.fibre_length}mm</p>
              </div>
            </div>

            <div className="flex items-center p-3 bg-white rounded-lg border border-gray-200">
              <Wheat className="h-5 w-5 text-gray-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Variety</p>
                <p className="font-semibold text-gray-900">{searchResult.variety}</p>
              </div>
            </div>

            <div className="flex items-center p-3 bg-white rounded-lg border border-gray-200">
              <DollarSign className="h-5 w-5 text-gray-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Bid Price</p>
                <p className="font-semibold text-gray-900">₹{searchResult.bid_price.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-blue-700">Status: <span className="font-semibold">{searchResult.status}</span></p>
              </div>
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                Ready for Sampling
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SamplingSearch;