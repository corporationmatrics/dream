'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOCR } from '@/hooks/useOCR';
import FileUploadComponent from '@/components/FileUploadComponent';

interface DocumentData {
  id: string;
  fileName: string;
  fileType: string;
  rawText: string;
  pageCount?: number;
  extractedData?: any;
  createdAt: string;
}

export default function DocumentOCRPage() {
  const { user } = useAuth();
  const { processDocument, getDocuments, loading, error: ocrError } = useOCR();
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadDocuments();
    }
  }, [user, pagination.page]);

  const loadDocuments = async () => {
    try {
      const offset = (pagination.page - 1) * pagination.limit;
      const results = await getDocuments(pagination.limit, offset);
      setDocuments(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    }
  };

  const handleUpload = async (file: File) => {
    try {
      setError(null);
      await processDocument(file);
      setPagination({ ...pagination, page: 1 });
      await loadDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  if (!user) {
    return <div className="p-8 text-center">Please log in to use OCR features</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <h1 className="text-4xl font-bold mb-2">Document OCR</h1>
        <p className="text-gray-600 mb-8">Extract text from PDFs and images</p>

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Upload Document</h2>
          <FileUploadComponent
            onUpload={handleUpload}
            acceptedTypes={['image/jpeg', 'image/png', 'application/pdf']}
            maxSize={10 * 1024 * 1024} // 10MB for PDFs
            disabled={loading}
          />
          {ocrError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {ocrError}
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Results Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Processed Documents</h2>
          </div>

          {documents.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No documents uploaded yet
            </div>
          ) : (
            <div className="divide-y">
              {documents.map((doc) => (
                <div key={doc.id} className="p-6 hover:bg-gray-50 transition">
                  <button
                    onClick={() =>
                      setExpandedId(expandedId === doc.id ? null : doc.id)
                    }
                    className="w-full text-left"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold">{doc.fileName}</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Type:</span>
                            <p className="uppercase">{doc.fileType || 'unknown'}</p>
                          </div>
                          <div>
                            <span className="font-medium">Pages:</span>
                            <p>{doc.pageCount || 1}</p>
                          </div>
                          <div>
                            <span className="font-medium">Processed:</span>
                            <p>
                              {new Date(doc.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      <span
                        className={`text-xl transform transition ${
                          expandedId === doc.id ? 'rotate-180' : ''
                        }`}
                      >
                        ▼
                      </span>
                    </div>
                  </button>

                  {expandedId === doc.id && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm text-gray-700 mb-2">
                          Extracted Text:
                        </p>
                        <div className="bg-white p-3 rounded text-sm text-gray-600 max-h-40 overflow-y-auto font-mono">
                          {doc.rawText}
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium">
                          Copy Text
                        </button>
                        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium">
                          Download
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
