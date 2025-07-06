import { Form, Button, Alert, InputGroup } from "react-bootstrap";
import { useState } from "react";
import LoadingSpinner from "../utils/LoadingSpinner";
import { useAuth } from "../../AuthContext"; 

function LoginForm() {
  const { logIn } = useAuth();
  //controlled components
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (email && password.length >= 6) {
      setLoading(true);
      const serverError = await logIn({ email, password });
      setLoading(false);

      if (serverError) {
        setError(serverError.message);
      } else {
        setError("");
      }
    } else {
      setError("Per favore, inserisci un'email valida e una password di almeno 6 caratteri.");
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
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
          disabled={loading}
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="password">
        <Form.Label>Password</Form.Label>
        <InputGroup>
          <Form.Control
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            disabled={loading}
          />
          <Button
            variant="outline-secondary"
            onClick={togglePasswordVisibility}
            disabled={loading}
            style={{ 
              border: '1px solid #ced4da',
              borderLeft: 'none'
            }}
          >
            <i className={showPassword ? "bi bi-eye-slash" : "bi bi-eye"}></i>
          </Button>
        </InputGroup>
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