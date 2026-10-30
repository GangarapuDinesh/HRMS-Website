import { useCallback, useEffect, useState } from "react";
import { FiUploadCloud,FiFileText,FiDownload,FiTrash2,FiRefreshCw,FiSearch,FiAlertCircle,FiCheckCircle,FiArrowLeft,} from "react-icons/fi";
import documentService from "../../services/documentService";
import "./EmployeeDocuments.css";
const DOCUMENT_TYPES = [
  "ID Proof",
  "Resume",
  "Offer Letter",
  "Education Certificate",
  "Experience Letter",
  "Salary Slip",
  "Other",
];
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "jpg",
  "jpeg",
  "png",
];
function formatSize(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}
export default function EmployeeDocuments({ employeeId, onBack }) {
  const [documents, setDocuments] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentType, setDocumentType] = useState("ID Proof");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const loadDocuments = useCallback(async () => {
    if (!employeeId) {
      setDocuments([]);
      setError("Employee record ID is missing. Check whether your login response contains employeeId.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await documentService.getEmployeeDocuments(employeeId);
      setDocuments(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(err.message || "Could not load documents.");
    } finally {
      setLoading(false);
    }
  }, [employeeId]);
  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);
 function handleFileChange(event) {
    const file = event.target.files?.[0];
    setError("");
    setSuccess("");
    if (!file) {
      setSelectedFile(null);
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("File size must not exceed 5 MB.");
      setSelectedFile(null);
      event.target.value = "";
      return;
    }
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      setError("Choose a PDF, DOC, DOCX, JPG or PNG file.");
      setSelectedFile(null);
      event.target.value = "";
      return;
    }
    setSelectedFile(file);
  }
  async function handleUpload(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!employeeId) {
      setError("Employee record ID is missing.");
      return;
    }
    if (!selectedFile) {
      setError("Please choose a file to upload.");
      return;
    }
    setUploading(true);
    try {
      await documentService.uploadDocument(
        employeeId,
        selectedFile,
        documentType
      );
      setSelectedFile(null);
      event.currentTarget.reset();
      setDocumentType("ID Proof");
      setSuccess("Document uploaded successfully.");
      await loadDocuments();
    } catch (err) {
      setError(err.message || "Document upload failed.");
    } finally {
      setUploading(false);
    }
  }
  async function handleDownload(document) {
    setError("");
    setSuccess("");
    setActiveId(document.id);
    let objectUrl;
    try {
      const blob = await documentService.downloadDocument(document.id);
      objectUrl = URL.createObjectURL(blob);
      const link = window.document.createElement("a");
      link.href = objectUrl;
      link.download = document.originalFileName || "document";
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      setSuccess("Download started.");
    } catch (err) {
      setError(err.message || "Download failed.");
    } finally {
      if (objectUrl) {
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      }
      setActiveId(null);
    }
  }
  async function handleDelete(document) {
    const confirmed = window.confirm(
      `Delete "${document.originalFileName}"? This cannot be undone.`
    );
    if (!confirmed) return;
    setError("");
    setSuccess("");
    setActiveId(document.id);
    try {
      await documentService.deleteDocument(document.id);
      setDocuments((current) =>
        current.filter((item) => item.id !== document.id)
      );
      setSuccess("Document deleted successfully.");
    } catch (err) {
      setError(err.message || "Could not delete the document.");
    } finally {
      setActiveId(null);
    }
  }
  const filteredDocuments = documents.filter((document) => {
    const query = search.trim().toLowerCase();
    return (
      (document.originalFileName || "").toLowerCase().includes(query) ||
      (document.documentType || "").toLowerCase().includes(query)
    );
  });
  return (
    <main className="employee-documents-page">
      <header className="documents-header">
        <div className="documents-header-main">
          {onBack && (
            <button
              type="button"
              className="documents-back-button"
              onClick={onBack}
            >
              <FiArrowLeft />
              Back to Dashboard
            </button>
          )}
          <span className="documents-eyebrow">
            EMPLOYEE SELF SERVICE
          </span>
          <h1>Employee Documents</h1>
          <p>
            Securely manage employee records and important files.
          </p>
        </div>
        <button
          type="button"
          className="documents-refresh"
          onClick={loadDocuments}
          disabled={loading}
        >
          <FiRefreshCw
            className={loading ? "documents-spin" : ""}
          />
          Refresh
        </button>
      </header>
      {error && (
        <div
          className="documents-alert documents-alert-error"
          role="alert"
        >
          <FiAlertCircle />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div
          className="documents-alert documents-alert-success"
          role="status"
        >
          <FiCheckCircle />
          <span>{success}</span>
        </div>
      )}
      <section className="documents-stats">
        <div className="documents-stat-card">
          <span className="documents-stat-icon">
            <FiFileText />
          </span>
          <div>
            <span className="documents-stat-label">
              Total Documents
            </span>
            <strong>{documents.length}</strong>
          </div>
        </div>
        <div className="documents-stat-card">
          <span className="documents-stat-icon documents-stat-icon-blue">
            <FiCheckCircle />
          </span>
          <div>
            <span className="documents-stat-label">
              Accepted Formats
            </span>
            <strong>PDF, DOC, Images</strong>
          </div>
        </div>
        <div className="documents-stat-card">
          <span className="documents-stat-icon documents-stat-icon-purple">
            <FiUploadCloud />
          </span>
          <div>
            <span className="documents-stat-label">
              Maximum File Size
            </span>
            <strong>5 MB</strong>
          </div>
        </div>
      </section>
      <section className="documents-panel">
        <div className="documents-panel-heading">
          <div>
            <h2>Upload a Document</h2>
            <p>Select a file and choose its category.</p>
          </div>
        </div>
        <form
          className="documents-upload-form"
          onSubmit={handleUpload}
        >
          <label className="documents-file-picker">
            <FiUploadCloud className="documents-upload-icon" />
            <strong>
              {selectedFile
                ? selectedFile.name
                : "Choose a document"}
            </strong>
            <span>
              PDF, DOC, DOCX, JPG or PNG · Maximum 5 MB
            </span>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </label>
          <div className="documents-upload-controls">
            <label className="documents-field">
              <span>Document type</span>
              <select
                value={documentType}
                onChange={(event) =>
                  setDocumentType(event.target.value)
                }
                disabled={uploading}
              >
                {DOCUMENT_TYPES.map((type) => (
                  <option value={type} key={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="documents-upload-button"
              disabled={
                uploading || !selectedFile || !employeeId
              }
            >
              <FiUploadCloud />
              {uploading ? "Uploading..." : "Upload Document"}
            </button>
          </div>
        </form>
      </section>
      <section className="documents-panel">
        <div className="documents-list-heading">
          <div>
            <h2>Document Library</h2>
            <p>Browse and manage uploaded files.</p>
          </div>
          <label className="documents-search">
            <FiSearch />
            <input
              type="search"
              placeholder="Search documents..."
              aria-label="Search documents"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </div>
        {loading ? (
          <div className="documents-empty">
            <FiRefreshCw className="documents-spin" />
            <p>Loading documents...</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="documents-empty">
            <FiFileText />
            <h3>No documents found</h3>
            <p>
              {documents.length
                ? "Try another search term."
                : "Upload your first employee document to get started."}
            </p>
          </div>
        ) : (
          <div className="documents-table-wrapper">
            <table className="documents-table">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Uploaded</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((document) => (
                  <tr key={document.id}>
                    <td>
                      <div className="documents-file-name">
                        <span className="documents-file-icon">
                          <FiFileText />
                        </span>

                        <span title={document.originalFileName}>
                          {document.originalFileName}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="documents-type-badge">
                        {document.documentType}
                      </span>
                    </td>
                    <td>{formatSize(document.fileSize)}</td>
                    <td>{formatDate(document.uploadedAt)}</td>
                    <td>
                      <div className="documents-actions">
                        <button
                          type="button"
                          title="Download document"
                          aria-label={`Download ${document.originalFileName}`}
                          onClick={() => handleDownload(document)}
                          disabled={activeId !== null}
                        >
                          <FiDownload />
                        </button>
                        <button
                          type="button"
                          className="documents-delete-button"
                          title="Delete document"
                          aria-label={`Delete ${document.originalFileName}`}
                          onClick={() => handleDelete(document)}
                          disabled={activeId !== null}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
