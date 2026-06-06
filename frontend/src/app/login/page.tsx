"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [adminSecret, setAdminSecret] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isAdminLogin) {
        const response = await api.post("/auth/admin-login", {
          email,
          password,
          admin_secret: adminSecret
        });
        localStorage.setItem("token", response.data.access_token);
        router.push("/admin");
      } else {
        const params = new URLSearchParams();
        params.append("username", email);
        params.append("password", password);

        const response = await api.post("/auth/login", params, {
          headers: { "Content-Type": "application/x-www-form-urlencoded" }
        });
        
        localStorage.setItem("token", response.data.access_token);
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to login. Please try again.");
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
          <h1 className="font-serif text-[24px] font-bold text-foreground m-0 mb-1.5">{isAdminLogin ? "Admin Login" : "Welcome back"}</h1>
          <p className="text-muted-foreground text-[13px] m-0">{isAdminLogin ? "Enter your details and secret to access the admin dashboard." : "Enter your details to access your dashboard."}</p>
        </div>

        {error && (
          <div className="mb-5 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
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
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-muted-foreground text-[12px] font-medium">Password</label>
              <span className="text-primary text-[11px] cursor-pointer font-medium hover:underline">Forgot?</span>
            </div>
            <input 
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          
          {isAdminLogin && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden">
              <label className="block text-muted-foreground text-[12px] font-medium mb-1.5">Admin Secret</label>
              <input 
                type="password"
                required
                value={adminSecret}
                onChange={(e) => setAdminSecret(e.target.value)}
                placeholder="••••••••"
              />
            </motion.div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="bg-gradient-to-br from-primary to-primary/80 border-none text-white p-2.5 rounded-lg font-sans text-[14px] font-semibold cursor-pointer mt-2 disabled:opacity-70 flex justify-center items-center"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button 
            type="button" 
            onClick={() => setIsAdminLogin(!isAdminLogin)}
            className="text-[12px] text-muted-foreground hover:text-foreground bg-transparent border-none cursor-pointer underline decoration-muted-foreground/30 underline-offset-4"
          >
            {isAdminLogin ? "Back to User Login" : "Login as Admin"}
          </button>
        </div>

        <p className="text-center text-muted-foreground text-[13px] mt-6">
          Don't have an account? <Link href="/register" className="text-primary font-medium hover:underline">Sign up</Link>
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
