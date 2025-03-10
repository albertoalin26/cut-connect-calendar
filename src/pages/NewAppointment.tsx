
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { CalendarIcon, Scissors, ArrowLeft, Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { it } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const appointmentFormSchema = z.object({
  client: z.string().min(2, { message: "Il nome del cliente è obbligatorio" }),
  service: z.string().min(1, { message: "Il servizio è obbligatorio" }),
  date: z.date({ required_error: "La data dell'appuntamento è obbligatoria" }),
  time: z.string().min(1, { message: "L'orario dell'appuntamento è obbligatorio" }),
  duration: z.string().min(1, { message: "La durata è obbligatoria" }),
  notes: z.string().optional(),
});

const timeSlots = [
  "9:00", "9:30", "10:00", "10:30", "11:00", 
  "11:30", "12:00", "12:30", "13:00", "13:30", 
  "14:00", "14:30", "15:00", "15:30", "16:00", 
  "16:30", "17:00", "17:30", "18:00"
];

const durations = [
  "15 min", "30 min", "45 min", "1 ora", "1.5 ore", "2 ore", "2.5 ore", "3 ore"
];

type FormData = z.infer<typeof appointmentFormSchema>;

const NewAppointment = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const form = useForm<FormData>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      notes: "",
      date: new Date(),
    },
  });

  // Fetch clients and services when component mounts
  useEffect(() => {
    const fetchClients = async () => {
      if (!user) return;
      
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

    const fetchServices = async () => {
      try {
        const { data, error } = await supabase
          .from('services')
          .select('*');
        
        if (error) {
          console.error("Error fetching services:", error);
          toast.error("Errore nel caricamento dei servizi");
          return;
        }
        
        if (data.length === 0) {
          // If no services in database, use default services
          setServices([
            { id: 1, name: "Taglio", duration: "30 min", price: "€35" },
            { id: 2, name: "Taglio & Piega", duration: "45 min", price: "€50" },
            { id: 3, name: "Colorazione", duration: "2 ore", price: "€120" },
            { id: 4, name: "Meches", duration: "1.5 ore", price: "€100" },
            { id: 5, name: "Piega", duration: "30 min", price: "€30" },
            { id: 6, name: "Trattamento Capelli", duration: "1 ora", price: "€65" },
            { id: 7, name: "Barba", duration: "15 min", price: "€20" },
          ]);
        } else {
          setServices(data);
        }
      } catch (error) {
        console.error("Unexpected error fetching services:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClients();
    fetchServices();
  }, [user]);

  const sendEmailNotification = async (
    email: string,
    clientName: string,
    service: string,
    date: string,
    time: string
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
          action: "new"
        }
      });

      if (error) {
        console.error("Errore nell'invio dell'email:", error);
        toast.error("Errore nell'invio dell'email di notifica");
      } else {
        toast.success("Email di conferma inviata con successo");
      }
    } catch (error) {
      console.error("Errore nell'invio dell'email:", error);
      toast.error("Errore nell'invio dell'email di notifica");
    } finally {
      setIsEmailSending(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!user) {
      toast.error("Devi essere autenticato per creare un appuntamento");
      return;
    }
    
    try {
      // Find or create client profile
      let clientId = user.id; // Default to current user
      let clientEmail = '';
      let clientName = data.client;
      
      // Check if client already exists in our profiles
      const existingClient = clients.find(
        client => client.name.toLowerCase() === data.client.toLowerCase()
      );
      
      if (existingClient) {
        clientId = existingClient.id;
        clientEmail = existingClient.email;
        clientName = existingClient.name;
      } else {
        // Create a new profile if client doesn't exist
        // This would be done in a real app, but for simplicity we'll just use the current user
        toast.info("Cliente non trovato nel database, utilizzo dell'utente corrente");
      }
      
      // Format date for storage
      const formattedDate = data.date.toISOString();
      
      // Insert appointment into Supabase
      const { data: newAppointment, error } = await supabase
        .from('appointments')
        .insert({
          client_id: clientId,
          service: data.service,
          duration: data.duration,
          time: data.time,
          date: formattedDate,
          notes: data.notes,
          status: 'confermato'
        })
        .select()
        .single();
      
      if (error) {
        console.error("Error creating appointment:", error);
        toast.error("Errore nella creazione dell'appuntamento");
        return;
      }
      
      toast.success("Appuntamento creato con successo!");
      
      // Send email notification if we have client email
      if (clientEmail) {
        sendEmailNotification(
          clientEmail,
          clientName,
          data.service,
          format(data.date, "d MMMM yyyy", { locale: it }),
          data.time
        );
      }
      
      // Navigate back to appointments page
      navigate("/appointments");
    } catch (error) {
      console.error("Unexpected error creating appointment:", error);
      toast.error("Errore nella creazione dell'appuntamento");
    }
  };

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate("/appointments")}
          className="rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Nuovo Appuntamento</h2>
          <p className="text-muted-foreground">Pianifica un nuovo appuntamento</p>
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-10 flex justify-center">
            <div className="text-center">
              <p className="text-muted-foreground">Caricamento in corso...</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Dettagli Appuntamento</CardTitle>
              <CardDescription>
                Inserisci le informazioni dell'appuntamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="client"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cliente</FormLabel>
                          <div className="space-y-2">
                            <div className="flex items-center">
                              <User className="mr-2 h-4 w-4 text-muted-foreground" />
                              <Input 
                                placeholder="Cerca clienti o inserisci un nuovo nome" 
                                value={searchTerm}
                                onChange={e => {
                                  setSearchTerm(e.target.value);
                                  field.onChange(e.target.value);
                                  setSelectedClient(null);
                                }}
                                className="flex-1"
                              />
                            </div>
                            {searchTerm && (
                              <div className="bg-background border rounded-md max-h-40 overflow-y-auto">
                                {filteredClients.length > 0 ? (
                                  filteredClients.map(client => (
                                    <div 
                                      key={client.id} 
                                      className="p-2 cursor-pointer hover:bg-accent"
                                      onClick={() => {
                                        field.onChange(client.name);
                                        setSearchTerm(client.name);
                                        setSelectedClient(client);
                                      }}
                                    >
                                      <div className="font-medium">{client.name}</div>
                                      <div className="text-xs text-muted-foreground">{client.phone} • {client.email}</div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="p-2 text-muted-foreground text-sm">
                                    Nessun cliente trovato. Usa questo nome per creare un nuovo cliente.
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="service"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Servizio</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <div className="flex items-center gap-2">
                                  <Scissors className="h-4 w-4 text-muted-foreground" />
                                  <SelectValue placeholder="Seleziona un servizio" />
                                </div>
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {services.map((service) => (
                                <SelectItem key={service.id} value={service.name}>
                                  <div className="flex justify-between w-full">
                                    <span>{service.name}</span>
                                    <span className="text-muted-foreground text-sm">
                                      {service.duration} • {service.price}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Data</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                                    {field.value ? (
                                      format(field.value, "PPP", {locale: it})
                                    ) : (
                                      <span>Seleziona una data</span>
                                    )}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  initialFocus
                                  className="pointer-events-auto"
                                  locale={it}
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="time"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Orario</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <SelectValue placeholder="Seleziona un orario" />
                                  </div>
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {timeSlots.map((time) => (
                                  <SelectItem key={time} value={time}>
                                    {time}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Durata</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <SelectValue placeholder="Seleziona la durata" />
                                </div>
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {durations.map((duration) => (
                                <SelectItem key={duration} value={duration}>
                                  {duration}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Note</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Aggiungi istruzioni o note speciali"
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => navigate("/appointments")}>
                      Annulla
                    </Button>
                    <Button type="submit">
                      Salva Appuntamento
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informazioni Rapide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-sm mb-1">Categorie di Servizi</h4>
                <div className="space-y-2">
                  {["Tagli", "Styling", "Colorazione", "Trattamenti"].map((category) => (
                    <div key={category} className="flex items-center gap-2">
                      <Scissors className="h-4 w-4 text-primary" />
                      <span className="text-sm">{category}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-sm mb-1">Orari di Lavoro</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Lunedì - Venerdì: 9:00 - 18:00</p>
                  <p>Sabato: 10:00 - 16:00</p>
                  <p>Domenica: Chiuso</p>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-sm mb-1">Hai bisogno di aiuto?</h4>
                <p className="text-sm text-muted-foreground">
                  Controlla la disponibilità prima di programmare. Per prenotazioni 
                  complesse, contatta direttamente il salone.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default NewAppointment;
