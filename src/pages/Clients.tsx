
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Mail, Phone, Plus, Search, User } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const Clients = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newClient, setNewClient] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });

  const { user } = useAuth();

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
          ...profile,
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Cliente Sconosciuto',
          avatar: `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`,
          lastVisit: 'Non disponibile',
          appointmentsCount: 0
        }));
        
        setClients(formattedClients);
      } catch (error) {
        console.error("Unexpected error fetching clients:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClients();
  }, [user]);

  const handleAddClient = async () => {
    if (!user) return;

    try {
      // Generate a unique ID for the new profile
      const newId = crypto.randomUUID();
      
      const { data, error } = await supabase
        .from('profiles')
        .insert([{
          id: newId, // Add the required ID field
          first_name: newClient.first_name,
          last_name: newClient.last_name,
          email: newClient.email,
          phone: newClient.phone
        }])
        .select();

      if (error) {
        console.error("Error adding client:", error);
        toast.error("Errore nell'aggiunta del cliente");
        return;
      }

      if (data) {
        const newClientProfile = {
          ...data[0],
          name: `${data[0].first_name || ''} ${data[0].last_name || ''}`.trim(),
          avatar: `${data[0].first_name?.[0] || ''}${data[0].last_name?.[0] || ''}`,
          lastVisit: 'Non disponibile',
          appointmentsCount: 0
        };

        setClients(prevClients => [...prevClients, newClientProfile]);
        toast.success("Cliente aggiunto con successo!");
        setDialogOpen(false);
        setNewClient({ first_name: "", last_name: "", email: "", phone: "" });
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      toast.error("Errore nell'aggiunta del cliente");
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (client.phone && client.phone.includes(searchTerm))
  );

  return (
    <div className="space-y-8 animate-slide-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Clienti</h2>
          <p className="text-muted-foreground">Gestisci le informazioni dei clienti</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>Aggiungi Cliente</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Aggiungi Nuovo Cliente</DialogTitle>
              <DialogDescription>
                Inserisci le informazioni del cliente
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-2">
                  <Label htmlFor="first_name">Nome</Label>
                  <Input
                    id="first_name"
                    value={newClient.first_name}
                    onChange={(e) => setNewClient({ ...newClient, first_name: e.target.value })}
                    placeholder="Nome"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="last_name">Cognome</Label>
                  <Input
                    id="last_name"
                    value={newClient.last_name}
                    onChange={(e) => setNewClient({ ...newClient, last_name: e.target.value })}
                    placeholder="Cognome"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                  placeholder="Indirizzo email"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Telefono</Label>
                <Input
                  id="phone"
                  value={newClient.phone}
                  onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                  placeholder="Numero di telefono"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annulla
              </Button>
              <Button type="button" onClick={handleAddClient}>Aggiungi Cliente</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca clienti per nome, email o telefono..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">Tutti i Clienti</TabsTrigger>
            <TabsTrigger value="recent">Recenti</TabsTrigger>
            <TabsTrigger value="frequent">Frequenti</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Elenco Clienti</CardTitle>
                <CardDescription>
                  {filteredClients.length} clienti totali
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Caricamento clienti...
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredClients.length > 0 ? (
                      filteredClients.map((client) => (
                        <div
                          key={client.id}
                          className="flex flex-col sm:flex-row sm:justify-between p-4 rounded-lg appointment-card bg-secondary/50"
                        >
                          <div className="flex items-start gap-4 mb-3 sm:mb-0">
                            <Avatar className="h-10 w-10 border border-border">
                              <AvatarFallback>{client.avatar}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-medium">{client.name}</h4>
                              <div className="flex flex-col sm:flex-row sm:gap-4 text-sm text-muted-foreground">
                                {client.email && (
                                  <div className="flex items-center gap-1">
                                    <Mail className="h-3.5 w-3.5" />
                                    <span>{client.email}</span>
                                  </div>
                                )}
                                {client.phone && (
                                  <div className="flex items-center gap-1">
                                    <Phone className="h-3.5 w-3.5" />
                                    <span>{client.phone}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-row sm:flex-col items-center sm:items-end gap-4 sm:gap-1">
                            <div className="text-sm flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>Ultima visita: {client.lastVisit}</span>
                            </div>
                            <Badge variant="outline" className="rounded-full">
                              {client.appointmentsCount} appuntamenti
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        Nessun cliente corrisponde alla ricerca. Prova parole chiave diverse o aggiungi un nuovo cliente.
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="recent" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Recenti Clienti</CardTitle>
                <CardDescription>
                  Clienti che hanno visitato negli ultimi 30 giorni
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Visualizzazione recenti clienti in corso di implementazione.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="frequent" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Frequenti Clienti</CardTitle>
                <CardDescription>
                  Clienti con il maggior numero di appuntamenti
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Visualizzazione clienti frequenti in corso di implementazione.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Clients;
