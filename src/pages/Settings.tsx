
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { CalendarOff, Settings as SettingsIcon, Bell, Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/components/ui/theme-provider";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { format } from "date-fns";
import { it } from "date-fns/locale";

const Settings = () => {
  // Utilizziamo il nostro hook di autenticazione per verificare se l'utente è admin
  const { isAdmin } = useAuthGuard();
  
  // Stato per le impostazioni
  const [notifications, setNotifications] = useState(true);
  const [holidayDates, setHolidayDates] = useState<Date[]>([]);
  const [isHolidayMode, setIsHolidayMode] = useState(false);
  const [savedHolidayDates, setSavedHolidayDates] = useState<Date[]>([]);
  const { theme, setTheme } = useTheme();
  
  // Funzione per salvare le date di ferie
  const saveHolidays = () => {
    setSavedHolidayDates([...holidayDates]);
    setIsHolidayMode(holidayDates.length > 0);
    toast.success("Giorni di ferie salvati con successo!");
  };
  
  // Funzione per annullare le ferie
  const cancelHolidays = () => {
    setHolidayDates([]);
    setSavedHolidayDates([]);
    setIsHolidayMode(false);
    toast.success("Giorni di ferie annullati!");
  };
  
  // Funzione per modificare lo stato delle notifiche
  const toggleNotifications = () => {
    setNotifications(!notifications);
    toast.success(
      !notifications 
        ? "Notifiche attivate con successo!" 
        : "Notifiche disattivate con successo!"
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Impostazioni</h2>
        <p className="text-muted-foreground">
          Gestisci le preferenze del tuo account e dell'applicazione.
        </p>
      </div>

      <Tabs defaultValue="generale" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="generale">Generale</TabsTrigger>
          {isAdmin && <TabsTrigger value="ferie">Ferie</TabsTrigger>}
          <TabsTrigger value="notifiche">Notifiche</TabsTrigger>
        </TabsList>
        
        <TabsContent value="generale" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Aspetto</CardTitle>
              <CardDescription>
                Personalizza l'aspetto dell'interfaccia dell'applicazione.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="text-base font-medium">Tema</h3>
                  <p className="text-sm text-muted-foreground">
                    Scegli tra tema chiaro e scuro.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant={theme === "light" ? "default" : "outline"} 
                    size="icon" 
                    onClick={() => setTheme("light")}
                  >
                    <Sun className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant={theme === "dark" ? "default" : "outline"} 
                    size="icon" 
                    onClick={() => setTheme("dark")}
                  >
                    <Moon className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="text-base font-medium">Lingua</h3>
                  <p className="text-sm text-muted-foreground">
                    L'applicazione è attualmente in italiano.
                  </p>
                </div>
                <Button variant="outline" disabled>
                  Italiano
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="ferie" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gestione Ferie</CardTitle>
                <CardDescription>
                  Seleziona i giorni in cui il salone sarà chiuso per ferie.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h3 className="text-base font-medium">Modalità Ferie</h3>
                      <p className="text-sm text-muted-foreground">
                        Attiva per bloccare automaticamente le prenotazioni nei giorni selezionati.
                      </p>
                    </div>
                    <Switch 
                      checked={isHolidayMode} 
                      onCheckedChange={setIsHolidayMode}
                      disabled={savedHolidayDates.length === 0}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-base font-medium mb-2">Seleziona i giorni di ferie</h3>
                    <Calendar
                      mode="multiple"
                      selected={holidayDates}
                      onSelect={setHolidayDates as any}
                      className="rounded-md border mx-auto"
                      locale={it}
                    />
                  </div>

                  {holidayDates.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-1">Giorni selezionati:</h4>
                      <div className="flex flex-wrap gap-2">
                        {holidayDates.map((date) => (
                          <div key={date.toISOString()} className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm">
                            {format(date, 'dd MMM yyyy', { locale: it })}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={cancelHolidays}
                  disabled={holidayDates.length === 0 && savedHolidayDates.length === 0}
                >
                  Annulla Ferie
                </Button>
                <Button 
                  onClick={saveHolidays}
                  disabled={holidayDates.length === 0}
                >
                  Salva Ferie
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        )}
        
        <TabsContent value="notifiche" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestione Notifiche</CardTitle>
              <CardDescription>
                Configura quando e come ricevere notifiche.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="text-base font-medium">Notifiche Email</h3>
                  <p className="text-sm text-muted-foreground">
                    Ricevi email per appuntamenti e promemoria.
                  </p>
                </div>
                <Switch 
                  checked={notifications} 
                  onCheckedChange={toggleNotifications}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="text-base font-medium">Notifiche Push</h3>
                  <p className="text-sm text-muted-foreground">
                    Ricevi notifiche push sul browser.
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="text-base font-medium">Promemoria Appuntamenti</h3>
                  <p className="text-sm text-muted-foreground">
                    Ricevi un promemoria 24 ore prima dell'appuntamento.
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
