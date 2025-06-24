import {  Outlet } from "react-router";
import MyNavbar from "../MyNavbar";

function DefaultLayout({ loggedIn, handleLogout, ruolo }) {
  return (
    <>
      <MyNavbar loggedIn={loggedIn} handleLogout={handleLogout} ruolo={ruolo} />
      <main className="container mt-4">
        <Outlet />
      </main>
    </>
  );
}

export default DefaultLayout;