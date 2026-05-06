import { useState } from "react";
import { PDFViewer, PDFDownloadLink, pdf } from "@react-pdf/renderer";
import { X, Download, Save, Printer } from "lucide-react";
import JobCardPDFTemplate from "./JobCardPDFTemplate";
import { api } from "../utils/api";

export default function PDFPreviewModal({ jobCard, onClose }) {
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [printing, setPrinting] = useState(false);

  const filename = `${jobCard.jobNo.replace("/", "-")}.pdf`;

  const handlePrint = async () => {
    setPrinting(true);
    try {
      const blob = await pdf(<JobCardPDFTemplate jobCard={jobCard} />).toBlob();
      const url = URL.createObjectURL(blob);
      const iframe = document.createElement("iframe");
      iframe.style.cssText =
        "position:fixed;width:0;height:0;border:0;top:-1000px;left:-1000px;";
      iframe.src = url;
      document.body.appendChild(iframe);
      iframe.onload = () => {
        setTimeout(() => {
          console.log("Printing PDF...");
          iframe.contentWindow.print();
          setTimeout(() => {
            document.body.removeChild(iframe);
            URL.revokeObjectURL(url);
            setPrinting(false);
          }, 1000);
        }, 200);
      };
    } catch (err) {
      console.log("Print error:", err);
      setPrinting(false);
    }
  };

  const handleSaveToDisk = async () => {
    setSaving(true);
    setSaveMsg("");
    try {
      const blob = await pdf(<JobCardPDFTemplate jobCard={jobCard} />).toBlob();
      const arrayBuffer = await blob.arrayBuffer();
      const bytes = Array.from(new Uint8Array(arrayBuffer));
      const result = await api.pdf.saveToDisk({ filename, bytes });
      setSaveMsg(`Saved to: ${result.path}`);
    } catch (err) {
      setSaveMsg(`Error: ${err.message || "Save failed"}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-[820px] max-w-[95vw] h-[90vh]">
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">
              PDF Preview —{" "}
              <span className="font-mono text-blue-600">{jobCard.jobNo}</span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {jobCard.account?.acctName} ·{" "}
              {new Date(jobCard.date).toLocaleDateString()}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Browser download */}
            <PDFDownloadLink
              document={<JobCardPDFTemplate jobCard={jobCard} />}
              fileName={filename}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              {({ loading }) => (
                <>
                  <Download className="w-3.5 h-3.5" />
                  {loading ? "Building…" : "Download PDF"}
                </>
              )}
            </PDFDownloadLink>

            {/* Save to configured export dir */}
            <button
              onClick={handleSaveToDisk}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg font-medium"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? "Saving…" : "Save to Disk"}
            </button>

            {/* Print */}
            <button
              onClick={handlePrint}
              disabled={printing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg font-medium"
            >
              <Printer className="w-3.5 h-3.5" />
              {printing ? "Preparing…" : "Print"}
            </button>

            <button
              onClick={onClose}
              className="ml-2 p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Save status */}
        {saveMsg && (
          <div
            className={`px-5 py-2 text-xs border-b shrink-0 ${
              saveMsg.startsWith("Error")
                ? "bg-red-50 text-red-700 border-red-200"
                : "bg-green-50 text-green-700 border-green-200"
            }`}
          >
            {saveMsg}
          </div>
        )}

        {/* PDF Viewer */}
        <div className="flex-1 overflow-hidden rounded-b-2xl">
          <PDFViewer width="100%" height="100%" showToolbar={false}>
            <JobCardPDFTemplate jobCard={jobCard} />
          </PDFViewer>
        </div>
      </div>
    </div>
  );
}
