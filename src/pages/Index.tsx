
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Scissors } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import TestCredentials from "@/components/TestCredentials";

const Index = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user) {
      navigate("/dashboard");
    }
  }, [user, isLoading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="max-w-4xl w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Welcome Section */}
          <div className="text-center lg:text-left">
            <div className="flex justify-center lg:justify-start mb-8">
              <div className="bg-primary/10 p-4 rounded-full">
                <Scissors className="h-12 w-12 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4">Salone di Bellezza</h1>
            <p className="text-lg text-muted-foreground mb-8">
              La piattaforma perfetta per gestire il tuo salone e prenotare
              appuntamenti con facilità.
            </p>
            <div className="space-y-4">
              <Button
                size="lg"
                className="w-full lg:w-auto text-lg"
                onClick={() => navigate("/auth")}
              >
                Accedi o Registrati
              </Button>
            </div>
          </div>

          {/* Test Credentials Section */}
          <div className="flex justify-center">
            <TestCredentials />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
