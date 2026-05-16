import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Signup() {
  const { signIn } = useAuthActions();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"owner" | "supplier">("owner");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await signIn("password", { email, password, flow: "signUp", role });
      navigate("/");
    } catch {
      setError("Signup failed. Try again.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-black">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-80 border p-8">
        <h1 className="text-2xl font-bold">FixFlow AI</h1>
        <h2 className="text-lg">Create Account</h2>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <input
          type="email" placeholder="Email" value={email}
          onChange={e => setEmail(e.target.value)}
          className="border px-3 py-2 text-sm"
          required
        />
        <input
          type="password" placeholder="Password" value={password}
          onChange={e => setPassword(e.target.value)}
          className="border px-3 py-2 text-sm"
          required
        />
        <select value={role} onChange={e => setRole(e.target.value as "owner" | "supplier")}
          className="border px-3 py-2 text-sm">
          <option value="owner">Property Owner</option>
          <option value="supplier">Supplier / Tradesperson</option>
        </select>
        <button type="submit" className="bg-black text-white py-2 font-medium hover:bg-gray-800">
          Create Account
        </button>
        <Link to="/login" className="text-sm text-center underline">Have an account? Sign in</Link>
      </form>
    </div>
  );
}