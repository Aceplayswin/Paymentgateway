import LoginNavbar from "./LoginNavbar";

function AuthPageShell({ children, variant = "default" }) {
  const pageClassName =
    variant === "legal"
      ? "login-page login-page--legal"
      : variant === "centered"
        ? "login-page login-page--centered"
        : "login-page";

  return (
    <main className={pageClassName}>
      <div className="bg-shape shape-1" />
      <div className="bg-shape shape-2" />
      <div className="bg-shape shape-3" />

      <LoginNavbar />

      <div className="login-page__body">{children}</div>
    </main>
  );
}

export default AuthPageShell;
