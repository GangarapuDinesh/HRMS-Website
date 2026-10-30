import { Link } from "react-router-dom";
import "./PrivacyPolicy.css";
export default function PrivacyPolicy() {
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
        <span className="policy-label">YOUR INFORMATION MATTERS</span>
        <h1>Privacy Policy</h1>
        <p className="policy-intro">
          This draft explains the types of information an HRMS may handle and
          the practices its operator should define for protecting that
          information.
        </p>

        <p className="policy-notice">
          Draft template: the organization must confirm its actual data
          practices, legal obligations, contact details, and retention periods
          before publishing this policy.
        </p>

        <section>
          <h2>1. Information We May Handle</h2>
          <p>
            Depending on the enabled features, PeopleSphere may process names,
            work email addresses, employee identifiers, department details,
            attendance records, leave requests, payroll information,
            recruitment records, documents, and task or performance data.
          </p>
        </section>

        <section>
          <h2>2. How Information May Be Used</h2>
          <p>
            Information may be used to provide HR services, manage accounts,
            administer attendance and leave, support payroll workflows,
            coordinate recruitment, generate authorized reports, and maintain
            system security.
          </p>
        </section>

        <section>
          <h2>3. Access and Disclosure</h2>
          <p>
            Access should be limited to authorized users according to their
            roles and responsibilities. Information should be shared with
            service providers or other parties only where authorized and
            supported by an appropriate legal basis.
          </p>
        </section>

        <section>
          <h2>4. Security</h2>
          <p>
            The service operator should apply suitable technical and
            organizational safeguards, such as access controls, secure
            authentication, protected connections, backups, and appropriate
            incident-response procedures.
          </p>
        </section>

        <section>
          <h2>5. Retention and Deletion</h2>
          <p>
            Personal information should be retained only as long as necessary
            for defined business and legal purposes, following the
            organization's retention schedule and applicable requirements.
          </p>
        </section>

        <section>
          <h2>6. Individual Rights and Requests</h2>
          <p>
            Depending on applicable law, individuals may have rights relating
            to access, correction, deletion, or other handling of their
            information. Contact the responsible organization to submit a
            request.
          </p>
        </section>

        <section>
          <h2>7. Policy Updates</h2>
          <p>
            This policy should be updated when data practices, system features,
            or applicable legal requirements change.
          </p>
        </section>

        <section>
          <h2>8. Privacy Contact</h2>
          <p>
            Add the organization's official privacy contact or HR
            administrator's contact details before publishing this policy.
          </p>
        </section>

        <div className="policy-related-links">
          <Link to="/terms">Terms of Service</Link>
          <Link to="/cookie-policy">Cookie Policy</Link>
        </div>
      </article>

      <footer className="policy-footer">
        © {new Date().getFullYear()} PeopleSphere HRMS
      </footer>
    </main>
  );
}
