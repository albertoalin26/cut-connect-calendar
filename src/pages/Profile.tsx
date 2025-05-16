
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Scissors,
  User,
  Mail,
  Phone,
  Pencil
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface Appointment {
  id: string;
  date: string;
  time: string;
  service: string;
  status: string;
  duration: string;
  notes?: string;
}

interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
}

const Profile = () => {
  // Use auth guard to protect the page
  useAuthGuard();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load profile data
  useEffect(() => {
    const loadProfileData = async () => {
      if (!user) return;

      setIsLoading(true);
      
      try {
        // Fetch profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (profileError) {
          console.error("Error fetching profile:", profileError);
          toast.error("Errore nel caricamento del profilo");
          return;
        }

        setProfile(profileData);

        // Fetch appointments
        const { data: appointmentsData, error: appointmentsError } = await supabase
          .from('appointments')
          .select('*')
          .eq('client_id', user.id)
          .order('date', { ascending: false })
          .order('time', { ascending: true });

        if (appointmentsError) {
          console.error("Error fetching appointments:", appointmentsError);
          toast.error("Errore nel caricamento degli appuntamenti");
          return;
        }

        setAppointments(appointmentsData || []);
      } catch (error) {
        console.error("Unexpected error:", error);
        toast.error("Si è verificato un errore imprevisto");
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileData();
  }, [user]);

  // Format the name from profile data
  const formatName = () => {
    if (!profile) return "Utente";
    
    const firstName = profile.first_name || "";
    const lastName = profile.last_name || "";
    
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }
    
    return "Utente";
  };

  // Create initials for avatar
  const getInitials = () => {
    if (!profile) return "U";
    
    const firstName = profile.first_name || "";
    const lastName = profile.last_name || "";
    
    if (firstName || lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase().trim();
    }
    
    return "U";
  };

  // Get status badge based on appointment status
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

  // Handle cancel appointment
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
      
      // Update local state
      setAppointments(appointments.map(app => 
        app.id === appointmentId ? { ...app, status: 'cancellato' } : app
      ));
      
      toast.success("Appuntamento cancellato con successo");
    } catch (error) {
      console.error("Unexpected error canceling appointment:", error);
      toast.error("Errore nella cancellazione dell'appuntamento");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-slide-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Il Tuo Profilo</h2>
        <p className="text-muted-foreground">
          Gestisci le tue informazioni personali e visualizza i tuoi appuntamenti
        </p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-xl">{getInitials()}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>{formatName()}</CardTitle>
                <CardDescription>{profile?.email}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Nome:</span>
                <span>{profile?.first_name || "Non specificato"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Cognome:</span>
                <span>{profile?.last_name || "Non specificato"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Email:</span>
                <span>{profile?.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Telefono:</span>
                <span>{profile?.phone || "Non specificato"}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Appointments Card */}
        <div className="md:col-span-2">
          <Tabs defaultValue="all">
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="all">Tutti</TabsTrigger>
                <TabsTrigger value="upcoming">Prossimi</TabsTrigger>
                <TabsTrigger value="past">Passati</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="all">
              <Card>
                <CardHeader>
                  <CardTitle>I Tuoi Appuntamenti</CardTitle>
                  <CardDescription>Visualizza tutti i tuoi appuntamenti</CardDescription>
                </CardHeader>
                <CardContent>
                  {appointments.length === 0 ? (
                    <div className="text-center p-6">
                      <CalendarIcon className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                      <p className="text-muted-foreground">Non hai ancora prenotato nessun appuntamento.</p>
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Orario</TableHead>
                            <TableHead>Servizio</TableHead>
                            <TableHead>Stato</TableHead>
                            <TableHead className="text-right">Azioni</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {appointments.map((appointment) => (
                            <TableRow key={appointment.id}>
                              <TableCell>
                                {format(new Date(appointment.date), "d MMM yyyy", { locale: it })}
                              </TableCell>
                              <TableCell>{appointment.time}</TableCell>
                              <TableCell>{appointment.service}</TableCell>
                              <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                              <TableCell className="text-right">
                                {appointment.status !== 'cancellato' && 
                                  new Date(appointment.date) > new Date() && (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="text-destructive"
                                    onClick={() => handleCancelAppointment(appointment.id)}
                                  >
                                    Cancella
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="upcoming">
              <Card>
                <CardHeader>
                  <CardTitle>Prossimi Appuntamenti</CardTitle>
                  <CardDescription>I tuoi appuntamenti futuri</CardDescription>
                </CardHeader>
                <CardContent>
                  {appointments.filter(app => 
                    new Date(app.date) >= new Date() && 
                    app.status !== 'cancellato'
                  ).length === 0 ? (
                    <div className="text-center p-6">
                      <CalendarIcon className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                      <p className="text-muted-foreground">Non hai appuntamenti futuri.</p>
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Orario</TableHead>
                            <TableHead>Servizio</TableHead>
                            <TableHead>Stato</TableHead>
                            <TableHead className="text-right">Azioni</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {appointments
                            .filter(app => 
                              new Date(app.date) >= new Date() && 
                              app.status !== 'cancellato'
                            )
                            .map((appointment) => (
                              <TableRow key={appointment.id}>
                                <TableCell>
                                  {format(new Date(appointment.date), "d MMM yyyy", { locale: it })}
                                </TableCell>
                                <TableCell>{appointment.time}</TableCell>
                                <TableCell>{appointment.service}</TableCell>
                                <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                                <TableCell className="text-right">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="text-destructive"
                                    onClick={() => handleCancelAppointment(appointment.id)}
                                  >
                                    Cancella
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="past">
              <Card>
                <CardHeader>
                  <CardTitle>Appuntamenti Passati</CardTitle>
                  <CardDescription>Storico dei tuoi appuntamenti</CardDescription>
                </CardHeader>
                <CardContent>
                  {appointments.filter(app => new Date(app.date) < new Date()).length === 0 ? (
                    <div className="text-center p-6">
                      <CalendarIcon className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                      <p className="text-muted-foreground">Non hai appuntamenti passati.</p>
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Orario</TableHead>
                            <TableHead>Servizio</TableHead>
                            <TableHead>Stato</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {appointments
                            .filter(app => new Date(app.date) < new Date())
                            .map((appointment) => (
                              <TableRow key={appointment.id}>
                                <TableCell>
                                  {format(new Date(appointment.date), "d MMM yyyy", { locale: it })}
                                </TableCell>
                                <TableCell>{appointment.time}</TableCell>
                                <TableCell>{appointment.service}</TableCell>
                                <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Profile;
