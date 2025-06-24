import { Form, Button, Alert } from "react-bootstrap";
import { useState } from "react";
import LoadingSpinner from "../utils/LoadingSpinner";

function LoginForm({ handleLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); 

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (email && password.length >= 6) {
      setLoading(true);
      const serverError = await handleLogin({ email, password });
      setLoading(false);

      if (serverError) {
        setError(serverError.message); // Errore arrivato dal backend
      } else {
        setError(""); // Login riuscito
      }
    } else {
      setError("Per favore, inserisci un'email valida e una password di almeno 6 caratteri.");
    }
  };

  return (
    <Form onSubmit={handleSubmit} className="mx-auto" style={{ maxWidth: 400 }}>
      <Form.Group className="mb-3" controlId="email">
        <Form.Label>E-mail</Form.Label>
        <Form.Control
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          disabled={loading} // disabilita input mentre carica
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="password">
        <Form.Label>Password</Form.Label>
        <Form.Control
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          disabled={loading} // disabilita input mentre carica
        />
      </Form.Group>

      {error && (
        <Alert variant="danger" onClose={() => setError("")} dismissible>
          {error}
        </Alert>
      )}

      <Button type="submit" variant="primary" className="w-100" disabled={loading}>
        {loading ? <LoadingSpinner variant="inline" /> : "Login"}
      </Button>
    </Form>
  );
}

export default LoginForm;
