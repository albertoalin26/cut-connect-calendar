
import React, { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";
import { MobileNavigation } from "./MobileNavigation";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";

const AppLayout = () => {
  const isMobile = useIsMobile();
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      console.log("User not authenticated, redirecting to auth page");
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {/* Only show sidebar on desktop */}
        {!isMobile && <AppSidebar />}
        <div className="flex-1 flex flex-col">
          <TopBar />
          <main className="flex-1 p-6 max-w-7xl w-full mx-auto animate-fade-in pb-16 sm:pb-0">
            <Outlet />
          </main>
          {/* Mobile navigation */}
          {isMobile && <MobileNavigation />}
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
