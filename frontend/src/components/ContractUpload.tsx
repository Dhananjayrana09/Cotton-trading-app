import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import { ContractAPI } from '../services/contractApi';
import type { ProcurementDetails, ContractUploadResponse } from '../types/contract';

interface ContractUploadProps {
  procurementDetails: ProcurementDetails;
  onUploadSuccess: (response: ContractUploadResponse) => void;
}

const ContractUpload: React.FC<ContractUploadProps> = ({ procurementDetails, onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (file.type !== 'application/pdf') {
        setUploadStatus('error');
        setUploadMessage('Please select a PDF file only');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setUploadStatus('error');
        setUploadMessage('File size must be less than 10MB');
        return;
      }

      setSelectedFile(file);
      setUploadStatus('idle');
      setUploadMessage('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadStatus('error');
      setUploadMessage('Please select a file first');
      return;
    }

    setUploading(true);
    setUploadStatus('idle');

    try {
      const response = await ContractAPI.uploadContract(
        procurementDetails.indent_number,
        procurementDetails.firm_name,
        selectedFile,
        'user' // In production, this would be the actual user ID
      );

      if (response.success) {
        setUploadStatus('success');
        setUploadMessage('Contract uploaded successfully! Admin will be notified for approval.');
        onUploadSuccess(response);
        
        // Reset form
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        setUploadStatus('error');
        setUploadMessage(response.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      setUploadMessage('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setUploadStatus('idle');
    setUploadMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const expectedFilename = `${procurementDetails.firm_name}_${procurementDetails.indent_number}_PurchaseContract.pdf`;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Upload Purchase Contract</h2>
        <p className="text-gray-600">Upload the purchase contract PDF for indent number: <span className="font-semibold">{procurementDetails.indent_number}</span></p>
      </div>

      {/* File Upload Area */}
      <div className="mb-6">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            className="hidden"
            id="contract-upload"
          />
          
          {!selectedFile ? (
            <label htmlFor="contract-upload" className="cursor-pointer">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">Click to select PDF file</p>
              <p className="text-sm text-gray-500">Maximum file size: 10MB</p>
            </label>
          ) : (
            <div className="flex items-center justify-center">
              <FileText className="h-8 w-8 text-blue-600 mr-3" />
              <div className="text-left">
                <p className="font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button
                onClick={clearFile}
                className="ml-4 p-1 text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        {/* Expected Filename Info */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-700">
            <strong>Expected filename format:</strong> {expectedFilename}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            The file will be automatically renamed to this format upon upload
          </p>
        </div>
      </div>

      {/* Upload Status Messages */}
      {uploadMessage && (
        <div className={`mb-6 p-4 rounded-lg border ${
          uploadStatus === 'success' 
            ? 'bg-green-50 border-green-200' 
            : uploadStatus === 'error'
            ? 'bg-red-50 border-red-200'
            : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-center">
            {uploadStatus === 'success' && <CheckCircle className="h-5 w-5 text-green-600 mr-2" />}
            {uploadStatus === 'error' && <AlertCircle className="h-5 w-5 text-red-600 mr-2" />}
            <p className={`text-sm ${
              uploadStatus === 'success' 
                ? 'text-green-700' 
                : uploadStatus === 'error'
                ? 'text-red-700'
                : 'text-blue-700'
            }`}>
              {uploadMessage}
            </p>
          </div>
        </div>
      )}

      {/* Upload Button */}
      <div className="flex justify-end">
        <button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center"
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload Purchase Contract
            </>
          )}
        </button>
      </div>

      {/* Upload Process Info */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-2">Upload Process:</h4>
        <ol className="text-sm text-gray-600 space-y-1">
          <li>1. File will be uploaded to secure cloud storage</li>
          <li>2. Admin will be notified for review and approval</li>
          <li>3. Upon approval, contract will be sent to the branch email</li>
          <li>4. You can track the status in the contracts dashboard</li>
        </ol>
      </div>
    </div>
  );
};

export default ContractUpload;