import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '@/lib/api';

export function useAuth(requireAuth = true, requireAdmin = false) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ role: string, full_name: string, email: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      
      if (!token) {
        if (requireAuth) {
          router.push("/login");
        } else {
          setIsLoading(false);
        }
        return;
      }

      try {
        const res = await api.get("/auth/me");
        setUser(res.data);
        if (requireAdmin && res.data.role !== "ADMIN") {
          router.push("/dashboard");
          return;
        }
        setIsLoading(false);
      } catch (err) {
        localStorage.removeItem("token");
        if (requireAuth) {
          router.push("/login");
        } else {
          setIsLoading(false);
        }
      }
    };
    
    checkAuth();
  }, [router, requireAuth, requireAdmin, pathname]);

  return { user, isLoading };
}
