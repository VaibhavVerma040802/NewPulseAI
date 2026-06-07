"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await api.post("/auth/register", {
        full_name: fullName,
        email,
        password
      });
      
      // Auto-login
      const loginParams = new URLSearchParams();
      loginParams.append('username', email);
      loginParams.append('password', password);
      
      const loginRes = await api.post("/auth/login", loginParams, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      localStorage.setItem("token", loginRes.data.access_token);
      router.push('/onboarding');
    } catch (err: any) {
      setError(err.response?.data?.detail || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-5 relative font-sans">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[800px] bg-[radial-gradient(circle,rgba(59,130,246,0.05)_0%,transparent_60%)] pointer-events-none"></div>
      
      <div className="w-full max-w-[380px] bg-card border border-border rounded-[16px] p-8 relative shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]">
        <div className="text-center mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 inline-flex items-center justify-center text-[20px] mb-3">
            ⚡
          </div>
          <h1 className="font-serif text-[24px] font-bold text-foreground m-0 mb-1.5">Create Account</h1>
          <p className="text-muted-foreground text-[13px] m-0">Join NewsPulse AI to personalize your news.</p>
        </div>

        {error && (
          <div className="mb-5 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <div>
            <label className="block text-muted-foreground text-[12px] font-medium mb-1.5">Full name</label>
            <input 
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="block text-muted-foreground text-[12px] font-medium mb-1.5">Email address</label>
            <input 
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
            />
          </div>
          <div>
            <label className="block text-muted-foreground text-[12px] font-medium mb-1.5">Password</label>
            <input 
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="bg-gradient-to-br from-primary to-primary/80 border-none text-white p-2.5 rounded-lg font-sans text-[14px] font-semibold cursor-pointer mt-2 disabled:opacity-70 flex justify-center items-center"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p className="text-center text-muted-foreground text-[13px] mt-6">
          Already have an account? <Link href="/login" className="text-primary font-medium hover:underline">Sign in</Link>
        </p>

        <div className="relative mt-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-[12px]">
            <span className="px-2 bg-card text-muted-foreground">or continue with</span>
          </div>
        </div>

        <div className="mt-5">
           <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
             <div className="flex justify-center [&>div]:!w-full [&>div>div]:!w-full">
                <GoogleLogin
                  onSuccess={async (credentialResponse) => {
                    try {
                      setLoading(true);
                      const response = await api.post("/auth/google", {
                        token: credentialResponse.credential
                      });
                      localStorage.setItem("token", response.data.access_token);
                      router.push("/dashboard");
                    } catch (err: any) {
                      setError("Google authentication failed.");
                      setLoading(false);
                    }
                  }}
                  onError={() => {
                    setError("Google authentication failed.");
                  }}
                  theme="filled_black"
                  shape="rectangular"
                  width="100%"
                />
             </div>
           </GoogleOAuthProvider>
        </div>
      </div>
    </div>
  );
}
