const Dialog = ({
  isOpen,
  title,
  message,
  value,
  setValue,
  onOk,
  onCancel,
  showInput = false,
}) => {
  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.dialog}>
        {title && <h3>{title}</h3>}
        {message && <p>{message}</p>}
        {showInput && (
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            style={styles.input}
          />
        )}
        <div style={styles.buttons}>
          <button onClick={onOk} style={styles.button}>
            OK
          </button>
          <button onClick={onCancel} style={styles.button}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  dialog: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "8px",
    width: "300px",
    textAlign: "center",
  },
  input: {
    width: "100%",
    padding: "8px",
    margin: "10px 0",
    borderRadius: "4px",
    border: "1px solid #ccc",
  },
  buttons: {
    display: "flex",
    justifyContent: "space-between",
  },
  button: {
    padding: "8px 16px",
    borderRadius: "4px",
    border: "none",
    cursor: "pointer",
  },
};

export default Dialog;
