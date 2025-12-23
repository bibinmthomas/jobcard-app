/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useRef, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

// Set up the worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function PDFViewer({ pdfPath }) {
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);

  useEffect(() => {
    if (!pdfPath) {
      setLoading(false);
      return;
    }

    const loadPdf = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load PDF file
        const loadingTask = pdfjs.getDocument(pdfPath);
        const pdf = await loadingTask.promise;
        setNumPages(pdf.numPages);

        // Get first page
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.5 });

        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Render PDF page
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
        setLoading(false);
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    loadPdf();
  }, [pdfPath, pageNum]);

  if (!pdfPath) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-gray-500">
          No PDF selected
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-red-500">
          Error loading PDF: {error}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>PDF Preview</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && <div className="text-center p-4">Loading PDF...</div>}
        <div className="overflow-auto max-h-[600px] border rounded">
          <canvas ref={canvasRef} className="mx-auto" />
        </div>
        {numPages > 1 && (
          <div className="flex justify-center gap-4 mt-4">
            <button
              onClick={() => setPageNum(Math.max(1, pageNum - 1))}
              disabled={pageNum <= 1}
              className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="py-2">
              Page {pageNum} of {numPages}
            </span>
            <button
              onClick={() => setPageNum(Math.min(numPages, pageNum + 1))}
              disabled={pageNum >= numPages}
              className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
