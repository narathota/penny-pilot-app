import React from "react";
import MarketingNavbar from "../MarketingNavbar/MarketingNavbar";
import MarketingFooter from "../MarketingFooter/MarketingFooter";

export default function PrivacyPage(){
  const privacyContent = `
    <div className="privacy-content">
      <h1 className="h3 fw-bold mb-4">Privacy Policy</h1>
      <p className="text-muted mb-4">Last updated: ${new Date().toLocaleDateString()}</p>
      
      <section className="mb-4">
        <h2 className="h5 fw-semibold mb-3">1. Information We Collect</h2>
        <p>We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us for support. This may include:</p>
        <ul>
          <li>Name, email address, and contact information</li>
          <li>Account credentials and profile information</li>
          <li>Payment and billing information</li>
          <li>Communications with our support team</li>
        </ul>
      </section>

      <section className="mb-4">
        <h2 className="h5 fw-semibold mb-3">2. How We Use Your Information</h2>
        <p>We use the information we collect to:</p>
        <ul>
          <li>Provide, maintain, and improve our services</li>
          <li>Process transactions and send related information</li>
          <li>Send technical notices, updates, and support messages</li>
          <li>Respond to your comments and questions</li>
          <li>Protect against fraudulent or illegal activity</li>
        </ul>
      </section>

      <section className="mb-4">
        <h2 className="h5 fw-semibold mb-3">3. Information Sharing and Disclosure</h2>
        <p>We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except in the following circumstances:</p>
        <ul>
          <li>With your explicit consent</li>
          <li>To comply with legal obligations</li>
          <li>To protect our rights and safety</li>
          <li>In connection with a business transfer or merger</li>
        </ul>
      </section>

      <section className="mb-4">
        <h2 className="h5 fw-semibold mb-3">4. Data Security</h2>
        <p>We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.</p>
      </section>

      <section className="mb-4">
        <h2 className="h5 fw-semibold mb-3">5. Your Rights and Choices</h2>
        <p>You have the right to:</p>
        <ul>
          <li>Access and update your personal information</li>
          <li>Request deletion of your personal information</li>
          <li>Opt-out of marketing communications</li>
          <li>Request restriction of processing</li>
          <li>Data portability</li>
        </ul>
      </section>

      <section className="mb-4">
        <h2 className="h5 fw-semibold mb-3">6. Cookies and Tracking Technologies</h2>
        <p>We use cookies and similar tracking technologies to enhance your experience, analyze usage patterns, and provide personalized content. You can control cookie settings through your browser preferences.</p>
      </section>

      <section className="mb-4">
        <h2 className="h5 fw-semibold mb-3">7. Third-Party Services</h2>
        <p>Our services may contain links to third-party websites or integrate with third-party services. We are not responsible for the privacy practices of these third parties and encourage you to review their privacy policies.</p>
      </section>

      <section className="mb-4">
        <h2 className="h5 fw-semibold mb-3">8. Children's Privacy</h2>
        <p>Our services are not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you believe we have collected such information, please contact us immediately.</p>
      </section>

      <section className="mb-4">
        <h2 className="h5 fw-semibold mb-3">9. International Data Transfers</h2>
        <p>Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your information in accordance with this privacy policy.</p>
      </section>

      <section className="mb-4">
        <h2 className="h5 fw-semibold mb-3">10. Changes to This Privacy Policy</h2>
        <p>We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date. Your continued use of our services after such changes constitutes acceptance of the updated policy.</p>
      </section>

      <section className="mb-4">
        <h2 className="h5 fw-semibold mb-3">11. Contact Us</h2>
        <p>If you have any questions about this privacy policy or our data practices, please contact us at:</p>
        <div className="contact-info">
          <p><strong>Email:</strong> privacy@example.com</p>
          <p><strong>Phone:</strong> +1 (555) 123-4567</p>
          <p><strong>Address:</strong> 123 Privacy Street, Security City, SC 12345</p>
        </div>
      </section>
    </div>
  `;

  return (
    <div className="d-flex flex-column min-vh-100 bg-body text-body">
      <MarketingNavbar />
      <main className="container py-5">
        <div 
          dangerouslySetInnerHTML={{ __html: privacyContent }}
          className="privacy-policy"
        />
      </main>
      <MarketingFooter />
    </div>
  );
}