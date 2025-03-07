
import { Calendar, Home, Scissors, Users, Clock, Settings } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

// Elementi di navigazione per la sidebar
const items = [
  {
    title: "Dashboard",
    path: "/",
    icon: Home,
  },
  {
    title: "Appuntamenti",
    path: "/appointments",
    icon: Calendar,
  },
  {
    title: "Clienti",
    path: "/clients",
    icon: Users,
  },
  {
    title: "Servizi",
    path: "/services",
    icon: Scissors,
  },
  {
    title: "Orari di Lavoro",
    path: "/working-hours",
    icon: Clock,
  },
  {
    title: "Impostazioni",
    path: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const location = useLocation();
  const isMobile = useIsMobile();
  const { setOpenMobile } = useSidebar();
  
  // Helper function to close the mobile sidebar when a link is clicked
  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };
  
  return (
    <Sidebar>
      <SidebarHeader className="px-6 py-5 flex items-center">
        <Link to="/" className="flex items-center gap-2" onClick={handleNavClick}>
          <Scissors className="h-6 w-6 text-primary" />
          <span className="font-semibold text-xl">ParrucchierePro</span>
        </Link>
        {!isMobile && <SidebarTrigger />}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Gestione Salone</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link 
                      to={item.path}
                      onClick={handleNavClick}
                      className={cn(
                        location.pathname === item.path ? "bg-primary/10 text-primary" : ""
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="px-6 py-4">
        <div className="text-xs text-muted-foreground">
          ParrucchierePro v1.0.0
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
