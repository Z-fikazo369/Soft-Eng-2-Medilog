import React from "react";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  totalCount: number;
  pageSize: number;
  onPageSizeChange?: (newSize: number) => void;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalCount,
  pageSize,
  onPageSizeChange,
}) => {
  const handlePrev = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-3">
      <span className="text-muted">
        {/* Nag-adjust tayo para 10-based */}
        Showing {totalCount > 0 ? startRecord : 0} to {endRecord} of{" "}
        {totalCount} entries
      </span>

      {/* ✅ NEW: Rows Per Page Selector */}
      {onPageSizeChange && (
        <div className="d-flex align-items-center gap-2">
          <label htmlFor="rowsPerPage" className="text-muted small mb-0">
            Rows per page:
          </label>
          <select
            id="rowsPerPage"
            className="form-select form-select-sm"
            style={{ width: "auto" }}
            value={pageSize}
            onChange={(e) => onPageSizeChange(parseInt(e.target.value, 10))}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      )}

      <div className="pagination-controls">
        <button
          className="pagination-btn"
          onClick={handlePrev}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <button
          className="pagination-btn"
          onClick={handleNext}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default PaginationControls;
