import { Link } from "react-router-dom";
import "./CookiePolicy.css";
export default function CookiePolicy() {
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
        <span className="policy-label">WEBSITE PREFERENCES</span>
        <h1>Cookie Policy</h1>
        <p className="policy-intro">
          This policy describes how cookies and similar technologies may be
          used on the PeopleSphere website.
        </p>

        <p className="policy-notice">
          Draft template: confirm which cookies and browser-storage features
          your website actually uses before publishing this policy.
        </p>

        <section>
          <h2>1. What Are Cookies?</h2>
          <p>
            Cookies are small text files that websites can store in a browser.
            They may help websites maintain sessions, remember preferences,
            and understand how their services are used.
          </p>
        </section>

        <section>
          <h2>2. How PeopleSphere May Use Storage</h2>
          <p>
            Depending on the implementation, PeopleSphere may use browser
            storage to remember display preferences and authentication-related
            information. The current homepage also saves its selected theme
            using local storage.
          </p>
        </section>

        <section>
          <h2>3. Essential Technologies</h2>
          <p>
            Technologies required for core functions, such as secure sign-in
            and navigation, should be described accurately. Essential
            authentication storage must be handled securely and appropriately.
          </p>
        </section>

        <section>
          <h2>4. Preferences and Optional Cookies</h2>
          <p>
            Preference technologies may remember settings such as a selected
            display theme. If analytics or advertising technologies are added,
            explain what they collect and provide any choices required by
            applicable law.
          </p>
        </section>

        <section>
          <h2>5. Managing Browser Storage</h2>
          <p>
            Users can review their browser's privacy settings and available
            controls to manage cookies and website storage. Disabling some
            technologies may affect website functionality.
          </p>
        </section>

        <section>
          <h2>6. Changes to This Policy</h2>
          <p>
            This policy should be reviewed whenever the website adds, removes,
            or changes cookies or similar technologies.
          </p>
        </section>

        <section>
          <h2>7. Contact</h2>
          <p>
            For questions about cookies or website storage, contact the
            organization operating PeopleSphere using its official support
            or privacy contact details.
          </p>
        </section>

        <div className="policy-related-links">
          <Link to="/terms">Terms of Service</Link>
          <Link to="/privacy-policy">Privacy Policy</Link>
        </div>
      </article>

      <footer className="policy-footer">
        © {new Date().getFullYear()} PeopleSphere HRMS
      </footer>
    </main>
  );
}
