"use client";

import { useState } from "react";
import Link from "next/link";
import { Info } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-5 relative font-sans">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[800px] bg-[radial-gradient(circle,rgba(59,130,246,0.05)_0%,transparent_60%)] pointer-events-none"></div>

      <div className="w-full max-w-[400px] bg-[#111827] border border-border rounded-2xl p-8 relative shadow-2xl flex flex-col items-center">
        <div className="text-[48px] mb-4">
          🔐
        </div>
        
        <h1 className="font-serif text-[28px] font-bold text-white m-0 mb-3 text-center">
          Forgot your password?
        </h1>
        
        <p className="text-muted-foreground text-[15px] m-0 mb-8 text-center max-w-[300px]">
          Enter your email and we'll send a reset link if an account exists.
        </p>

        {submitted ? (
          <div className="w-full flex flex-col items-center">
            <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center text-[32px] mb-4">
              ✓
            </div>
            <h2 className="text-white text-[18px] font-bold mb-2">Check your inbox</h2>
            <p className="text-muted-foreground text-[14px] text-center mb-8">
              We've sent a password reset link to <br/>
              <span className="text-white font-medium">{email}</span>
            </p>
            <Link 
              href="/login" 
              className="text-primary text-[14px] hover:underline font-medium"
            >
              ← Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
            <div>
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full bg-[#0b0f19] border border-border/50 rounded-xl px-4 py-3 text-white placeholder-muted-foreground focus:outline-none focus:border-primary/50 transition-colors text-[15px]"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading || !email}
              className="w-full bg-[#5b6ef6] hover:bg-[#4b5ee6] text-white py-3.5 rounded-xl font-sans text-[16px] font-bold cursor-pointer transition-colors mt-2 mb-2 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed border-none"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>

            <div className="bg-[#1e293b]/50 border border-border/50 rounded-xl p-4 mt-2">
              <p className="text-[#60a5fa] text-[13px] leading-relaxed m-0 flex items-start gap-2">
                <span className="bg-[#3b82f6] text-white w-4 h-4 rounded text-[10px] flex items-center justify-center shrink-0 mt-0.5">i</span>
                For security, we always show this message regardless of whether the email exists. Token expires in 1 hour.
              </p>
            </div>
            
            <div className="mt-8 text-center">
              <Link 
                href="/login" 
                className="text-[#60a5fa] text-[14px] hover:underline font-medium flex items-center justify-center gap-1"
              >
                ← Back to sign in
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
