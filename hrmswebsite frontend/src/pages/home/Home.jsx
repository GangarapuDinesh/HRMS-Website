import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
const features = [
  {
    icon: '👥',
    title: 'Employee Management',
    description:
      'Keep employee profiles, departments, and company records organized in one place.',
    number: '01',
  },
  {
    icon: '⏱️',
    title: 'Attendance Tracking',
    description:
      'Manage daily check-ins, check-outs, work hours, and attendance records.',
    number: '02',
  },
  {
    icon: '🌴',
    title: 'Leave Management',
    description:
      'Submit leave requests, review approvals, and track available leave balances.',
    number: '03',
  },
  {
    icon: '💳',
    title: 'Payroll Management',
    description:
      'Organize salary information and make payslips accessible to employees.',
    number: '04',
  },
];

const steps = [
  {
    number: '01',
    icon: '👤',
    title: 'Create your account',
    description:
      'Register your account and get ready to access your personalized HR workspace.',
  },
  {
    number: '02',
    icon: '⚙️',
    title: 'Manage your workspace',
    description:
      'Organize employee records, attendance, leave requests, and other HR activities.',
  },
  {
    number: '03',
    icon: '📊',
    title: 'Stay organized',
    description:
      'Access important workforce information from one convenient platform.',
  },
];

const socialLinks = [
  { name: 'LinkedIn', icon: 'in', url: 'https://www.linkedin.com/' },
  { name: 'GitHub', icon: '⌘', url: 'https://github.com/' },
  { name: 'Instagram', icon: '◎', url: 'https://www.instagram.com/' },
  { name: 'Facebook', icon: 'f', url: 'https://www.facebook.com/' },
  { name: 'X', icon: '𝕏', url: 'https://x.com/' },
];

function getSavedTheme() {
  try {
    const savedTheme = localStorage.getItem('hrms-home-theme');
    return ['light', 'dark', 'comfort'].includes(savedTheme)
      ? savedTheme
      : 'light';
  } catch {
    return 'light';
  }
}

export default function Home({ onLogin, onRegister }) {
  const [theme, setTheme] = useState(getSavedTheme);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.hrmsTheme = theme;

    try {
      localStorage.setItem('hrms-home-theme', theme);
    } catch {
      return () => {
        delete document.documentElement.dataset.hrmsTheme;
      };
    }

    return () => {
      delete document.documentElement.dataset.hrmsTheme;
    };
  }, [theme]);

  function chooseTheme(nextTheme) {
    setTheme(nextTheme);
  }

  function goToAuth(action) {
    setMenuOpen(false);
    action?.();
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <main className={`hrms-home theme-${theme}`} id="home">
      <header className="home-navbar">
        <a
          className="home-brand"
          href="#home"
          aria-label="PeopleSphere home"
          onClick={closeMenu}
        >
          <span className="home-brand-icon">H</span>
          <span>
            People<span className="brand-accent">Sphere</span>
          </span>
        </a>

        <button
          className="mobile-menu-toggle"
          type="button"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span>{menuOpen ? '✕' : '☰'}</span>
        </button>

        <nav
          className={`home-nav-links ${menuOpen ? 'mobile-nav-open' : ''}`}
          aria-label="Main navigation"
        >
          <a className="nav-current" href="#home" onClick={closeMenu}>
            Home
          </a>
          <a href="#features" onClick={closeMenu}>
            Features
          </a>
          <a href="#how-it-works" onClick={closeMenu}>
            How It Works
          </a>
          <a href="#about" onClick={closeMenu}>
            About
          </a>
          <a href="#contact" onClick={closeMenu}>
            Contact
          </a>

          <div className="mobile-nav-actions">
            <button onClick={() => goToAuth(onLogin)}>Login</button>
            <button onClick={() => goToAuth(onRegister)}>
              Get Started ↗
            </button>
          </div>

          {menuOpen && (
            <div className="mobile-theme-picker">
              <span>Appearance</span>
              <div className="theme-picker" role="group" aria-label="Choose page theme">
                <button
                  type="button"
                  className={theme === 'light' ? 'theme-choice selected' : 'theme-choice'}
                  onClick={() => chooseTheme('light')}
                  aria-pressed={theme === 'light'}
                >
                  ☀ Light
                </button>
                <button
                  type="button"
                  className={theme === 'dark' ? 'theme-choice selected' : 'theme-choice'}
                  onClick={() => chooseTheme('dark')}
                  aria-pressed={theme === 'dark'}
                >
                  ☾ Dark
                </button>
                <button
                  type="button"
                  className={theme === 'comfort' ? 'theme-choice selected' : 'theme-choice'}
                  onClick={() => chooseTheme('comfort')}
                  aria-pressed={theme === 'comfort'}
                >
                  ◐ Comfort
                </button>
              </div>
            </div>
          )}
        </nav>

        <div className="home-nav-actions desktop-nav-actions">
          <div className="theme-picker" role="group" aria-label="Choose page theme">
            <button
              type="button"
              className={theme === 'light' ? 'theme-choice selected' : 'theme-choice'}
              onClick={() => chooseTheme('light')}
              aria-label="Light theme"
              aria-pressed={theme === 'light'}
              title="Light theme"
            >
              ☀
            </button>
            <button
              type="button"
              className={theme === 'dark' ? 'theme-choice selected' : 'theme-choice'}
              onClick={() => chooseTheme('dark')}
              aria-label="Dark theme"
              aria-pressed={theme === 'dark'}
              title="Dark theme"
            >
              ☾
            </button>
            <button
              type="button"
              className={theme === 'comfort' ? 'theme-choice selected' : 'theme-choice'}
              onClick={() => chooseTheme('comfort')}
              aria-label="Eye comfort theme"
              aria-pressed={theme === 'comfort'}
              title="Eye comfort theme"
            >
              ◐
            </button>
          </div>

          <button className="home-login-button" onClick={onLogin}>
            Login
          </button>
          <button className="home-register-button" onClick={onRegister}>
            Get Started <span aria-hidden="true">↗</span>
          </button>
        </div>
      </header>

      <section className="home-hero">
        <div className="hero-copy">
          <div className="hero-pill">
            <span className="hero-pill-dot" />
            SMARTER HUMAN RESOURCE MANAGEMENT
          </div>

          <h1>
            Great people.
            <br />
            <span>Stronger</span> workplaces.
          </h1>

          <p className="hero-description">
            Bring your people, processes, and workplace operations together.
            Manage your workforce with one simple, modern HRMS platform.
          </p>

          <div className="hero-buttons">
            <button
              className="hero-primary-button"
              onClick={() => goToAuth(onRegister)}
            >
              Explore HRMS <span aria-hidden="true">→</span>
            </button>
            <button
              className="hero-secondary-button"
              onClick={() => goToAuth(onLogin)}
            >
              Sign in to your account
            </button>
          </div>

          <div className="hero-trust">
            <div className="trust-avatars" aria-hidden="true">
              <span>A</span>
              <span>R</span>
              <span>M</span>
              <span>+</span>
            </div>
            <p>
              <strong>One connected workspace</strong>
              <br />
              Built for modern HR teams
            </p>
          </div>
        </div>

        <div className="hero-visual" aria-label="Illustration of an HR dashboard">
          <div className="visual-orbit orbit-one" />
          <div className="visual-orbit orbit-two" />

          <div className="floating-card floating-card-top">
            <span className="floating-icon attendance-icon">✓</span>
            <div>
              <strong>Attendance</strong>
              <small>Daily tracking</small>
            </div>
            <span className="status-dot" />
          </div>

          <div className="dashboard-preview">
            <div className="preview-header">
              <div>
                <span className="preview-eyebrow">WORKSPACE OVERVIEW</span>
                <h3>Your people, at a glance</h3>
              </div>
              <span className="preview-menu">•••</span>
            </div>

            <div className="preview-welcome">
              <div>
                <span>Welcome to your</span>
                <strong>HR workspace</strong>
              </div>
              <div className="preview-profile">HR</div>
            </div>

            <div className="preview-stats">
              <div className="preview-stat">
                <span className="stat-icon purple-stat">♙</span>
                <small>Employees</small>
                <strong>People first</strong>
                <span className="stat-caption">Employee records</span>
              </div>
              <div className="preview-stat">
                <span className="stat-icon blue-stat">◷</span>
                <small>Attendance</small>
                <strong>Stay on track</strong>
                <span className="stat-caption">Daily activity</span>
              </div>
            </div>

            <div className="preview-bottom">
              <div className="preview-bottom-icon">✦</div>
              <div>
                <strong>Everything in one place</strong>
                <span>People · Leave · Payroll · Growth</span>
              </div>
            </div>
          </div>

          <div className="floating-card floating-card-bottom">
            <span className="floating-icon leave-icon">✦</span>
            <div>
              <strong>Leave management</strong>
              <small>Simple approval workflows</small>
            </div>
          </div>

          <div className="hero-sparkle sparkle-one">✳</div>
          <div className="hero-sparkle sparkle-two">✦</div>
        </div>
      </section>

      <section className="home-features" id="features">
        <div className="section-heading">
          <span className="section-kicker">ONE PLATFORM. MANY POSSIBILITIES.</span>
          <h2>Everything your people need</h2>
          <p>Essential HR tools, thoughtfully brought together.</p>
        </div>

        <div className="feature-grid">
          {features.map((feature) => (
            <article className="feature-card" key={feature.number}>
              <div className="feature-card-top">
                <span className="feature-icon">{feature.icon}</span>
                <span className="feature-number">{feature.number}</span>
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <button
                className="feature-link"
                onClick={onLogin}
                aria-label={`Sign in to access ${feature.title}`}
              >
                Discover more <span aria-hidden="true">↗</span>
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="home-how-it-works" id="how-it-works">
        <div className="section-heading">
          <span className="section-kicker">GET STARTED IN THREE STEPS</span>
          <h2>How PeopleSphere works</h2>
          <p>
            A straightforward way to bring everyday HR activities together.
          </p>
        </div>

        <div className="how-it-works-grid">
          {steps.map((step) => (
            <article className="how-it-works-card" key={step.number}>
              <div className="how-step-top">
                <span className="how-step-icon">{step.icon}</span>
                <span className="how-step-number">{step.number}</span>
              </div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>

        <div className="how-it-works-cta">
          <div>
            <h3>Ready to get started?</h3>
            <p>Create your account and explore your HR workspace.</p>
          </div>
          <button
            className="home-register-button"
            onClick={() => goToAuth(onRegister)}
          >
            Create an account <span aria-hidden="true">↗</span>
          </button>
        </div>
      </section>

      <section className="home-about" id="about">
        <div className="about-symbol">✳</div>
        <div>
          <span className="section-kicker">PEOPLE ARE YOUR GREATEST ASSET</span>
          <h2>Less paperwork. More people focus.</h2>
          <p>
            A centralized workspace designed to make everyday HR tasks
            clearer, more organized, and easier to manage.
          </p>
        </div>
        <button className="about-button" onClick={() => goToAuth(onRegister)}>
          Get started <span aria-hidden="true">→</span>
        </button>
      </section>

      <footer className="home-footer" id="contact">
        <div className="footer-main">
          <div className="footer-about">
            <a className="home-brand footer-brand" href="#home">
              <span className="home-brand-icon">H</span>
              <span>
                People<span className="brand-accent">Sphere</span>
              </span>
            </a>
            <p>
              Bringing people and workplaces together with simpler,
              smarter human resource management.
            </p>
            <div className="footer-socials" aria-label="Social media links">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Visit ${social.name}`}
                  title={social.name}
                >
                  <span aria-hidden="true">{social.icon}</span>
                </a>
              ))}
            </div>
          </div>

          <div className="footer-column">
            <h3>Explore</h3>
            <a href="#home">Home</a>
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
            <a href="#about">About us</a>
          </div>

          <div className="footer-column">
            <h3>HRMS Features</h3>
            <a href="#features">Employee management</a>
            <a href="#features">Attendance</a>
            <a href="#features">Leave management</a>
            <a href="#features">Payroll</a>
          </div>

          <div className="footer-column">
            <h3>Your Workspace</h3>
            <button onClick={() => goToAuth(onLogin)}>Login</button>
            <button onClick={() => goToAuth(onRegister)}>Create an account</button>
            <a href="#contact">Contact</a>
          </div>
        </div>

        <div className="footer-policy-row">
          <span className="footer-policy-label">Legal &amp; Policies</span>
          <nav className="footer-legal-links" aria-label="Legal policies">
            <Link to="/terms" onClick={closeMenu}>
              Terms of Service
            </Link>
            <Link to="/privacy-policy" onClick={closeMenu}>
              Privacy Policy
            </Link>
            <Link to="/cookie-policy" onClick={closeMenu}>
              Cookie Policy
            </Link>
          </nav>
        </div>

        <div className="footer-bottom">
          <p>
            © {new Date().getFullYear()} PeopleSphere HRMS. All rights reserved.
          </p>
          <a href="#home">Back to top ↑</a>
        </div>
      </footer>
    </main>
  );
}
