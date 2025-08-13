import React from "react";
import MarketingNavbar from "../MarketingNavbar/MarketingNavbar";
import MarketingFooter from "../MarketingFooter/MarketingFooter";

export default function TermsPage(){
  const termsContent = `
    <h1 class="h3 fw-bold mb-4">Terms of Service</h1>
    
    <p class="text-muted mb-4">Last updated: ${new Date().toLocaleDateString()}</p>
    
    <div class="mb-4">
      <h2 class="h5 fw-bold mb-3">1. Acceptance of Terms</h2>
      <p>By accessing and using this application, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.</p>
    </div>
    
    <div class="mb-4">
      <h2 class="h5 fw-bold mb-3">2. Use License</h2>
      <p>Permission is granted to temporarily download one copy of the application for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:</p>
      <ul class="ms-4">
        <li>Modify or copy the materials</li>
        <li>Use the materials for any commercial purpose or for any public display</li>
        <li>Attempt to reverse engineer any software contained in the application</li>
        <li>Remove any copyright or other proprietary notations from the materials</li>
      </ul>
    </div>
    
    <div class="mb-4">
      <h2 class="h5 fw-bold mb-3">3. Disclaimer</h2>
      <p>The materials within this application are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
    </div>
    
    <div class="mb-4">
      <h2 class="h5 fw-bold mb-3">4. Limitations</h2>
      <p>In no event shall we or our suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on our application, even if we or an authorized representative has been notified orally or in writing of the possibility of such damage.</p>
    </div>
    
    <div class="mb-4">
      <h2 class="h5 fw-bold mb-3">5. Accuracy of Materials</h2>
      <p>The materials appearing in our application could include technical, typographical, or photographic errors. We do not warrant that any of the materials on our application are accurate, complete, or current. We may make changes to the materials contained on our application at any time without notice.</p>
    </div>
    
    <div class="mb-4">
      <h2 class="h5 fw-bold mb-3">6. Links</h2>
      <p>We have not reviewed all of the sites linked to our application and are not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by us of the site. Use of any such linked website is at the user's own risk.</p>
    </div>
    
    <div class="mb-4">
      <h2 class="h5 fw-bold mb-3">7. Modifications</h2>
      <p>We may revise these terms of service for our application at any time without notice. By using this application, you are agreeing to be bound by the then current version of these Terms of Service.</p>
    </div>
    
    <div class="mb-4">
      <h2 class="h5 fw-bold mb-3">8. Governing Law</h2>
      <p>These terms and conditions are governed by and construed in accordance with the laws and you irrevocably submit to the exclusive jurisdiction of the courts in that location.</p>
    </div>
    
    <div class="mb-4">
      <h2 class="h5 fw-bold mb-3">9. Contact Information</h2>
      <p>If you have any questions about these Terms of Service, please contact us at support@example.com.</p>
    </div>
  `;

  return (
    <div className="d-flex flex-column min-vh-100 bg-body text-body">
      <MarketingNavbar />
      <main className="container py-5">
        <div 
          dangerouslySetInnerHTML={{ __html: termsContent }}
          className="terms-content"
        />
      </main>
      <MarketingFooter />
    </div>
  );
}