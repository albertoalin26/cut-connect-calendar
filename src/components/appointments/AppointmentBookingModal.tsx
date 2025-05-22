
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { it } from "date-fns/locale";

const appointmentSchema = z.object({
  service: z.string().min(1, { message: "Seleziona un servizio" }),
  clientId: z.string().optional(),
  clientName: z.string().min(1, { message: "Nome cliente richiesto" }).optional(),
  notes: z.string().optional(),
}).refine(data => {
  // Almeno uno tra clientId o clientName deve essere fornito
  return data.clientId || data.clientName;
}, {
  message: "Seleziona un cliente esistente o inserisci un nuovo nome",
  path: ["clientName"],
});

type AppointmentFormValues = z.infer<typeof appointmentSchema>;

interface AppointmentBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  time: string;
  onSuccess?: () => void;
}

const AppointmentBookingModal: React.FC<AppointmentBookingModalProps> = ({
  isOpen,
  onClose,
  date,
  time,
  onSuccess,
}) => {
  const { user, isAdmin } = useAuth();
  const [services, setServices] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [clientInputType, setClientInputType] = useState<"select" | "input">("select");

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      service: "",
      clientId: user?.id || "",
      clientName: "",
      notes: "",
    },
  });

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .order('name');
        
        if (error) {
          console.error("Errore nel caricamento dei servizi:", error);
          toast.error("Errore nel caricamento dei servizi");
          return;
        }
        
        setServices(data || []);
      } catch (error) {
        console.error("Errore imprevisto nel caricamento dei servizi:", error);
      }
    };
    
    const fetchClients = async () => {
      if (!isAdmin) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('first_name');
        
        if (error) {
          console.error("Errore nel caricamento dei clienti:", error);
          toast.error("Errore nel caricamento dei clienti");
          return;
        }
        
        setClients(data || []);
      } catch (error) {
        console.error("Errore imprevisto nel caricamento dei clienti:", error);
      }
    };
    
    if (isOpen) {
      fetchServices();
      fetchClients();
      
      // Reset form with new default values when modal opens
      form.reset({
        service: "",
        clientId: user?.id || "",
        clientName: "",
        notes: "",
      });
      
      // Reset client input type to select
      setClientInputType("select");
    }
  }, [isOpen, isAdmin, user, form]);

  const onSubmit = async (formData: AppointmentFormValues) => {
    try {
      setIsLoading(true);
      
      // Trova il servizio selezionato per ottenere la durata
      const selectedService = services.find(service => service.name === formData.service);
      
      if (!selectedService) {
        toast.error("Servizio non trovato");
        return;
      }
      
      // Prepara i dati dell'appuntamento
      const appointmentData: any = {
        service: formData.service,
        duration: selectedService.duration,
        date: format(date, "yyyy-MM-dd"),
        time: time,
        notes: formData.notes || null,
        status: "in attesa",
      };
      
      // Se è admin e ha selezionato un cliente esistente
      if (isAdmin && clientInputType === "select" && formData.clientId) {
        appointmentData.client_id = formData.clientId;
      } 
      // Se è admin e ha inserito un nuovo nome cliente
      else if (isAdmin && clientInputType === "input" && formData.clientName) {
        // Genera un UUID per il nuovo cliente
        const newClientId = crypto.randomUUID();
        
        // Crea un profilo per il nuovo cliente
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: newClientId,
            first_name: formData.clientName,
            email: null
          });

        if (profileError) {
          console.error("Errore nella creazione del profilo cliente:", profileError);
          toast.error("Errore nella creazione del profilo cliente");
          return;
        }

        appointmentData.client_id = newClientId;
      } 
      // Se non è admin, usa l'ID utente corrente
      else {
        appointmentData.client_id = user?.id;
      }
      
      console.log("Creazione appuntamento con i dati:", appointmentData);
      
      const { data, error } = await supabase
        .from('appointments')
        .insert(appointmentData);
      
      if (error) {
        console.error("Errore nella creazione dell'appuntamento:", error);
        toast.error("Errore nella creazione dell'appuntamento");
        return;
      }
      
      toast.success("Appuntamento prenotato con successo!");
      form.reset();
      onClose();
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Errore imprevisto nella creazione dell'appuntamento:", error);
      toast.error(error.message || "Si è verificato un errore durante la prenotazione");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleClientInputType = () => {
    if (clientInputType === "select") {
      setClientInputType("input");
      form.setValue("clientId", undefined);
    } else {
      setClientInputType("select");
      form.setValue("clientName", "");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Prenota un appuntamento</DialogTitle>
          <DialogDescription>
            Prenota un appuntamento per il {format(date, "d MMMM yyyy", { locale: it })} alle {time}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {isAdmin && (
              <FormItem>
                <div className="flex items-center justify-between mb-2">
                  <FormLabel>Cliente</FormLabel>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={toggleClientInputType}
                  >
                    {clientInputType === "select" ? "Nuovo cliente" : "Scegli cliente"}
                  </Button>
                </div>

                {clientInputType === "select" ? (
                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleziona un cliente" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clients.map((client) => (
                            <SelectItem 
                              key={client.id} 
                              value={client.id}
                            >
                              {client.first_name || ''} {client.last_name || ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                ) : (
                  <FormField
                    control={form.control}
                    name="clientName"
                    render={({ field }) => (
                      <FormControl>
                        <Input 
                          placeholder="Inserisci il nome del cliente" 
                          {...field} 
                        />
                      </FormControl>
                    )}
                  />
                )}
                <FormMessage />
              </FormItem>
            )}

            <FormField
              control={form.control}
              name="service"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Servizio</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona un servizio" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.name}>
                          {service.name} - {service.price}€ ({service.duration})
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
                  <FormLabel>Note (opzionale)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Aggiungi note o richieste particolari"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Annulla
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Prenotazione in corso..." : "Prenota"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentBookingModal;
