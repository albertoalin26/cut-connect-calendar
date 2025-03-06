
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function TopBar() {
  const navigate = useNavigate();
  
  return (
    <div className="border-b border-border h-16 px-6 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-medium">Benvenuto, Alex</h1>
      </div>
      <div className="flex items-center gap-4">
        <Button 
          variant="default" 
          size="sm" 
          className="flex items-center gap-2 transition-all duration-300 hover:scale-105"
          onClick={() => navigate("/appointments/new")}
        >
          <Plus className="h-4 w-4" />
          <span>Nuovo Appuntamento</span>
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Bell className="h-5 w-5" />
        </Button>
        <Avatar className="h-9 w-9">
          <AvatarImage src="https://github.com/shadcn.png" alt="Utente" />
          <AvatarFallback>A</AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
}
