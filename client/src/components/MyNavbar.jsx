import { Navbar, Container, Nav, Button } from "react-bootstrap";
import { NavLink } from "react-router"; 

import logo from "../assets/LogoV2.png";

function MyNavbar({ loggedIn, user, handleLogout }) {
  return (
    <Navbar bg="light" expand="lg" className="shadow">
      <Container>
        <Navbar.Brand as={NavLink} to="/" className="d-flex align-items-center">
          <img
            src={logo}
            alt="Logo"
            style={{ height: "50px", marginRight: "1rem" }}
          />
          <span style={{ fontSize: "1.8rem", fontWeight: "bold" }}>
            Compiti
          </span>
        </Navbar.Brand>

        {/* Separatore verticale */}
        <div
          style={{
            width: "1px",
            height: "40px",
            backgroundColor: "#ccc",
            marginRight: "1.5rem",
          }}
        />

        {loggedIn && (
          <Nav className="me-auto d-flex align-items-center gap-4">
            <NavLink
              to="/compiti"
              className={({ isActive }) =>
                "nav-link fw-semibold px-0 " +
                (isActive
                  ? "text-primary border-bottom border-2 border-primary"
                  : "text-dark")
              }
            >
              Compiti
            </NavLink>

            {user?.ruolo === "docente" ? (
              <>
                <NavLink
                  to="/studenti"
                  className={({ isActive }) =>
                    "nav-link fw-semibold px-0 " +
                    (isActive
                      ? "text-primary border-bottom border-2 border-primary"
                      : "text-dark")
                  }
                >
                  Studenti
                </NavLink>
                <NavLink
                  to="/statistiche"
                  className={({ isActive }) =>
                    "nav-link fw-semibold px-0 " +
                    (isActive
                      ? "text-primary border-bottom border-2 border-primary"
                      : "text-dark")
                  }
                >
                  Statistiche
                </NavLink>
              </>
            ) : (
              <NavLink
                to="/valutazioni"
                className={({ isActive }) =>
                  "nav-link fw-semibold px-0 " +
                  (isActive
                    ? "text-primary border-bottom border-2 border-primary"
                    : "text-dark")
                }
              >
                Valutazioni
              </NavLink>
            )}
          </Nav>
        )}

        <Nav className="ms-auto d-flex align-items-center">
          {loggedIn ? (
            <>
              <span className="navbar-text text-muted me-3 d-flex align-items-center">
                <i className="bi bi-person-circle me-1"></i>
                {user?.nome} {user?.cognome ? user.cognome.charAt(0) + "." : ""}
                <span className="badge bg-success ms-2 text-uppercase">
                  {user?.ruolo}
                </span>
              </span>
              <Button
                variant="outline-danger"
                size="sm"
                onClick={handleLogout}
                className="ms-1 px-2 py-1 fw-normal"
              >
                Logout
              </Button>
            </>
          ) : (
            <NavLink
              to="/login"
              className={({ isActive }) =>
                "btn ms-2 " + (isActive ? "btn-primary" : "btn-outline-primary")
              }
            >
              Login
            </NavLink>
          )}
        </Nav>
      </Container>
    </Navbar>
  );
}

export default MyNavbar;
