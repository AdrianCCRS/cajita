import { useState, type FormEvent } from "react";
import { useAuth } from "../../shared/auth/AuthContext";

export function LoginScreen() {
  const { signIn, signUp, resetPassword, authError } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      if (mode === "login") {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
    } catch (caughtError) {
      setError(readAuthError(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResetPassword() {
    if (!email.trim()) {
      setError("Escribe tu correo para enviarte la recuperación.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      await resetPassword(email);
      setMessage("Te enviamos un correo para recuperar tu contraseña.");
    } catch (caughtError) {
      setError(readAuthError(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-screen">
      <section className="auth-panel" aria-labelledby="login-title">
        <p className="eyebrow">Control financiero</p>
        <h1 id="login-title">Spa Control</h1>
        <p>Entra con tu correo para guardar ventas, gastos y salario en Firebase.</p>

        <form className="form-stack" onSubmit={handleSubmit}>
          <label>
            Correo
            <input
              autoComplete="email"
              inputMode="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            Contraseña
            <input
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={6}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          {error || authError ? <p className="error-text">{error || authError}</p> : null}
          {message ? <p className="success-text">{message}</p> : null}

          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {mode === "login" ? "Ingresar" : "Crear cuenta"}
          </button>
        </form>

        <div className="auth-actions">
          <button type="button" onClick={() => setMode(mode === "login" ? "register" : "login")}>
            {mode === "login" ? "Crear cuenta" : "Ya tengo cuenta"}
          </button>
          <button type="button" onClick={handleResetPassword} disabled={isSubmitting}>
            Recuperar contraseña
          </button>
        </div>
      </section>
    </main>
  );
}

function readAuthError(error: unknown) {
  if (error instanceof Error && error.message.includes("auth/invalid-credential")) {
    return "El correo o la contraseña no coinciden.";
  }
  if (error instanceof Error && error.message.includes("auth/email-already-in-use")) {
    return "Ese correo ya tiene una cuenta.";
  }
  if (error instanceof Error && error.message.includes("auth/weak-password")) {
    return "La contraseña debe tener al menos 6 caracteres.";
  }
  if (error instanceof Error && error.message.includes("auth/configuration-not-found")) {
    return "Activa Email/Password en Firebase Authentication.";
  }

  return "Algo salió mal. Intenta de nuevo en un momento.";
}
