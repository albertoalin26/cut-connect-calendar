import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Clock, Pencil, Plus, Scissors, Trash2, Mail, User, Calendar as CalendarIcon, Info } from "lucide-react";
import { format, addDays, parseISO, eachDayOfInterval, startOfWeek, endOfWeek, isSameDay, setHours, setMinutes } from "date-fns";
import { it } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import WeeklyCalendarView from '@/components/calendar/WeeklyCalendarView';
import ClientBookingView from '@/components/appointments/ClientBookingView';
import AppointmentBookingModal from '@/components/appointments/AppointmentBookingModal';
import { useAuth } from "@/contexts/AuthContext";
import { useAuthGuard } from "@/hooks/use-auth-guard";

const fasce_orarie = [
  "9:00", "9:30", "10:00", "10:30", "11:00", 
  "11:30", "12:00", "12:30", "13:00", "13:30", 
  "14:00", "14:30", "15:00", "15:30", "16:00", 
  "16:30", "17:00", "17:30", "18:00"
];

const Appointments = () => {
  // Use the auth guard hook to check if the user is authenticated
  const { user, isAdmin } = useAuthGuard();
  
  const navigate = useNavigate();
  const [date, setDate] = useState<Date>(new Date());
  const [view, setView] = useState("day");
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Per la prenotazione rapida
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      console.log("Fetching appointments - isAdmin:", isAdmin, "user:", user?.id);
      
      let query = supabase
        .from('appointments')
        .select('*')
        .order('date', { ascending: true })
        .order('time', { ascending: true });
      
      // If user is not admin, only fetch their appointments
      if (!isAdmin && user) {
        query = query.eq('client_id', user.id);
        console.log("Non-admin user: filtering by client_id =", user.id);
      } else if (isAdmin) {
        console.log("Admin user: fetching all appointments");
      }
      
      const { data, error } = await query;
      console.log("Appointments query result:", { data, error, count: data?.length });
      
      if (error) {
        console.error("Error fetching appointments:", error);
        toast.error("Errore nel caricamento degli appuntamenti");
        return;
      }
      
      // Transform appointments and fetch client profiles
      const formattedAppointments = await Promise.all(
        (data || []).map(async (appointment) => {
          // Fetch client profile separately
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', appointment.client_id)
            .single();
          
          // Use profile data if available
          let clientName = 'Cliente Sconosciuto';
          let clientEmail = '';
          
          if (!profileError && profileData) {
            if (profileData.first_name || profileData.last_name) {
              clientName = `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim();
            } else if (profileData.email) {
              clientName = profileData.email;
            }
            clientEmail = profileData.email || '';
          }
          
          // Create initials for avatar
          const initials = clientName
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2) || 'CL';
          
          return {
            id: appointment.id,
            client: clientName,
            clientEmail: clientEmail,
            service: appointment.service,
            duration: appointment.duration,
            time: appointment.time,
            status: appointment.status,
            avatar: initials,
            date: new Date(appointment.date),
            notes: appointment.notes || '',
            client_id: appointment.client_id
          };
        })
      );
      
      console.log("Final formatted appointments:", formattedAppointments.length, "appointments");
      setAppointments(formattedAppointments);
    } catch (error) {
      console.error("Unexpected error fetching appointments:", error);
      toast.error("Errore nel caricamento degli appuntamenti");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Load clients from profiles table
    const fetchClients = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*');
        
        if (error) {
          console.error("Error fetching clients:", error);
          toast.error("Errore nel caricamento dei clienti");
          return;
        }
        
        const formattedClients = data.map(profile => ({
          id: profile.id,
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Cliente Sconosciuto',
          phone: profile.phone || '',
          email: profile.email || ''
        }));
        
        setClients(formattedClients);
      } catch (error) {
        console.error("Unexpected error fetching clients:", error);
      }
    };

    if (user) {
      fetchAppointments();
      if (isAdmin) {
        fetchClients();
      }
    }
  }, [user, isAdmin]);

  const handleViewAppointment = (appointment: any) => {
    setSelectedAppointment(appointment);
    setIsViewDialogOpen(true);
  };

  const handleDelete = async (appointmentId: string) => {
    if (!isAdmin) {
      toast.error("Solo gli amministratori possono eliminare gli appuntamenti");
      return;
    }
    
    const appointmentToDelete = appointments.find(app => app.id === appointmentId);
    
    if (appointmentToDelete) {
      try {
        // First delete from Supabase
        const { error } = await supabase
          .from('appointments')
          .delete()
          .eq('id', appointmentId);
        
        if (error) {
          console.error("Error deleting appointment:", error);
          toast.error("Errore nella cancellazione dell'appuntamento");
          return;
        }
        
        // Update local state
        const updatedAppointments = appointments.filter(app => app.id !== appointmentId);
        setAppointments(updatedAppointments);
        
        // Send email notification for cancellation
        if (appointmentToDelete.clientEmail) {
          sendEmailNotification(
            appointmentToDelete.clientEmail,
            appointmentToDelete.client,
            appointmentToDelete.service,
            format(new Date(appointmentToDelete.date), "d MMMM yyyy", { locale: it }),
            appointmentToDelete.time,
            "cancelled"
          );
        }
        
        toast.success("Appuntamento cancellato con successo");
      } catch (error) {
        console.error("Unexpected error deleting appointment:", error);
        toast.error("Errore nella cancellazione dell'appuntamento");
      }
    }
    
    setIsViewDialogOpen(false);
  };

  const handleEdit = (appointment: any) => {
    if (!isAdmin) {
      toast.error("Solo gli amministratori possono modificare gli appuntamenti");
      return;
    }
    
    setSelectedAppointment(appointment);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async (appointmentId: string, updatedData: any) => {
    if (!isAdmin) {
      toast.error("Solo gli amministratori possono modificare gli appuntamenti");
      return;
    }
    
    try {
      // First update in Supabase
      const { error } = await supabase
        .from('appointments')
        .update({
          service: updatedData.service || selectedAppointment.service,
          time: updatedData.time || selectedAppointment.time,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId);
      
      if (error) {
        console.error("Error updating appointment:", error);
        toast.error("Errore nell'aggiornamento dell'appuntamento");
        return;
      }
      
      // Update local state
      const updatedAppointments = appointments.map(appointment => 
        appointment.id === appointmentId 
          ? { 
              ...appointment, 
              service: updatedData.service || appointment.service,
              time: updatedData.time || appointment.time
            } 
          : appointment
      );
      
      setAppointments(updatedAppointments);
      setIsEditDialogOpen(false);
      setIsViewDialogOpen(false);
      
      // Get the updated appointment
      const updatedAppointment = updatedAppointments.find(app => app.id === appointmentId);
      
      if (updatedAppointment && updatedAppointment.clientEmail) {
        // Send email notification
        sendEmailNotification(
          updatedAppointment.clientEmail,
          updatedAppointment.client,
          updatedAppointment.service,
          format(new Date(updatedAppointment.date), "d MMMM yyyy", { locale: it }),
          updatedAppointment.time,
          "updated"
        );
      }
      
      toast.success("Appuntamento aggiornato con successo");
    } catch (error) {
      console.error("Unexpected error updating appointment:", error);
      toast.error("Errore nell'aggiornamento dell'appuntamento");
    }
  };

  // Handler per aprire il modale di prenotazione quando si clicca su uno slot orario vuoto
  const handleTimeSlotClick = (time: string) => {
    if (!isAdmin) {
      toast.error("Solo gli amministratori possono prenotare gli appuntamenti in questa vista");
      return;
    }
    
    const timeAppointments = appointments.filter(app => 
      app.time === time && 
      new Date(app.date).getDate() === date.getDate() &&
      new Date(app.date).getMonth() === date.getMonth() &&
      new Date(app.date).getFullYear() === date.getFullYear()
    );
    
    // Se lo slot è libero, mostra il modale di prenotazione
    if (timeAppointments.length === 0) {
      setSelectedTimeSlot(time);
      setIsBookingModalOpen(true);
    }
  };

  const handleBookingSuccess = () => {
    console.log("Booking success - refreshing appointments");
    fetchAppointments(); // Ricarica gli appuntamenti
    setIsBookingModalOpen(false);
    setSelectedTimeSlot(null);
  };

  const sendEmailNotification = async (
    email: string,
    clientName: string,
    service: string,
    date: string,
    time: string,
    action: "new" | "updated" | "cancelled"
  ) => {
    try {
      setIsEmailSending(true);
      
      const { data, error } = await supabase.functions.invoke('send-appointment-email', {
        body: {
          to: email,
          clientName,
          service,
          date,
          time,
          action
        }
      });

      if (error) {
        console.error("Errore nell'invio dell'email:", error);
        toast.error("Errore nell'invio dell'email di notifica");
      } else {
        toast.success("Email di notifica inviata con successo");
      }
    } catch (error) {
      console.error("Errore nell'invio dell'email:", error);
      toast.error("Errore nell'invio dell'email di notifica");
    } finally {
      setIsEmailSending(false);
    }
  };

  const renderAppointmentActions = (appointment: any) => {
    // Only admin can see these actions
    if (!isAdmin) return null;
    
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            handleEdit(appointment);
          }}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => e.stopPropagation()}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
              <AlertDialogDescription>
                Questa azione non può essere annullata. L'appuntamento verrà eliminato permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annulla</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleDelete(appointment.id)}>
                Elimina
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  };

  const renderTimeSlot = (time: string) => {
    const timeAppointments = appointments.filter(app => 
      app.time === time && 
      new Date(app.date).getDate() === date.getDate() &&
      new Date(app.date).getMonth() === date.getMonth() &&
      new Date(app.date).getFullYear() === date.getFullYear()
    );
    
    const isSlotEmpty = timeAppointments.length === 0;
    
    return (
      <div key={time} className="flex items-start gap-2 py-2 border-t border-border">
        <div className="w-20 text-sm text-muted-foreground pt-2">{time}</div>
        <div className="flex-1">
          {timeAppointments.length > 0 ? (
            timeAppointments.map(appointment => (
              <Card key={appointment.id} className="mb-2 appointment-card bg-secondary/50">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{appointment.avatar}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{appointment.client}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Scissors className="h-3 w-3" />
                          <span>{appointment.service}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={appointment.status === "confermato" ? "default" : "outline"}
                        className="text-xs"
                      >
                        {appointment.status}
                      </Badge>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        {appointment.duration}
                      </div>
                      {renderAppointmentActions(appointment)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            isAdmin && (
              <Button 
                variant="ghost" 
                className="w-full h-10 border border-dashed border-muted-foreground/20 text-muted-foreground hover:bg-primary/5"
                onClick={() => handleTimeSlotClick(time)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Slot disponibile
              </Button>
            )
          )}
        </div>
      </div>
    );
  };

  const renderWeeklyView = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vista Settimanale</CardTitle>
          <CardDescription>
            Visualizza gli appuntamenti per la settimana dal {format(date, "d MMMM yyyy", { locale: it })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WeeklyCalendarView 
            date={date} 
            appointments={appointments}
            onAppointmentClick={handleViewAppointment}
            isInteractive={isAdmin}
            onRefresh={fetchAppointments}
          />
        </CardContent>
      </Card>
    );
  };

  const renderMonthlyView = () => {
    const start = parseISO(format(date, 'yyyy-MM-01'));
    const end = parseISO(format(addDays(date, 31), 'yyyy-MM-dd'));
    const days = eachDayOfInterval({ start, end });
    const firstDayOfMonth = new Date(format(date, 'yyyy-MM-01')).getDay();
    
    const emptyDays = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    return (
      <div className="grid grid-cols-7 gap-1">
        {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map((day) => (
          <div key={day} className="text-center font-medium p-2 text-sm">
            {day}
          </div>
        ))}
        {Array.from({ length: emptyDays }).map((_, i) => (
          <div key={`empty-${i}`} className="p-2 h-24" />
        ))}
        {days.map((day) => {
          const dayAppointments = appointments.filter(
            (appointment) => 
              new Date(appointment.date).getDate() === day.getDate() &&
              new Date(appointment.date).getMonth() === day.getMonth() &&
              new Date(appointment.date).getFullYear() === day.getFullYear()
          );
          
          return (
            <div 
              key={day.toString()} 
              className={`border rounded-md p-1 h-24 overflow-y-auto ${
                day.getDate() === new Date().getDate() && 
                day.getMonth() === new Date().getMonth() &&
                day.getFullYear() === new Date().getFullYear()
                  ? "bg-accent/30"
                  : ""
              }`}
              onClick={() => {
                setDate(day);
                setView("day");
              }}
            >
              <div className="text-right text-sm font-medium mb-1">
                {format(day, "d", { locale: it })}
              </div>
              {dayAppointments.map((appointment) => (
                <div 
                  key={appointment.id}
                  className="text-xs p-1 mb-1 rounded bg-primary/10 truncate cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewAppointment(appointment);
                  }}
                >
                  {appointment.time} - {appointment.client}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    );
  };

  // Se l'utente non è admin, mostra la vista client
  if (!isAdmin) {
    return (
      <div className="space-y-8 animate-slide-in">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">I Tuoi Appuntamenti</h2>
            <p className="text-muted-foreground">Prenota e gestisci i tuoi appuntamenti</p>
          </div>
        </div>
        
        <ClientBookingView />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-slide-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Appuntamenti</h2>
          <p className="text-muted-foreground">Gestisci gli appuntamenti del salone</p>
        </div>
        <Button onClick={() => navigate("/appointments/new")} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          <span>Nuovo Appuntamento</span>
        </Button>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-10 flex justify-center">
            <div className="text-center">
              <p className="text-muted-foreground">Caricamento degli appuntamenti in corso...</p>
            </div>
          </CardContent>
        </Card>
      ) : appointments.length === 0 ? (
        <Card>
          <CardContent className="p-10">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">Nessun appuntamento trovato</p>
              <Button onClick={() => navigate("/appointments/new")}>Crea il primo appuntamento</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="day" value={view} onValueChange={setView} className="space-y-4">
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="day">Giorno</TabsTrigger>
              <TabsTrigger value="week">Settimana</TabsTrigger>
              <TabsTrigger value="month">Mese</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-r-none"
                  onClick={() => setDate(prev => addDays(prev, -1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-l-none"
                  onClick={() => setDate(prev => addDays(prev, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-sm font-medium">
                {format(date, "d MMMM yyyy", { locale: it })}
              </div>
            </div>
          </div>

          <TabsContent value="day" className="space-y-4">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Programma Giornaliero</CardTitle>
                    <CardDescription>
                      Appuntamenti per il {format(date, "d MMMM yyyy", { locale: it })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="max-h-[600px] overflow-y-auto">
                    <div className="space-y-1">
                      {fasce_orarie.map(renderTimeSlot)}
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Calendario</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(newDate) => newDate && setDate(newDate)}
                      className="pointer-events-auto"
                      locale={it}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="week">
            {renderWeeklyView()}
          </TabsContent>

          <TabsContent value="month">
            <Card>
              <CardHeader>
                <CardTitle>Vista Mensile</CardTitle>
                <CardDescription>
                  Visualizza gli appuntamenti per {format(date, "MMMM yyyy", { locale: it })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderMonthlyView()}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Edit Dialog - solo per admin */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Appuntamento</DialogTitle>
            <DialogDescription>
              Modifica i dettagli dell'appuntamento
            </DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div>
                <Label>Servizio</Label>
                <Input 
                  defaultValue={selectedAppointment.service}
                  className="mt-1.5"
                  onChange={(e) => setSelectedAppointment({
                    ...selectedAppointment,
                    service: e.target.value
                  })}
                />
              </div>
              <div>
                <Label>Orario</Label>
                <Input 
                  defaultValue={selectedAppointment.time}
                  className="mt-1.5"
                  onChange={(e) => setSelectedAppointment({
                    ...selectedAppointment,
                    time: e.target.value
                  })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={() => handleUpdate(selectedAppointment.id, selectedAppointment)}>
              Salva Modifiche
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Appointment Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Dettagli Appuntamento</DialogTitle>
            <DialogDescription>
              Visualizza i dettagli dell'appuntamento
            </DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>{selectedAppointment.avatar}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{selectedAppointment.client}</div>
                  <Badge variant={selectedAppointment.status === "confermato" ? "default" : "outline"}>
                    {selectedAppointment.status}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Scissors className="h-4 w-4 mt-0.5 text-primary" />
                  <div>
                    <div className="font-medium text-sm">Servizio</div>
                    <div className="text-sm text-muted-foreground">{selectedAppointment.service}</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <CalendarIcon className="h-4 w-4 mt-0.5 text-primary" />
                  <div>
                    <div className="font-medium text-sm">Data</div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(selectedAppointment.date), "d MMMM yyyy", { locale: it })}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 mt-0.5 text-primary" />
                  <div>
                    <div className="font-medium text-sm">Orario</div>
                    <div className="text-sm text-muted-foreground">{selectedAppointment.time} ({selectedAppointment.duration})</div>
                  </div>
                </div>
                
                {selectedAppointment.notes && (
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 text-primary" />
                    <div>
                      <div className="font-medium text-sm">Note</div>
                      <div className="text-sm text-muted-foreground">{selectedAppointment.notes}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter className="flex sm:justify-between">
            {isAdmin && (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1" 
                  onClick={() => {
                    if (selectedAppointment?.clientEmail) {
                      sendEmailNotification(
                        selectedAppointment.clientEmail, 
                        selectedAppointment.client,
                        selectedAppointment.service,
                        format(new Date(selectedAppointment.date), "d MMMM yyyy", { locale: it }),
                        selectedAppointment.time,
                        "new"
                      );
                    } else {
                      toast.error("Email del cliente non disponibile");
                    }
                  }}
                  disabled={isEmailSending}
                >
                  <Mail className="h-4 w-4" />
                  <span>Invia Promemoria</span>
                </Button>
              </div>
            )}
            <div className="flex gap-2">
              {isAdmin && (
                <>
                  <Button variant="default" size="sm" onClick={() => handleEdit(selectedAppointment)}>
                    Modifica
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        Elimina
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Questa azione non può essere annullata. L'appuntamento verrà eliminato permanentemente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annulla</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(selectedAppointment.id)}>
                          Elimina
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
              {!isAdmin && (
                <Button variant="outline" size="sm" onClick={() => setIsViewDialogOpen(false)}>
                  Chiudi
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Booking Modal per gli slot vuoti - solo per admin */}
      <AppointmentBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        date={date}
        time={selectedTimeSlot || ""}
        onSuccess={handleBookingSuccess}
      />
    </div>
  );
};

export default Appointments;
