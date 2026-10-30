
import { useEffect, useState } from 'react';
import {
  requestPasswordReset,
  resetPassword,
} from '../../services/authService';
import './AuthPages.css';

const ROLES = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'HR_MANAGER', label: 'HR Manager' },
  { value: 'TEAM_LEADER', label: 'Team Leader' },
  { value: 'EMPLOYEE', label: 'Employee' },
];

const THEME_KEY = 'hrms-home-theme';

function getSavedTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    return ['light', 'dark', 'comfort'].includes(saved) ? saved : 'light';
  } catch {
    return 'light';
  }
}

export default function AuthPages({
  initialMode = 'login',
  onBack,
  onLogin,
  onRegister,
}) {
  const [mode, setMode] = useState(initialMode);
  const [theme, setTheme] = useState(getSavedTheme);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
    role: 'EMPLOYEE',
    remember: true,
  });

  const [registerForm, setRegisterForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    department: '',
    designation: '',
    role: 'EMPLOYEE',
    password: '',
    confirmPassword: '',
    agree: false,
  });

  const [forgotEmail, setForgotEmail] = useState('');
  const [resetPasswordForm, setResetPasswordForm] = useState({
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');

    if (token) {
      setMode('reset');
      setError('');
      setSuccess('');
    } else {
      setMode(initialMode);
    }
  }, [initialMode]);

  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
    }
  }, [theme]);

  function changeMode(nextMode) {
    setMode(nextMode);
    setError('');
    setSuccess('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  }

  function updateLogin(event) {
    const { name, value, checked, type } = event.target;

    setLoginForm((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  function updateRegister(event) {
    const { name, value, checked, type } = event.target;

    setRegisterForm((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  function updateResetPassword(event) {
    const { name, value } = event.target;

    setResetPasswordForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function submitLogin(event) {
    event.preventDefault();
    setError('');
    setSuccess('');

    const email = loginForm.email.trim().toLowerCase();

    if (!email || !loginForm.password) {
      setError('Please enter your email and password.');
      return;
    }

    if (typeof onLogin !== 'function') {
      setError('Login handler is not connected. Please check App.jsx.');
      return;
    }

    setLoading(true);

    try {
      await onLogin({
        email,
        password: loginForm.password,
        role: loginForm.role,
        remember: loginForm.remember,
      });
    } catch (err) {
      setError(
        err?.message ||
          'Login failed. Please check your details and try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function submitRegister(event) {
    event.preventDefault();
    setError('');
    setSuccess('');

    const fullName = registerForm.fullName.trim();
    const email = registerForm.email.trim().toLowerCase();
    const phone = registerForm.phone.trim();
    const department = registerForm.department.trim();
    const designation = registerForm.designation.trim();
    const password = registerForm.password;

    if (!fullName) {
      setError('Please enter your full name.');
      return;
    }

    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    if (password.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }

    if (password !== registerForm.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!registerForm.agree) {
      setError('Please accept the terms to continue.');
      return;
    }

    if (typeof onRegister !== 'function') {
      setError('Registration handler is not connected. Please check App.jsx.');
      return;
    }

    setLoading(true);

    try {
      await onRegister({
        fullName,
        email,
        phone,
        department,
        designation,
        role: 'EMPLOYEE',
        password,
      });

      setSuccess(
        'Registration successful! Your account has been created. You can now sign in.'
      );

      setRegisterForm({
        fullName: '',
        email: '',
        phone: '',
        department: '',
        designation: '',
        role: 'EMPLOYEE',
        password: '',
        confirmPassword: '',
        agree: false,
      });

      setShowPassword(false);
      setShowConfirmPassword(false);
    } catch (err) {
      setError(
        err?.message ||
          'Registration failed. Please check your details and try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function submitForgotPassword(event) {
    event.preventDefault();
    setError('');
    setSuccess('');

    const email = forgotEmail.trim().toLowerCase();

    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);

    try {
      await requestPasswordReset(email);

      setSuccess(
        'If an account exists for this email, password reset instructions will be sent shortly.'
      );
    } catch (err) {
      setError(
        err?.message ||
          'Unable to process your request. Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function submitNewPassword(event) {
    event.preventDefault();
    setError('');
    setSuccess('');

    const password = resetPasswordForm.password;
    const confirmPassword = resetPasswordForm.confirmPassword;
    const token = new URLSearchParams(window.location.search).get('token');

    if (!token) {
      setError(
        'The password reset link is missing or invalid. Please request a new one.'
      );
      return;
    }

    if (password.length < 8) {
      setError('Your new password must contain at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await resetPassword(token, password);

      setResetPasswordForm({
        password: '',
        confirmPassword: '',
      });

      window.history.replaceState({}, '', '/auth');

      setMode('login');
      setLoginForm((previous) => ({
        ...previous,
        password: '',
      }));

      setSuccess(
        'Your password has been reset successfully. Please sign in with your new password.'
      );
    } catch (err) {
      setError(
        err?.message ||
          'Password reset failed. Your link may have expired. Please request a new one.'
      );
    } finally {
      setLoading(false);
    }
  }

  const isAccountMode = mode === 'login' || mode === 'register';

  const heading = {
    login: {
      eyebrow: 'WELCOME BACK',
      title: 'Sign in to your account',
      description: 'Enter your account details to continue.',
    },
    register: {
      eyebrow: 'GET STARTED',
      title: 'Create your account',
      description: 'Enter your details to get started with PeopleSphere.',
    },
    forgot: {
      eyebrow: 'ACCOUNT RECOVERY',
      title: 'Forgot your password?',
      description:
        'Enter your registered email address and we will help you reset your password.',
    },
    reset: {
      eyebrow: 'CREATE A NEW PASSWORD',
      title: 'Reset your password',
      description: 'Choose a new, secure password for your account.',
    },
  }[mode] || {
    eyebrow: 'WELCOME BACK',
    title: 'Sign in to your account',
    description: 'Enter your account details to continue.',
  };

  return (
    <main className={`auth-page theme-${theme}`}>
      <header className="auth-topbar">
        <button className="auth-brand" type="button" onClick={onBack}>
          <span className="auth-brand-mark">P</span>
          <span>
            <strong>PeopleSphere</strong>
            <small>Human Resource Management</small>
          </span>
        </button>

        <div className="auth-topbar-actions">
          <label className="theme-picker">
            <span aria-hidden="true">◐</span>
            <select
              aria-label="Choose theme"
              value={theme}
              onChange={(event) => setTheme(event.target.value)}
            >
              <option value="light">Light theme</option>
              <option value="dark">Dark theme</option>
              <option value="comfort">Eye comfort</option>
            </select>
          </label>

          {onBack && (
            <button
              className="auth-back-button"
              type="button"
              onClick={onBack}
            >
              ← Home
            </button>
          )}
        </div>
      </header>

      <section className="auth-main">
        <aside className="auth-promo">
          <div className="auth-promo-badge">
            <span className="auth-pulse-dot" />
            YOUR WORKPLACE, CONNECTED
          </div>

          <h1>
            People first.
            <br />
            <span>Work made simpler.</span>
          </h1>

          <p className="auth-promo-description">
            One secure workspace for your people, attendance, leave, payroll,
            and everyday HR operations.
          </p>

          <div className="auth-benefit-list">
            <div className="auth-benefit">
              <span className="auth-benefit-icon">✓</span>
              <div>
                <strong>Everything in one place</strong>
                <p>Manage everyday HR activities with less effort.</p>
              </div>
            </div>

            <div className="auth-benefit">
              <span className="auth-benefit-icon">⌁</span>
              <div>
                <strong>Role-based workspace</strong>
                <p>Access tools according to your assigned role.</p>
              </div>
            </div>

            <div className="auth-benefit">
              <span className="auth-benefit-icon">◷</span>
              <div>
                <strong>Stay up to date</strong>
                <p>Keep track of attendance, leave, and updates.</p>
              </div>
            </div>
          </div>

          <div className="auth-promo-bottom">
            <span className="auth-avatar-stack" aria-hidden="true">
              <i>H</i>
              <i>T</i>
              <i>E</i>
            </span>
            <span>Built for teams, designed for people.</span>
          </div>
        </aside>

        <section className="auth-form-panel">
          <div className="auth-form-card">
            <div className="auth-mobile-brand">
              <span className="auth-brand-mark">P</span>
              <strong>PeopleSphere</strong>
            </div>

            {isAccountMode && (
              <div
                className="auth-mode-switch"
                role="tablist"
                aria-label="Account action"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'login'}
                  className={mode === 'login' ? 'active' : ''}
                  onClick={() => changeMode('login')}
                >
                  Sign in
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'register'}
                  className={mode === 'register' ? 'active' : ''}
                  onClick={() => changeMode('register')}
                >
                  Create account
                </button>
              </div>
            )}

            <div className="auth-form-heading">
              <span className="auth-eyebrow">{heading.eyebrow}</span>
              <h2>{heading.title}</h2>
              <p>{heading.description}</p>
            </div>

            {error && (
              <div className="auth-message auth-error" role="alert">
                <span>!</span> {error}
              </div>
            )}

            {success && (
              <div className="auth-message auth-success" role="status">
                <span>✓</span> {success}
                {mode === 'register' && (
                  <button type="button" onClick={() => changeMode('login')}>
                    Sign in
                  </button>
                )}
              </div>
            )}

            {mode === 'login' && (
              <form className="auth-form" onSubmit={submitLogin}>
                <label className="auth-field">
                  <span>Email address</span>
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon" aria-hidden="true">
                      ✉
                    </span>
                    <input
                      type="email"
                      name="email"
                      value={loginForm.email}
                      onChange={updateLogin}
                      placeholder="you@company.com"
                      autoComplete="email"
                      required
                    />
                  </div>
                </label>

                <label className="auth-field">
                  <span>Account role</span>
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon" aria-hidden="true">
                      ♙
                    </span>
                    <select
                      name="role"
                      value={loginForm.role}
                      onChange={updateLogin}
                    >
                      {ROLES.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </label>

                <label className="auth-field">
                  <span>Password</span>
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon" aria-hidden="true">
                      ▣
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={loginForm.password}
                      onChange={updateLogin}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      required
                    />
                    <button
                      className="auth-password-toggle"
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={
                        showPassword ? 'Hide password' : 'Show password'
                      }
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </label>

                <div className="auth-form-options">
                  <label className="auth-checkbox">
                    <input
                      type="checkbox"
                      name="remember"
                      checked={loginForm.remember}
                      onChange={updateLogin}
                    />
                    <span>Remember me</span>
                  </label>

                  <button
                    type="button"
                    className="auth-forgot-link"
                    onClick={() => {
                      setForgotEmail(loginForm.email);
                      changeMode('forgot');
                    }}
                  >
                    Forgot Password?
                  </button>
                </div>

                <button
                  className="auth-submit-button"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Signing in…' : 'Sign in to PeopleSphere'}
                  {!loading && <span aria-hidden="true">→</span>}
                </button>

                <p className="auth-switch-copy">
                  New to PeopleSphere?{' '}
                  <button
                    type="button"
                    onClick={() => changeMode('register')}
                  >
                    Create an account
                  </button>
                </p>
              </form>
            )}

            {mode === 'register' && (
              <form className="auth-form" onSubmit={submitRegister}>
                <div className="auth-field-grid">
                  <label className="auth-field">
                    <span>Full name</span>
                    <input
                      type="text"
                      name="fullName"
                      value={registerForm.fullName}
                      onChange={updateRegister}
                      placeholder="Your full name"
                      autoComplete="name"
                      required
                    />
                  </label>

                  <label className="auth-field">
                    <span>Phone number</span>
                    <input
                      type="tel"
                      name="phone"
                      value={registerForm.phone}
                      onChange={updateRegister}
                      placeholder="Phone number"
                      autoComplete="tel"
                    />
                  </label>
                </div>

                <label className="auth-field">
                  <span>Work email</span>
                  <input
                    type="email"
                    name="email"
                    value={registerForm.email}
                    onChange={updateRegister}
                    placeholder="you@company.com"
                    autoComplete="email"
                    required
                  />
                </label>

                <div className="auth-field-grid">
                  <label className="auth-field">
                    <span>Department</span>
                    <input
                      type="text"
                      name="department"
                      value={registerForm.department}
                      onChange={updateRegister}
                      placeholder="e.g. Engineering"
                    />
                  </label>

                  <label className="auth-field">
                    <span>Designation</span>
                    <input
                      type="text"
                      name="designation"
                      value={registerForm.designation}
                      onChange={updateRegister}
                      placeholder="e.g. Developer"
                    />
                  </label>
                </div>

                <label className="auth-field">
                  <span>Requested role</span>
                  <select
                    name="role"
                    value={registerForm.role}
                    onChange={updateRegister}
                  >
                    {ROLES.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>

                  <small className="auth-field-help">
                    New public registrations are created as Employee accounts.
                    Privileged roles must be assigned by an administrator.
                  </small>
                </label>

                <div className="auth-field-grid">
                  <label className="auth-field">
                    <span>Password</span>
                    <div className="auth-input-wrap">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={registerForm.password}
                        onChange={updateRegister}
                        placeholder="At least 8 characters"
                        autoComplete="new-password"
                        minLength={8}
                        required
                      />
                      <button
                        className="auth-password-toggle"
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        aria-label={
                          showPassword ? 'Hide password' : 'Show password'
                        }
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </label>

                  <label className="auth-field">
                    <span>Confirm password</span>
                    <div className="auth-input-wrap">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={registerForm.confirmPassword}
                        onChange={updateRegister}
                        placeholder="Repeat password"
                        autoComplete="new-password"
                        minLength={8}
                        required
                      />
                      <button
                        className="auth-password-toggle"
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword((value) => !value)
                        }
                        aria-label={
                          showConfirmPassword
                            ? 'Hide password'
                            : 'Show password'
                        }
                      >
                        {showConfirmPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </label>
                </div>

                <label className="auth-checkbox auth-terms">
                  <input
                    type="checkbox"
                    name="agree"
                    checked={registerForm.agree}
                    onChange={updateRegister}
                  />
                  <span>
                    I agree to the organization's terms and privacy policy.
                  </span>
                </label>

                <button
                  className="auth-submit-button"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Creating account…' : 'Create account'}
                  {!loading && <span aria-hidden="true">→</span>}
                </button>

                <p className="auth-switch-copy">
                  Already registered?{' '}
                  <button type="button" onClick={() => changeMode('login')}>
                    Sign in
                  </button>
                </p>
              </form>
            )}

            {mode === 'forgot' && (
              <form className="auth-form" onSubmit={submitForgotPassword}>
                <label className="auth-field">
                  <span>Registered email address</span>
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon" aria-hidden="true">
                      ✉
                    </span>
                    <input
                      type="email"
                      name="forgotEmail"
                      value={forgotEmail}
                      onChange={(event) => setForgotEmail(event.target.value)}
                      placeholder="you@company.com"
                      autoComplete="email"
                      required
                    />
                  </div>
                </label>

                <button
                  className="auth-submit-button"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Sending instructions…' : 'Send reset instructions'}
                  {!loading && <span aria-hidden="true">→</span>}
                </button>

                <p className="auth-switch-copy">
                  Remember your password?{' '}
                  <button type="button" onClick={() => changeMode('login')}>
                    Back to sign in
                  </button>
                </p>
              </form>
            )}

            {mode === 'reset' && (
              <form className="auth-form" onSubmit={submitNewPassword}>
                <label className="auth-field">
                  <span>New password</span>
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon" aria-hidden="true">
                      ▣
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={resetPasswordForm.password}
                      onChange={updateResetPassword}
                      placeholder="At least 8 characters"
                      autoComplete="new-password"
                      minLength={8}
                      required
                    />
                    <button
                      className="auth-password-toggle"
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={
                        showPassword ? 'Hide password' : 'Show password'
                      }
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </label>

                <label className="auth-field">
                  <span>Confirm new password</span>
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon" aria-hidden="true">
                      ▣
                    </span>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={resetPasswordForm.confirmPassword}
                      onChange={updateResetPassword}
                      placeholder="Enter your new password again"
                      autoComplete="new-password"
                      minLength={8}
                      required
                    />
                    <button
                      className="auth-password-toggle"
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword((value) => !value)
                      }
                      aria-label={
                        showConfirmPassword
                          ? 'Hide password'
                          : 'Show password'
                      }
                    >
                      {showConfirmPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </label>

                <button
                  className="auth-submit-button"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Resetting password…' : 'Reset password'}
                  {!loading && <span aria-hidden="true">→</span>}
                </button>

                <p className="auth-switch-copy">
                  <button type="button" onClick={() => changeMode('forgot')}>
                    Request a new reset link
                  </button>
                </p>
              </form>
            )}

            <div className="auth-card-footer">
              <span>© {new Date().getFullYear()} PeopleSphere</span>
              <span>
                <i /> Secure HR workspace
              </span>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
