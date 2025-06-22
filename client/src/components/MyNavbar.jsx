import { Navbar, Container, Nav, Button } from "react-bootstrap";
import logo from '../assets/LogoV2.png';

function MyNavbar() {
  return (
    <Navbar bg="light" expand="lg" className="shadow">
      <Container>
        <Navbar.Brand href="#home" className="d-flex align-items-center">
          <img
            src={logo}
            alt="Logo"
            style={{ height: "60px", marginRight: "1.5rem" }}
          />
          <span style={{ fontSize: "2rem", fontWeight: "bold" }}>
            Compiti
          </span>
        </Navbar.Brand>
        <Nav className="ms-auto">
          <Button variant="outline-primary">Login</Button>
        </Nav>
      </Container>
    </Navbar>
  );
}

export default MyNavbar;
