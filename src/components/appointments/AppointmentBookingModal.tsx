
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
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { it } from "date-fns/locale";

const appointmentSchema = z.object({
  service: z.string().min(1, { message: "Seleziona un servizio" }),
  clientId: z.string().min(1, { message: "Seleziona un cliente" }),
  notes: z.string().optional(),
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

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      service: "",
      clientId: user?.id || "",
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
          console.error("Error fetching services:", error);
          toast.error("Errore nel caricamento dei servizi");
          return;
        }
        
        setServices(data || []);
      } catch (error) {
        console.error("Unexpected error fetching services:", error);
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
          console.error("Error fetching clients:", error);
          toast.error("Errore nel caricamento dei clienti");
          return;
        }
        
        setClients(data || []);
      } catch (error) {
        console.error("Unexpected error fetching clients:", error);
      }
    };
    
    if (isOpen) {
      fetchServices();
      fetchClients();
      
      // Reset form with new default values when modal opens
      form.reset({
        service: "",
        clientId: user?.id || "",
        notes: "",
      });
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
      const appointmentData = {
        client_id: isAdmin ? formData.clientId : user?.id,
        service: formData.service,
        duration: selectedService.duration,
        date: format(date, "yyyy-MM-dd"),
        time: time,
        notes: formData.notes || null,
        status: "in attesa",
      };
      
      console.log("Creating appointment with data:", appointmentData);
      
      const { data, error } = await supabase
        .from('appointments')
        .insert(appointmentData);
      
      if (error) {
        console.error("Error creating appointment:", error);
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
      console.error("Unexpected error creating appointment:", error);
      toast.error(error.message || "Si è verificato un errore durante la prenotazione");
    } finally {
      setIsLoading(false);
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
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
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
