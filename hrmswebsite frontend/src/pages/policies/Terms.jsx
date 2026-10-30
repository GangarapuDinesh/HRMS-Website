
import { Link } from "react-router-dom";
import "./Terms.css";

export default function Terms() {
  return (
    <main className="policy-page">
      <header className="policy-header">
        <Link to="/" className="policy-brand">
          <span className="policy-brand-icon">H</span>
          People<span>Sphere</span>
        </Link>
        <Link to="/" className="policy-home-link">← Back to Home</Link>
      </header>

      <article className="policy-content">
        <span className="policy-label">LEGAL INFORMATION</span>
        <h1>Terms of Service</h1>
        <p className="policy-intro">
          These terms describe the general rules for accessing and using the
          PeopleSphere Human Resource Management System.
        </p>

        <p className="policy-notice">
          Draft template: review and customize these terms for your organization
          before publishing them.
        </p>

        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using PeopleSphere, you agree to follow the
            applicable terms and policies established by the organization
            operating the service. If you do not agree, do not use the service.
          </p>
        </section>

        <section>
          <h2>2. About the Service</h2>
          <p>
            PeopleSphere provides HRMS features that may include employee
            records, attendance, leave management, payroll information,
            recruitment, tasks, documents, and reporting.
          </p>
        </section>

        <section>
          <h2>3. User Accounts</h2>
          <p>
            Users should provide accurate account information, keep their
            credentials confidential, and promptly report suspected
            unauthorized access. Access to features depends on the user's
            assigned role and permissions.
          </p>
        </section>

        <section>
          <h2>4. Acceptable Use</h2>
          <p>
            Users must not attempt to access information without permission,
            interfere with system security, misuse employee information, or
            use the service for unlawful activities.
          </p>
        </section>

        <section>
          <h2>5. Employee and Company Information</h2>
          <p>
            Users must access, enter, update, and share employee information
            only as authorized by their organization and applicable policies.
            The organization is responsible for defining appropriate access
            permissions and handling employment records lawfully.
          </p>
        </section>

        <section>
          <h2>6. Service Availability</h2>
          <p>
            Features may be updated, maintained, or temporarily unavailable.
            The organization operating the system should establish appropriate
            backup, recovery, and service-support procedures.
          </p>
        </section>

        <section>
          <h2>7. Changes to These Terms</h2>
          <p>
            These terms may be revised when the service or applicable
            requirements change. Users should review the latest published
            version.
          </p>
        </section>

        <section>
          <h2>8. Contact</h2>
          <p>
            For questions about these terms, contact your organization's HR
            administrator or the designated PeopleSphere service administrator.
          </p>
        </section>

        <div className="policy-related-links">
          <Link to="/privacy-policy">Privacy Policy</Link>
          <Link to="/cookie-policy">Cookie Policy</Link>
        </div>
      </article>

      <footer className="policy-footer">
        © {new Date().getFullYear()} PeopleSphere HRMS
      </footer>
    </main>
  );
}
