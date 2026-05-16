import { useNavigate } from "react-router-dom";

export default function RolePicker() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white text-black">
      <h1 className="text-2xl font-bold">FixFlow AI — Select Role</h1>
      <p className="text-sm text-gray-500">Temporary — will auto-redirect once backend role is live</p>
      <div className="flex gap-4 mt-4">
        <button onClick={() => navigate("/owner/dashboard")} className="border px-6 py-3 font-medium hover:bg-black hover:text-white">Owner</button>
        <button onClick={() => navigate("/supplier/dashboard")} className="border px-6 py-3 font-medium hover:bg-black hover:text-white">Supplier</button>
        <button onClick={() => navigate("/admin/dashboard")} className="border px-6 py-3 font-medium hover:bg-black hover:text-white">Admin</button>
      </div>
    </div>
  );
}