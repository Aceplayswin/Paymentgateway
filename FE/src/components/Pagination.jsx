function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="pagination-wrap">
      <button type="button" onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>
        Previous
      </button>
      <span>
        Page {currentPage} of {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
      >
        Next
      </button>
    </div>
  );
}

export default Pagination;
