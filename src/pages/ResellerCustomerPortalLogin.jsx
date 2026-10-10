import GoogleSignIn from "../components/GoogleSignIn";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import customerPortalApi from "../services/resellerCustomerPortalApi";
import Logo from "../components/ui/Logo";
import PasswordInput from "../components/ui/PasswordInput";

export default function CustomerPortalLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [linkMessage, setLinkMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await customerPortalApi.post("/public/reseller-customers/login", { email, password });
      localStorage.setItem("customerPortalToken", res.data.data.token || "cookie");
      navigate("/reseller/customer/dashboard", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-light-grey flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md w-full">
        <Logo size="sm" className="mb-6" />
        <h1 className="text-xl font-bold text-slate-900 mb-1">Log In</h1>
        <p className="text-sm text-slate-500 mb-6">View your screens and account status.</p>

        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

        {linkMessage && <p role="status" className="mb-4 text-sm text-green-700">{linkMessage}</p>}
        <GoogleSignIn api={customerPortalApi} endpoint="/public/reseller-customers" disabled={submitting} onError={setError} onSuccess={(data) => { localStorage.setItem("customerPortalToken", data.data.token || "cookie"); navigate("/reseller/customer/dashboard", { replace: true }); }} />
          <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl font-semibold text-sm bg-brand-black text-white hover:bg-charcoal transition disabled:opacity-50"
          >
            {submitting ? "Logging in..." : "Log In"}
          </button>
        </form>
        <button type="button" disabled={submitting} className="mt-4 text-sm font-semibold underline" onClick={async () => {
          setError(""); setLinkMessage(""); setSubmitting(true);
          try { const res = await customerPortalApi.post("/public/reseller-customers/forgot-password", { email }); setLinkMessage(res.data.message); }
          catch (err) { setError(err.response?.data?.message || "Could not send the email link."); }
          finally { setSubmitting(false); }
        }}>Forgot password or need a verification link?</button>
        <p className="text-xs text-slate-500 mt-2">Enter your email above, then request a new link.</p>

        <p className="text-xs text-slate-400 text-center mt-6">
          Don't have an account? <Link to="/reseller/customer/register" className="font-medium text-brand-red hover:underline">Register here</Link>
        </p>
      </div>
    </div>
  );
}
