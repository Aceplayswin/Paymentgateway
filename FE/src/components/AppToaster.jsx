import { Toaster } from "react-hot-toast";

function AppToaster() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: "rgba(15, 23, 42, 0.96)",
          color: "#e8efff",
          border: "1px solid rgba(149, 187, 255, 0.34)",
          borderRadius: "12px",
          fontSize: "0.9rem",
          boxShadow: "0 18px 45px rgba(16, 36, 88, 0.38)",
        },
        success: {
          iconTheme: {
            primary: "#4ade80",
            secondary: "#0f172a",
          },
        },
        error: {
          iconTheme: {
            primary: "#f87171",
            secondary: "#0f172a",
          },
        },
      }}
    />
  );
}

export default AppToaster;
