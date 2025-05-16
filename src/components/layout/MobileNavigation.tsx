
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Calendar, Users, Scissors, Menu, Settings } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { AppSidebar } from "./AppSidebar";

export function MobileNavigation() {
  const location = useLocation();
  
  // Main navigation tabs for mobile
  const tabs = [
    {
      title: "Appuntamenti",
      path: "/appointments",
      icon: Calendar
    },
    {
      title: "Clienti",
      path: "/clients",
      icon: Users
    },
    {
      title: "Servizi",
      path: "/services",
      icon: Scissors
    },
    {
      title: "Impostazioni",
      path: "/settings",
      icon: Settings
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t border-border sm:hidden">
      <div className="grid h-full grid-cols-4">
        {tabs.map((tab) => (
          <Link
            key={tab.path}
            to={tab.path}
            className={cn(
              "flex flex-col items-center justify-center",
              location.pathname === tab.path 
                ? "text-primary" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="h-5 w-5" />
            <span className="text-xs mt-1">{tab.title}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
