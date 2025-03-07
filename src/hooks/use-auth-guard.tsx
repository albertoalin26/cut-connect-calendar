
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useAuthGuard(requireAdmin = false) {
  const { user, isLoading, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        toast.error("Devi effettuare l'accesso per visualizzare questa pagina");
        navigate("/auth");
      } else if (requireAdmin && !isAdmin) {
        toast.error("Non hai i permessi per accedere a questa pagina");
        navigate("/dashboard");
      }
    }
  }, [user, isLoading, isAdmin, navigate, requireAdmin]);

  return { isLoading, user, isAdmin };
}
