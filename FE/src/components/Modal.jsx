function Modal({ open, title, children, onClose }) {
  if (!open) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <section className="modal-card">
        <header className="modal-header">
          <h3>{title}</h3>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </header>
        <div>{children}</div>
      </section>
    </div>
  );
}

export default Modal;
