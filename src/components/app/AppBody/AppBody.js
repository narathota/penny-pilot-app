// FILE: src/components/app/AppBody/AppBody.js
import React from "react";
import { Outlet } from "react-router-dom";
import AppNavbar from "../AppNavbar/AppNavbar";
import AppSidebar from "../AppSidebar/AppSidebar";
import AppFooter from "../AppFooter/AppFooter";

export default function AppBody() {
  return (
    <div className="d-flex flex-column min-vh-100 bg-body text-body">
      <AppNavbar />

      <div className="flex-grow-1">
        <div className="container-fluid">
          <div className="row">
            {/* Static sidebar on ≥lg */}
            <div className="d-none d-lg-block col-lg-auto p-0">
              <AppSidebar />
            </div>

            {/* Main content */}
            <div className="col p-0">
              <div className="p-3 p-lg-4">
                <Outlet />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Offcanvas sidebar for <lg (opened by the hamburger) */}
      <div
        className="offcanvas offcanvas-start"
        tabIndex="-1"
        id="appSidebar"
        aria-labelledby="appSidebarLabel"
      >
        <div className="offcanvas-header">
          <h5 className="offcanvas-title" id="appSidebarLabel">Navigation</h5>
          <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close" />
        </div>
        <div className="offcanvas-body p-0">
          {/* Tell AppSidebar it's inside an offcanvas */}
          <AppSidebar insideOffcanvas />
        </div>
      </div>

      <AppFooter />
    </div>
  );
}
