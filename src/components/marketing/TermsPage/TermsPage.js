// FILE: src/components/marketing/TermsPage/TermsPage.js
import React from "react";
import MarketingNavbar from "../MarketingNavbar/MarketingNavbar";
import MarketingFooter from "../MarketingFooter/MarketingFooter";

export default function TermsPage() {
  const lastUpdatedISO = new Date().toISOString();
  const lastUpdated = new Date(lastUpdatedISO).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const sections = [
    { id: "acceptance", title: "1. Acceptance of Terms" },
    { id: "beta", title: "2. Public Beta" },
    { id: "license", title: "3. Use License" },
    { id: "user-content", title: "4. User Content & Imports" },
    { id: "prohibited", title: "5. Prohibited Uses" },
    { id: "disclaimer", title: "6. Disclaimers" },
    { id: "limitations", title: "7. Limitation of Liability" },
    { id: "accuracy", title: "8. Accuracy & Availability" },
    { id: "links", title: "9. Third‑Party Links" },
    { id: "modifications", title: "10. Changes to the Service & Terms" },
    { id: "termination", title: "11. Suspension & Termination" },
    { id: "governing-law", title: "12. Governing Law" },
    { id: "contact", title: "13. Contact" },
  ];

  return (
    <div className="d-flex flex-column min-vh-100 bg-body text-body">
      <MarketingNavbar />

      <main className="container py-5">
        {/* Header */}
        <header className="mb-4" id="top">
          <p className="text-uppercase text-muted mb-2 small">Legal</p>
          <h1 className="h3 fw-bold mb-2">Terms of Service</h1>
          <p className="text-muted mb-0">
            Last updated: <time dateTime={lastUpdatedISO}>{lastUpdated}</time>
          </p>
          <p className="mt-3 mb-0 small text-warning">
            Public beta: Pocket Penny is available at{" "}
            <a
              className="link-primary"
              href="https://pocketpenny.tekimart.com/"
              target="_blank"
              rel="noreferrer"
            >
              pocketpenny.tekimart.com
            </a>
            . Features may change and occasional interruptions may occur.
          </p>
        </header>

        <div className="row g-4">
          <div className="col-12 col-lg-8">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4 p-lg-5">
                {/* TOC */}
                <nav aria-label="Table of contents" className="mb-4">
                  <ul className="list-unstyled mb-0">
                    {sections.map((s) => (
                      <li key={s.id} className="mb-1">
                        <a className="link-primary text-decoration-none" href={`#${s.id}`}>
                          {s.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>

                {/* Sections */}
                <section id="acceptance" className="pt-2 mt-2">
                  <h2 className="h5 fw-semibold mb-3">1. Acceptance of Terms</h2>
                  <p>
                    By accessing or using Pocket Penny (the “Service”), you agree to these Terms of
                    Service and our Privacy Policy. If you do not agree, do not use the Service.
                  </p>
                </section>

                <section id="beta" className="pt-4 mt-2">
                  <h2 className="h5 fw-semibold mb-3">2. Public Beta</h2>
                  <p className="mb-0">
                    The Service is currently offered as a public beta. Features may be added,
                    removed, or changed without notice. The Service may be unavailable from time to
                    time. Beta features may not meet the reliability or accuracy of a final release.
                  </p>
                </section>

                <section id="license" className="pt-4 mt-2">
                  <h2 className="h5 fw-semibold mb-3">3. Use License</h2>
                  <p className="mb-2">
                    We grant you a limited, revocable, non‑exclusive, non‑transferable license to
                    access and use the Service for your personal, non‑commercial use. This license
                    does not permit you to:
                  </p>
                  <ul>
                    <li>Modify, copy, redistribute, or publicly display the Service or materials.</li>
                    <li>Reverse engineer or attempt to extract source code.</li>
                    <li>Remove proprietary notices or circumvent security.</li>
                  </ul>
                </section>

                <section id="user-content" className="pt-4 mt-2">
                  <h2 className="h5 fw-semibold mb-3">4. User Content & Imports</h2>
                  <p className="mb-2">
                    You may upload or import data (e.g., CSV/JSON transactions, budgets, categories).
                    You retain any rights you have to your content. You grant us a limited license to
                    store and process your content solely to provide and improve the Service.
                  </p>
                  <p className="small text-muted mb-0">
                    You are responsible for ensuring you have the right to import data and for the
                    accuracy of that data. The Service does not provide financial, legal, or tax
                    advice.
                  </p>
                </section>

                <section id="prohibited" className="pt-4 mt-2">
                  <h2 className="h5 fw-semibold mb-3">5. Prohibited Uses</h2>
                  <p className="mb-2">You agree not to use the Service to:</p>
                  <ul className="mb-0">
                    <li>Violate laws or infringe others’ rights.</li>
                    <li>Upload malicious code or disrupt the Service.</li>
                    <li>Probe, scan, or bypass security controls.</li>
                    <li>Access non‑public areas without authorization.</li>
                  </ul>
                </section>

                <section id="disclaimer" className="pt-4 mt-2">
                  <h2 className="h5 fw-semibold mb-3">6. Disclaimers</h2>
                  <p className="mb-2">
                    The Service is provided “as is” and “as available.” We disclaim all warranties,
                    express or implied, including merchantability, fitness for a particular purpose,
                    and non‑infringement.
                  </p>
                  <p className="small text-muted mb-0">
                    Analytics and budgeting insights are provided for informational purposes only and
                    should not be relied upon as professional advice.
                  </p>
                </section>

                <section id="limitations" className="pt-4 mt-2">
                  <h2 className="h5 fw-semibold mb-3">7. Limitation of Liability</h2>
                  <p>
                    To the maximum extent permitted by law, we will not be liable for indirect,
                    incidental, special, consequential, or punitive damages, or any loss of data,
                    revenue, or profits, arising from or related to your use of the Service.
                  </p>
                </section>

                <section id="accuracy" className="pt-4 mt-2">
                  <h2 className="h5 fw-semibold mb-3">8. Accuracy & Availability</h2>
                  <p>
                    We strive for accuracy and uptime but make no guarantee that the Service or
                    materials are error‑free or continuously available. Content and features may
                    change without notice.
                  </p>
                </section>

                <section id="links" className="pt-4 mt-2">
                  <h2 className="h5 fw-semibold mb-3">9. Third‑Party Links</h2>
                  <p>
                    The Service may include links to third‑party sites or services. We are not
                    responsible for their content or practices. Use of third‑party services is at
                    your own risk and subject to their terms.
                  </p>
                </section>

                <section id="modifications" className="pt-4 mt-2">
                  <h2 className="h5 fw-semibold mb-3">10. Changes to the Service & Terms</h2>
                  <p>
                    We may update the Service and these Terms. We will post updates here and revise
                    the “Last updated” date above. Your continued use constitutes acceptance of the
                    updated Terms.
                  </p>
                </section>

                <section id="termination" className="pt-4 mt-2">
                  <h2 className="h5 fw-semibold mb-3">11. Suspension & Termination</h2>
                  <p>
                    We may suspend or terminate access if you violate these Terms or if necessary to
                    protect the Service or other users. You may stop using the Service at any time.
                  </p>
                </section>

                <section id="governing-law" className="pt-4 mt-2">
                  <h2 className="h5 fw-semibold mb-3">12. Governing Law</h2>
                  <p>
                    These Terms are governed by the laws applicable in your place of residence or, if
                    required, the jurisdiction where the Service is offered. Courts in that
                    jurisdiction will have exclusive jurisdiction over disputes, except where
                    applicable law provides otherwise.
                  </p>
                </section>

                <section id="contact" className="pt-4 mt-2">
                  <h2 className="h5 fw-semibold mb-3">13. Contact</h2>
                  <address className="mb-0">
                    <p className="mb-1">
                      <strong>Email: </strong>
                      <a className="link-primary" href="mailto:support@pocketpenny.tekimart.com">
                        support@pocketpenny.tekimart.com
                      </a>
                    </p>
                  </address>
                </section>

                <div className="d-flex mt-4">
                  <a href="#top" className="ms-auto small link-secondary text-decoration-none">
                    Back to top ↑
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Side panel */}
          <aside className="col-12 col-lg-4">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <h3 className="h6 fw-semibold mb-3">Summary</h3>
                <ul className="list-unstyled small mb-3">
                  <li className="mb-1">• Personal, non‑commercial license.</li>
                  <li className="mb-1">• No warranties; informational use only.</li>
                  <li className="mb-1">• Liability limited to the fullest extent permitted.</li>
                  <li className="mb-1">• You own your imported data.</li>
                </ul>
                <div className="border rounded p-3">
                  <div className="text-muted small mb-1">Need help?</div>
                  <a className="btn btn-outline-primary btn-sm" href="mailto:support@pocketpenny.tekimart.com">
                    Contact support
                  </a>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
