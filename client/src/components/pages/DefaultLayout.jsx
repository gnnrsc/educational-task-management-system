import {  Outlet } from "react-router";
import MyNavbar from "../MyNavbar";

function DefaultLayout({ loggedIn, handleLogout, user }) {
  return (
    <>
      <MyNavbar loggedIn={loggedIn} handleLogout={handleLogout} user={user} />
      <main className="container mt-4">
        <Outlet />
      </main>
    </>
  );
}

export default DefaultLayout;