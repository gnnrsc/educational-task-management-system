import {  Outlet } from "react-router";
import Navbar from "../Navbar";

function DefaultLayout() {
  return (
    <>
      <Navbar />
      <main className="container mt-4">
        <Outlet />
      </main>
    </>
  );
}

export default DefaultLayout;