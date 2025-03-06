
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, ChevronLeft, ChevronRight, Clock, Save } from "lucide-react";
import { format, addDays, setDefaultOptions } from "date-fns";
import { it } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

// Imposta l'italiano come lingua predefinita per date-fns
setDefaultOptions({ locale: it });

// Dati iniziali degli orari di lavoro per ogni giorno della settimana
const initialWorkingHours = {
  0: { // Domenica
    isWorkingDay: false,
    hours: {
      open: "09:00",
      close: "18:00"
    }
  },
  1: { // Lunedì
    isWorkingDay: true,
    hours: {
      open: "09:00",
      close: "18:00"
    }
  },
  2: { // Martedì
    isWorkingDay: true,
    hours: {
      open: "09:00",
      close: "18:00"
    }
  },
  3: { // Mercoledì
    isWorkingDay: true,
    hours: {
      open: "09:00",
      close: "18:00"
    }
  },
  4: { // Giovedì
    isWorkingDay: true,
    hours: {
      open: "09:00",
      close: "18:00"
    }
  },
  5: { // Venerdì
    isWorkingDay: true,
    hours: {
      open: "09:00",
      close: "18:00"
    }
  },
  6: { // Sabato
    isWorkingDay: true,
    hours: {
      open: "10:00",
      close: "16:00"
    }
  }
};

// Mappatura dei giorni della settimana in italiano
const weekDays = [
  "Domenica",
  "Lunedì",
  "Martedì",
  "Mercoledì",
  "Giovedì",
  "Venerdì",
  "Sabato"
];

const WorkingHours = () => {
  const navigate = useNavigate();
  const [workingHours, setWorkingHours] = useState(initialWorkingHours);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [editData, setEditData] = useState({
    isWorkingDay: true,
    openTime: "09:00",
    closeTime: "18:00"
  });

  // Gestisce l'apertura del dialog di modifica
  const handleEditDay = (dayIndex: number) => {
    const dayData = workingHours[dayIndex as keyof typeof workingHours];
    
    setEditData({
      isWorkingDay: dayData.isWorkingDay,
      openTime: dayData.hours.open,
      closeTime: dayData.hours.close
    });
    
    setSelectedDay(dayIndex);
    setIsEditDialogOpen(true);
  };

  // Gestisce il salvataggio delle modifiche
  const handleSaveChanges = () => {
    if (selectedDay === null) return;
    
    // Aggiorna lo stato con i nuovi orari
    setWorkingHours(prev => ({
      ...prev,
      [selectedDay]: {
        isWorkingDay: editData.isWorkingDay,
        hours: {
          open: editData.openTime,
          close: editData.closeTime
        }
      }
    }));
    
    setIsEditDialogOpen(false);
    toast.success("Orari di lavoro aggiornati con successo");
  };

  // Gestisce il salvataggio di tutti gli orari (per esempio in un backend)
  const handleSaveAllHours = () => {
    // Qui si potrebbe aggiungere la logica per salvare gli orari su un database
    // Per ora mostriamo solo un toast di conferma
    console.log("Working hours to save:", workingHours);
    toast.success("Tutti gli orari di lavoro sono stati salvati");
  };

  return (
    <div className="space-y-8 animate-slide-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Orari di Lavoro</h2>
          <p className="text-muted-foreground">
            Gestisci gli orari di apertura del salone
          </p>
        </div>
        <Button onClick={handleSaveAllHours} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          <span>Salva Tutti gli Orari</span>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Orari Settimanali</CardTitle>
          <CardDescription>
            Imposta i giorni e gli orari in cui il salone è aperto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(workingHours).map(([dayIndex, dayData]) => {
              const index = parseInt(dayIndex);
              return (
                <div key={dayIndex} className="flex items-center justify-between p-4 border rounded-lg bg-card">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${dayData.isWorkingDay ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      {dayIndex}
                    </div>
                    <div>
                      <p className="font-medium">{weekDays[index]}</p>
                      {dayData.isWorkingDay ? (
                        <p className="text-sm text-muted-foreground">
                          {dayData.hours.open} - {dayData.hours.close}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">Chiuso</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => handleEditDay(index)}
                  >
                    Modifica
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-6">
          <p className="text-sm text-muted-foreground">
            Gli orari impostati saranno utilizzati per la pianificazione degli appuntamenti
          </p>
        </CardFooter>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Orari di Lavoro</DialogTitle>
            <DialogDescription>
              {selectedDay !== null && `Imposta gli orari per ${weekDays[selectedDay]}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isWorkingDay"
                checked={editData.isWorkingDay}
                onCheckedChange={(checked) => 
                  setEditData({...editData, isWorkingDay: !!checked})
                }
              />
              <Label htmlFor="isWorkingDay">Giorno Lavorativo</Label>
            </div>
            
            {editData.isWorkingDay && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="openTime">Orario di Apertura</Label>
                  <Input
                    id="openTime"
                    type="time"
                    value={editData.openTime}
                    onChange={(e) => setEditData({...editData, openTime: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="closeTime">Orario di Chiusura</Label>
                  <Input
                    id="closeTime"
                    type="time"
                    value={editData.closeTime}
                    onChange={(e) => setEditData({...editData, closeTime: e.target.value})}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleSaveChanges}>
              Salva Modifiche
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkingHours;
