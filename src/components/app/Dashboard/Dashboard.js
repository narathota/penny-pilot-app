import React from "react";
import AppNavbar from "../AppNavbar/AppNavbar";
import AppSidebar from "../AppSidebar/AppSidebar";
import AppBody from "../AppBody/AppBody";
import AppFooter from "../AppFooter/AppFooter";

export default function Dashboard() {
  return (
    <div className="d-flex flex-column min-vh-100 bg-body text-body">
      <AppNavbar />
      <div className="flex-grow-1">
        <div className="container-fluid">
          <div className="row">
            <div className="col-12 col-lg-auto p-0">
              <AppSidebar />
            </div>
            <div className="col p-0">
              <AppBody />
            </div>
          </div>
        </div>
      </div>
      <AppFooter />
    </div>
  );
}
