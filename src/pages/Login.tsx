import { useState, FormEvent } from 'react';
import { LogIn, AlertCircle, Loader2 } from 'lucide-react';
import supabase from '../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Step 1: Sign in with email/password
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError("Invalid login credentials: " + signInError.message);
        setLoading(false);
        return;
      }

      if (!signInData?.user) {
        setError("Login failed - no user returned");
        setLoading(false);
        return;
      }

      console.log("Login successful. User ID:", signInData.user.id);

      // Step 2: Check if user is in admin_users table
      const { data: adminData, error: adminError } = await supabase
        .from("admin_users")
        .select("user_id, name")
        .eq("user_id", signInData.user.id)
        .maybeSingle();

      console.log("Admin check result:", adminData, "Error:", adminError);

      if (adminError) {
        setError("Admin check error: " + adminError.message);
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      if (!adminData) {
        setError("Not authorized - your account is not registered as admin");
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      // Step 3: User IS admin - redirect to admin panel
      console.log("Admin confirmed. Redirecting...");
      window.location.href = "/admin";
    } catch (err: any) {
      setError("Unexpected error: " + err.message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-[#0F7A3D] rounded-xl mb-4">
            <LogIn className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Punjab Colleges</h1>
          <p className="text-gray-500 mt-1">Admin & Teacher Portal</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {success}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="aya an19562@gmail.com"
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F7A3D] focus:border-[#0F7A3D] outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              minLength={6}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F7A3D] focus:border-[#0F7A3D] outline-none transition"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#0F7A3D] hover:bg-[#0a6230] text-white font-medium rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Sign In
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-400">
          Punjab Colleges Ranking System &mdash; Internal Use Only
        </p>
      </div>
    </div>
  );
}
