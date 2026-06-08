type ScanButtonProps = {
  disabled?: boolean
  statusText: string
  onClick: () => void
}

export function ScanButton({ disabled, statusText, onClick }: ScanButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        border: "none",
        borderRadius: 16,
        padding: "14px 16px",
        color: "#0F172A",
        fontWeight: 700,
        fontSize: 15,
        cursor: disabled ? "not-allowed" : "pointer",
        background:
          "linear-gradient(135deg, #FBBF24 0%, #F97316 48%, #FB7185 100%)",
        boxShadow: "0 16px 32px rgba(249, 115, 22, 0.28)",
        opacity: disabled ? 0.7 : 1
      }}>
      {statusText}
    </button>
  )
}