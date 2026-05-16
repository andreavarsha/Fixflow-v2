import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const { signIn } = useAuthActions();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await signIn("password", { email, password, flow: "signIn" });
      navigate("/");
    } catch {
      setError("Invalid credentials. Try again.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-black">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-80 border p-8">
        <h1 className="text-2xl font-bold">FixFlow AI</h1>
        <h2 className="text-lg">Sign In</h2>
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
        <button type="submit" className="bg-black text-white py-2 font-medium hover:bg-gray-800">
          Sign In
        </button>
        <Link to="/signup" className="text-sm text-center underline">No account? Sign up</Link>
      </form>
    </div>
  );
}