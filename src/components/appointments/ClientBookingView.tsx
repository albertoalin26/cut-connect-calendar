
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Scissors } from "lucide-react";
import { format, addDays, addMonths } from "date-fns";
import { it } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import AppointmentBookingModal from "./AppointmentBookingModal";

interface MyAppointment {
  id: string;
  date: string;
  time: string;
  service: string;
  status: string;
  notes?: string;
}

const ClientBookingView = () => {
  const { user } = useAuth();
  const [date, setDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [myAppointments, setMyAppointments] = useState<MyAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<"book" | "appointments">("book");

  // Funzione per ottenere gli slot orari disponibili per una data
  const fetchAvailableSlots = async (date: Date) => {
    try {
      setIsLoading(true);
      
      // Formattare la data come stringa per la query
      const dateString = format(date, "yyyy-MM-dd");
      
      // Ottenere tutti gli appuntamenti per il giorno selezionato
      console.log("Checking appointments for date:", dateString);
      
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('time, status')
        .eq('date', dateString)
        .in('status', ['confermato', 'in attesa']); // Solo appuntamenti attivi
      
      console.log("Fetched appointments for date", dateString, ":", appointments);
      
      if (error) {
        console.error("Error fetching appointments:", error);
        toast.error("Errore nel caricamento degli appuntamenti");
        return;
      }

      // Ottieni l'elenco degli orari già prenotati
      const bookedSlots = appointments?.map(app => app.time) || [];
      console.log("Booked slots:", bookedSlots);
      
      // Array con tutti gli slot orari possibili (9:00 - 18:00, ogni 30 minuti)
      const allTimeSlots = [
        "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", 
        "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", 
        "17:00", "17:30"
      ];
      
      // Filtra gli slot disponibili (quelli non prenotati)
      const available = allTimeSlots.filter(slot => !bookedSlots.includes(slot));
      
      setAvailableSlots(available);
    } catch (error) {
      console.error("Unexpected error fetching available slots:", error);
      toast.error("Errore nel caricamento degli orari disponibili");
    } finally {
      setIsLoading(false);
    }
  };

  // Funzione per ottenere i miei appuntamenti
  const fetchMyAppointments = async () => {
    if (!user) return;
    
    try {
      console.log("Fetching appointments for user:", user.id);
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('client_id', user.id)
        .order('date', { ascending: true })
        .order('time', { ascending: true });
      
      console.log("User appointments result:", { data, error });
      
      if (error) {
        console.error("Error fetching my appointments:", error);
        toast.error("Errore nel caricamento dei tuoi appuntamenti");
        return;
      }
      
      setMyAppointments(data || []);
    } catch (error) {
      console.error("Unexpected error fetching my appointments:", error);
    }
  };

  // Carica gli slot disponibili quando la data cambia
  useEffect(() => {
    fetchAvailableSlots(selectedDate);
  }, [selectedDate]);

  // Carica i miei appuntamenti all'avvio e quando cambia la vista
  useEffect(() => {
    if (view === "appointments") {
      fetchMyAppointments();
    }
  }, [view, user]);

  // Gestisce la selezione di uno slot orario
  const handleTimeSlotSelect = (time: string) => {
    setSelectedTime(time);
    setBookingModalOpen(true);
  };

  // Aggiorna i dati dopo una prenotazione riuscita
  const handleBookingSuccess = () => {
    console.log("Booking success callback received - refreshing data");
    
    // Ricarica gli slot disponibili per la data selezionata
    if (selectedDate) {
      fetchAvailableSlots(selectedDate);
    }
    
    // Ricarica gli appuntamenti dell'utente
    fetchMyAppointments();
    
    // Chiudi il modal
    setBookingModalOpen(false);
  };

  // Gestisce la cancellazione di un appuntamento
  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancellato' })
        .eq('id', appointmentId);
      
      if (error) {
        console.error("Error canceling appointment:", error);
        toast.error("Errore nella cancellazione dell'appuntamento");
        return;
      }
      
      toast.success("Appuntamento cancellato con successo");
      fetchMyAppointments();
    } catch (error) {
      console.error("Unexpected error canceling appointment:", error);
      toast.error("Errore nella cancellazione dell'appuntamento");
    }
  };

  // Formattazione dello stato dell'appuntamento
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confermato':
        return <Badge>Confermato</Badge>;
      case 'in attesa':
        return <Badge variant="outline">In attesa</Badge>;
      case 'cancellato':
        return <Badge variant="destructive">Cancellato</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={view} onValueChange={(v: any) => setView(v)}>
        <TabsList>
          <TabsTrigger value="book">Prenota</TabsTrigger>
          <TabsTrigger value="appointments">I Miei Appuntamenti</TabsTrigger>
        </TabsList>
        <TabsContent value="book" className="space-y-6 mt-6 animate-in fade-in-50">
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Orari Disponibili</CardTitle>
                <CardDescription>
                  Seleziona un orario disponibile per prenotare il tuo appuntamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="text-center p-8">
                    <p className="text-muted-foreground">
                      Nessun orario disponibile per il giorno selezionato.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Prova a selezionare un'altra data.
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {availableSlots.map((time) => (
                        <Button
                          key={time}
                          variant="outline"
                          className="flex items-center gap-2 h-auto py-3"
                          onClick={() => handleTimeSlotSelect(time)}
                        >
                          <Clock className="h-4 w-4 text-primary" />
                          <span>{time}</span>
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Seleziona Data</CardTitle>
                <CardDescription>
                  Scegli la data per il tuo appuntamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setDate(addMonths(date, -1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-center">
                    <h3 className="font-medium">
                      {format(date, "MMMM yyyy", { locale: it })}
                    </h3>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setDate(addMonths(date, 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(newDate) => newDate && setSelectedDate(newDate)}
                  fromDate={new Date()}
                  locale={it}
                  month={date}
                  className="border rounded-lg p-3"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="appointments" className="space-y-6 mt-6 animate-in fade-in-50">
          <Card>
            <CardHeader>
              <CardTitle>I Miei Appuntamenti</CardTitle>
              <CardDescription>
                Visualizza e gestisci i tuoi appuntamenti
              </CardDescription>
            </CardHeader>
            <CardContent>
              {myAppointments.length === 0 ? (
                <div className="text-center p-8">
                  <CalendarIcon className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">Non hai ancora prenotato nessun appuntamento.</p>
                  <Button
                    className="mt-4"
                    onClick={() => setView("book")}
                  >
                    Prenota un appuntamento
                  </Button>
                </div>
              ) : (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {myAppointments.map((appointment) => (
                      <Card key={appointment.id} className="relative">
                        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="h-4 w-4 text-primary" />
                              <span className="font-medium">
                                {format(new Date(appointment.date), "d MMMM yyyy", { locale: it })}
                              </span>
                              <span>•</span>
                              <Clock className="h-4 w-4 text-primary" />
                              <span>{appointment.time}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Scissors className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">{appointment.service}</span>
                            </div>
                            {appointment.notes && (
                              <p className="text-sm text-muted-foreground mt-1">
                                Note: {appointment.notes}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            {getStatusBadge(appointment.status)}
                            {appointment.status !== 'cancellato' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive"
                                onClick={() => handleCancelAppointment(appointment.id)}
                              >
                                Cancella
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal di prenotazione */}
      <AppointmentBookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        date={selectedDate}
        time={selectedTime}
        onSuccess={handleBookingSuccess}
      />
    </div>
  );
};

export default ClientBookingView;
