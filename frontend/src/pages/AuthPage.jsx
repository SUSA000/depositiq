import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight, BarChart3, CheckCircle2, Eye, EyeOff,
  LockKeyhole, Mail, ShieldCheck, UserRound,
} from "lucide-react";
import { apiErrorMessage } from "../api/api";
import BrandLogo from "../components/common/BrandLogo";
import { useAuth } from "../context/AuthContext";


function PasswordField({ id, label, value, onChange, autoComplete, placeholder = "Enter your password" }) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="auth-field" htmlFor={id}>
      <span>{label}</span>
      <div className="input-with-icon">
        <LockKeyhole size={17} />
        <input id={id} type={visible ? "text" : "password"} value={value} placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)} autoComplete={autoComplete} required />
        <button type="button" onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Hide password" : "Show password"}>
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
    </label>
  );
}

function BrandPanel() {
  return (
    <section className="auth-brand-panel">
      <BrandLogo variant="light" />
      <div className="auth-brand-copy">
        <span className="auth-kicker">Bank Marketing Intelligence</span>
        <h1>Know which conversations are worth starting.</h1>
        <p>Turn customer signals into clear, responsible term-deposit outreach decisions with one focused workspace.</p>
        <div className="auth-features">
          <span><ShieldCheck /> Secure analyst workspace</span>
          <span><BarChart3 /> Real dataset intelligence</span>
          <span><CheckCircle2 /> Consistent model pipeline</span>
        </div>
      </div>
      <p className="auth-brand-footnote">Decision support built for modern banking teams.</p>
    </section>
  );
}

export default function AuthPage() {
  const [registerMode, setRegisterMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [remember, setRemember] = useState(true);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ full_name: "", email: "", password: "", confirm: "" });
  const { login, register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add("auth-page-active");
    return () => document.body.classList.remove("auth-page-active");
  }, []);

  const switchMode = () => {
    setError(""); setSuccess(""); setRegisterMode((current) => !current);
  };

  const submitLogin = async (event) => {
    event.preventDefault(); setError(""); setLoading(true);
    try {
      await login(loginForm, remember);
      navigate("/", { replace: true });
    } catch (requestError) {
      setError(apiErrorMessage(requestError, "Unable to sign in."));
    } finally { setLoading(false); }
  };

  const submitRegister = async (event) => {
    event.preventDefault(); setError(""); setSuccess("");
    if (registerForm.password !== registerForm.confirm) {
      setError("Passwords do not match."); return;
    }
    if (registerForm.password.length < 8) {
      setError("Password must contain at least 8 characters."); return;
    }
    setLoading(true);
    try {
      await register({
        full_name: registerForm.full_name,
        email: registerForm.email,
        password: registerForm.password,
      });
      setSuccess("Account created successfully. Opening your dashboard...");
      window.setTimeout(() => navigate("/", { replace: true }), 500);
    } catch (requestError) {
      setError(apiErrorMessage(requestError, "Unable to create account."));
    } finally { setLoading(false); }
  };

  const LoginForm = (
    <section className="auth-form-panel" aria-hidden={registerMode}>
      <form onSubmit={submitLogin}>
        <div className="auth-form-heading"><span>Welcome back</span><h2>Sign in to your workspace</h2><p>Continue to predictions, analytics and customer history.</p></div>
        {error && !registerMode && <div className="form-alert error">{error}</div>}
        <label className="auth-field" htmlFor="login-email"><span>Email address</span>
          <div className="input-with-icon"><Mail size={17} /><input id="login-email" type="email" value={loginForm.email}
            onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} placeholder="you@example.com" autoComplete="email" required /></div>
        </label>
        <PasswordField id="login-password" label="Password" value={loginForm.password}
          onChange={(password) => setLoginForm({ ...loginForm, password })} autoComplete="current-password" />
        <label className="checkbox-row"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /><span>Remember me on this device</span></label>
        <button className="btn btn-primary btn-block" disabled={loading}>{loading ? <><span className="spinner small" /> Signing in...</> : <>Sign In <ArrowRight size={17} /></>}</button>
        <p className="auth-form-switch">Don&apos;t have an account? <button type="button" onClick={switchMode}>Create Account</button></p>
      </form>
    </section>
  );

  const RegisterForm = (
    <section className="auth-form-panel register-panel" aria-hidden={!registerMode}>
      <form onSubmit={submitRegister}>
        <div className="auth-form-heading"><span>Join the workspace</span><h2>Create your analyst account</h2><p>Your password is protected using secure Argon2 hashing.</p></div>
        {error && registerMode && <div className="form-alert error">{error}</div>}
        {success && <div className="form-alert success">{success}</div>}
        <label className="auth-field" htmlFor="register-name"><span>Full name</span>
          <div className="input-with-icon"><UserRound size={17} /><input id="register-name" value={registerForm.full_name}
            onChange={(e) => setRegisterForm({ ...registerForm, full_name: e.target.value })} placeholder="Your full name" autoComplete="name" minLength="2" required /></div>
        </label>
        <label className="auth-field" htmlFor="register-email"><span>Email address</span>
          <div className="input-with-icon"><Mail size={17} /><input id="register-email" type="email" value={registerForm.email}
            onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })} placeholder="you@example.com" autoComplete="email" required /></div>
        </label>
        <PasswordField id="register-password" label="Password" value={registerForm.password}
          onChange={(password) => setRegisterForm({ ...registerForm, password })} autoComplete="new-password" />
        <PasswordField id="register-confirm" label="Confirm password" value={registerForm.confirm}
          onChange={(confirm) => setRegisterForm({ ...registerForm, confirm })} autoComplete="new-password" placeholder="Repeat your password" />
        <button className="btn btn-primary btn-block" disabled={loading}>{loading ? <><span className="spinner small" /> Creating account...</> : <>Create Account <ArrowRight size={17} /></>}</button>
        <p className="auth-form-switch">Already have an account? <button type="button" onClick={switchMode}>Sign In</button></p>
      </form>
    </section>
  );

  return (
    <main className="auth-page">
      <div className={`auth-container ${registerMode ? "register-mode" : "login-mode"}`}>
        <div className="auth-brand-slot"><BrandPanel /></div>
        <div className="auth-login-slot">{LoginForm}</div>
        <div className="auth-register-slot">{RegisterForm}</div>
      </div>
    </main>
  );
}
