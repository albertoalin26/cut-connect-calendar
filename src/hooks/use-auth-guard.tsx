
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useAuthGuard(requireAdmin = false) {
  const { user, isLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [checkComplete, setCheckComplete] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        console.log("Auth guard timeout reached, proceeding with check anyway");
        checkAccess();
      }
    }, 3000); // Timeout to prevent hanging

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      checkAccess();
    }
  }, [user, isLoading, isAdmin, navigate, requireAdmin]);

  const checkAccess = () => {
    if (!checkComplete) {
      if (!user) {
        toast.error("Devi effettuare l'accesso per visualizzare questa pagina");
        navigate("/auth");
      } else if (requireAdmin && !isAdmin) {
        toast.error("Non hai i permessi per accedere a questa pagina");
        navigate("/dashboard");
      }
      setCheckComplete(true);
    }
  };

  return { isLoading, user, isAdmin };
}
