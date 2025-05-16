
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-6">Oops! Pagina non trovata</p>
        <p className="text-gray-500 mb-8">
          La pagina che stai cercando non esiste o è stata spostata.
        </p>
        <div className="space-y-2">
          <Button asChild className="w-full">
            <Link to="/">Torna alla Home</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link to="/dashboard">Vai alla Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
