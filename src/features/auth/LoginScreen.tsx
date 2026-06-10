import { useState, type FormEvent } from "react";
import { z } from "zod";
import { useAuth } from "../../shared/auth/AuthContext";
import { Button, Card, CardBody, Input } from "../../shared/components/ui";
import { authSchema } from "../../shared/validation/schemas";

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
    setError("");
    setMessage("");

    const parsed = authSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Revisa los datos.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "login") {
        await signIn(parsed.data.email, parsed.data.password);
      } else {
        await signUp(parsed.data.email, parsed.data.password);
      }
    } catch (caughtError) {
      setError(readAuthError(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResetPassword() {
    setError("");
    setMessage("");

    const parsed = z.string().trim().email("Escribe tu correo para enviarte el enlace.").safeParse(email);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Escribe tu correo para enviarte el enlace.");
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(parsed.data);
      setMessage("Te enviamos un correo para recuperar tu contraseña.");
    } catch (caughtError) {
      setError(readAuthError(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-screen">
      <Card className="auth-panel ui-card" shadow="none" aria-labelledby="login-title">
        <CardBody>
          <p className="eyebrow">Control financiero</p>
          <h1 id="login-title">Spa Control</h1>
          <p>{mode === "login" ? "Entra para ver cómo va tu negocio hoy." : "Crea tu cuenta privada para empezar."}</p>

          <form className="form-stack" onSubmit={handleSubmit}>
            <Input
              autoComplete="email"
              className="form-control"
              inputMode="email"
              isRequired
              label="Correo"
              name="email"
              radius="sm"
              spellCheck="false"
              type="email"
              value={email}
              variant="bordered"
              onValueChange={setEmail}
            />
            <Input
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className="form-control"
              isRequired
              label="Contraseña"
              name="password"
              radius="sm"
              type="password"
              value={password}
              variant="bordered"
              onValueChange={setPassword}
            />

            {error || authError ? <p className="error-text">{error || authError}</p> : null}
            {message ? <p className="success-text">{message}</p> : null}

            <Button color="primary" isLoading={isSubmitting} radius="sm" type="submit">
              {mode === "login" ? "Entrar" : "Crear cuenta"}
            </Button>
          </form>

          <div className="auth-actions">
            <Button radius="sm" variant="light" onPress={() => setMode(mode === "login" ? "register" : "login")}>
              {mode === "login" ? "Crear cuenta" : "Ya tengo cuenta"}
            </Button>
            <Button isDisabled={isSubmitting} radius="sm" variant="light" onPress={handleResetPassword}>
              Recuperar contraseña
            </Button>
          </div>
        </CardBody>
      </Card>
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
