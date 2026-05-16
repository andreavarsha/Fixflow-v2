import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const { signIn } = useAuthActions();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn("password", { email, password, flow: "signIn" });
      navigate("/");
    } catch (err: unknown) {
      console.error("Login error:", err);
      const message = err instanceof Error ? err.message : "Invalid credentials.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "border border-gray-300 px-3 py-2 text-sm bg-white text-black w-full focus:outline-none focus:border-black";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-80 border border-gray-300 p-8 bg-white">
        <h1 className="text-2xl font-bold text-black">FixFlow AI</h1>
        <h2 className="text-lg text-black">Sign In</h2>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className={inputClass}
          required
        />

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className={inputClass}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(p => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-black"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white py-2 font-medium hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <Link to="/signup" className="text-sm text-center underline text-black">
          No account? Sign up
        </Link>
      </form>
    </div>
  );
}