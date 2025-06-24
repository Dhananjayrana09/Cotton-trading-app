import React, { useState } from 'react';
import { FileText, Upload, CheckCircle } from 'lucide-react';
import ContractSearch from '../components/ContractSearch';
import ContractUpload from '../components/ContractUpload';
import type { ProcurementDetails, ContractUploadResponse } from '../types/contract';

const ContractManagement: React.FC = () => {
  const [procurementDetails, setProcurementDetails] = useState<ProcurementDetails | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<ContractUploadResponse | null>(null);

  const handleIndentFound = (details: ProcurementDetails) => {
    setProcurementDetails(details);
    setUploadSuccess(null); // Reset upload success when new indent is found
  };

  const handleUploadSuccess = (response: ContractUploadResponse) => {
    setUploadSuccess(response);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Contract Management</h1>
        <p className="text-gray-600 mt-2">Search for procurement details and upload purchase contracts</p>
      </div>

      {/* Progress Indicator */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              procurementDetails ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
            }`}>
              <FileText className="h-4 w-4" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Search Indent</p>
              <p className="text-xs text-gray-500">Find procurement details</p>
            </div>
          </div>

          <div className={`w-16 h-1 ${procurementDetails ? 'bg-green-500' : 'bg-gray-200'}`}></div>

          <div className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              procurementDetails && !uploadSuccess ? 'bg-blue-500 text-white' : 
              uploadSuccess ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-500'
            }`}>
              <Upload className="h-4 w-4" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Upload Contract</p>
              <p className="text-xs text-gray-500">Upload PDF file</p>
            </div>
          </div>

          <div className={`w-16 h-1 ${uploadSuccess ? 'bg-green-500' : 'bg-gray-200'}`}></div>

          <div className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              uploadSuccess ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-500'
            }`}>
              <CheckCircle className="h-4 w-4" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Admin Approval</p>
              <p className="text-xs text-gray-500">Awaiting review</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Component */}
      <ContractSearch onIndentFound={handleIndentFound} />

      {/* Upload Component - Only show if procurement details are found */}
      {procurementDetails && (
        <ContractUpload 
          procurementDetails={procurementDetails}
          onUploadSuccess={handleUploadSuccess}
        />
      )}

      {/* Success Message */}
      {uploadSuccess && uploadSuccess.success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center">
            <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-green-900">Upload Successful!</h3>
              <p className="text-green-700 mt-1">
                Your purchase contract has been uploaded successfully. The admin has been notified and will review the contract for approval.
              </p>
              {uploadSuccess.contract_id && (
                <p className="text-sm text-green-600 mt-2">
                  Contract ID: {uploadSuccess.contract_id}
                </p>
              )}
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-white rounded-lg border border-green-200">
            <h4 className="font-medium text-green-900 mb-2">Next Steps:</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Admin will review the uploaded contract</li>
              <li>• Upon approval, the contract will be automatically sent to the branch email</li>
              <li>• You can track the approval status in the contracts dashboard</li>
              <li>• An audit trail will be maintained for all actions</li>
            </ul>
          </div>
        </div>
      )}

      {/* Information Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">How it Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-blue-800 mb-2">For Users:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Search for your indent number</li>
              <li>• Upload your purchase contract PDF</li>
              <li>• Track approval status</li>
              <li>• Receive notifications on status changes</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-800 mb-2">For Admins:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Review uploaded contracts</li>
              <li>• Approve or reject with comments</li>
              <li>• Automatic email to branch upon approval</li>
              <li>• Complete audit trail maintained</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractManagement;