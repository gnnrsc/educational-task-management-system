import {  Outlet } from "react-router";
import MyNavbar from "../Navbar";

function DefaultLayout() {
  return (
    <>
      <MyNavbar />
      <main className="container mt-4">
        <Outlet />
      </main>
    </>
  );
}

export default DefaultLayout;