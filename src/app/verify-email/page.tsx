"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { CheckCircle, Loader2, Mail } from "lucide-react";
import { motion } from "framer-motion";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const token = searchParams.get("token");
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // If we land here with a token, automatically verify it
    if (token && !success && !loading && !error) {
      verifyToken(token);
    }
  }, [token]);

  const verifyToken = async (verificationToken: string) => {
    setLoading(true);
    setError("");
    
    try {
      await api.post("/auth/verify-email", { token: verificationToken });
      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to verify email. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  if (!email && !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 text-center">
        <p className="text-foreground/60">No email or token provided for verification.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-card/80 backdrop-blur-xl rounded-3xl border shadow-xl p-8 relative z-10 text-center"
      >
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">
            {token ? "Verifying your email..." : "Check your email"}
          </h1>
          {email && !token && (
            <p className="text-sm text-foreground/70">
              We've sent a verification link to <span className="font-semibold text-foreground">{email}</span>.
              <br />Please check your inbox and click the link to activate your account.
            </p>
          )}
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
            {error}
          </div>
        )}

        {success ? (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex flex-col items-center justify-center">
            <CheckCircle className="w-8 h-8 text-emerald-500 mb-2" />
            <p className="text-emerald-600 font-medium text-sm">Email verified successfully!</p>
            <p className="text-emerald-600/80 text-xs mt-1">Redirecting to login...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {loading ? (
               <div className="flex justify-center p-4">
                 <Loader2 className="w-8 h-8 animate-spin text-primary" />
               </div>
            ) : (
              <button 
                onClick={() => router.push("/login")}
                className="w-full bg-secondary text-secondary-foreground py-3 rounded-lg font-medium hover:bg-secondary/80 transition-colors"
              >
                Back to Login
              </button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
