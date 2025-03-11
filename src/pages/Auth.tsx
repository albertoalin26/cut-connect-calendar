
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Scissors, Mail, Lock, User, UserPlus } from "lucide-react";

// Modificato lo schema per una validazione più flessibile delle email
const loginSchema = z.object({
  email: z.string().email({ message: "Inserisci un'email valida" }),
  password: z.string().min(6, { message: "La password deve contenere almeno 6 caratteri" }),
});

// Modificato lo schema per una validazione più flessibile delle email
const registerSchema = z.object({
  email: z.string().email({ message: "Inserisci un'email valida" }),
  password: z.string().min(6, { message: "La password deve contenere almeno 6 caratteri" }),
  firstName: z.string().min(2, { message: "Inserisci il tuo nome" }),
  lastName: z.string().min(2, { message: "Inserisci il tuo cognome" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

const Auth = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [isCreatingDemoUsers, setIsCreatingDemoUsers] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        
        if (data.session) {
          navigate("/dashboard");
        }
      } catch (error) {
        console.error("Error checking session:", error);
      }
    };
    
    checkSession();
  }, [navigate]);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
    },
  });

  const onLoginSubmit = async (data: LoginFormValues) => {
    try {
      setIsLoading(true);
      console.log("Attempting login with:", data.email);
      
      const cleanEmail = data.email.trim().toLowerCase();
      console.log("Normalized email for login:", cleanEmail);
      
      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: data.password,
      });

      if (error) {
        console.error("Login error:", error);
        toast.error(error.message || "Credenziali non valide");
        return;
      }

      toast.success("Login effettuato con successo!");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Login exception:", error);
      toast.error(error.message || "Si è verificato un errore durante il login");
    } finally {
      setIsLoading(false);
    }
  };

  const onRegisterSubmit = async (data: RegisterFormValues) => {
    try {
      setIsLoading(true);
      
      const cleanEmail = data.email.trim().toLowerCase();
      console.log("Attempting registration with email:", cleanEmail);
      console.log("Form data:", JSON.stringify(data));
      
      // Validazione manuale aggiuntiva
      if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
        console.error("Email validation failed:", cleanEmail);
        toast.error("Email non valida. Assicurati che contenga @ e un dominio valido.");
        setIsLoading(false);
        return;
      }
      
      if (!cleanEmail || !data.password || !data.firstName || !data.lastName) {
        console.error("Missing required fields:", { 
          hasEmail: !!cleanEmail, 
          hasPassword: !!data.password, 
          hasFirstName: !!data.firstName, 
          hasLastName: !!data.lastName 
        });
        toast.error("Tutti i campi sono obbligatori");
        setIsLoading(false);
        return;
      }
      
      const { data: signUpData, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
          },
        },
      });

      console.log("SignUp response:", error ? "Error occurred" : "Success", 
                  "User data:", signUpData?.user ? "User created" : "No user data");
      
      if (error) {
        console.error("Registration error details:", error);
        
        if (error.message.includes("email")) {
          toast.error("Email non valida o già registrata");
        } else if (error.message.includes("password")) {
          toast.error("La password non è abbastanza sicura");
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success("Registrazione completata! Verifica la tua email per confermare l'account.");
      setActiveTab("login");
    } catch (error: any) {
      console.error("Registration exception:", error);
      toast.error(error.message || "Si è verificato un errore durante la registrazione");
    } finally {
      setIsLoading(false);
    }
  };

  const createDemoUsers = async () => {
    try {
      setIsCreatingDemoUsers(true);
      toast.info("Creando utenti demo...");
      
      // Display more detailed logs
      console.log("Invocando la funzione setup-initial-users...");
      
      const { data, error } = await supabase.functions.invoke('setup-initial-users');
      
      if (error) {
        console.error("Demo users error:", error);
        toast.error(`Errore: ${error.message}`);
        return;
      }

      console.log("Risposta dalla funzione setup-initial-users:", data);
      
      if (!data || !data.admin) {
        console.error("Dati mancanti nella risposta", data);
        toast.error("Dati mancanti nella risposta dal server");
        return;
      }
      
      toast.success("Utenti demo creati con successo!");
      
      if (data.admin) {
        // Auto-fill login form with admin credentials
        loginForm.setValue('email', data.admin.email);
        loginForm.setValue('password', data.admin.password);
        
        // Display credentials in toast
        toast.info(`Admin: ${data.admin.email} / ${data.admin.password}`);
        toast.info(`Client: ${data.client.email} / ${data.client.password}`);
        
        // Switch to login tab
        setActiveTab("login");
      }
    } catch (error: any) {
      console.error("Demo users exception:", error);
      toast.error(error.message || "Si è verificato un errore durante la creazione degli utenti demo");
    } finally {
      setIsCreatingDemoUsers(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <Scissors className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold">Salone di Bellezza</h1>
          <p className="text-muted-foreground mt-1">Accedi o registrati per gestire i tuoi appuntamenti</p>
        </div>

        <Card>
          <CardHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Accedi</TabsTrigger>
                <TabsTrigger value="register">Registrati</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {activeTab === "login" ? (
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                              placeholder="La tua email" 
                              className="pl-10" 
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input type="password" placeholder="La tua password" className="pl-10" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Accesso in corso..." : "Accedi"}
                  </Button>
                </form>
              </Form>
            ) : (
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={registerForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="Il tuo nome" className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cognome</FormLabel>
                          <FormControl>
                            <Input placeholder="Il tuo cognome" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                              placeholder="La tua email" 
                              className="pl-10" 
                              type="email"
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input type="password" placeholder="Crea una password" className="pl-10" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Registrazione in corso..." : "Registrati"}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              {activeTab === "login"
                ? "Non hai un account? "
                : "Hai già un account? "}
              <Button
                variant="link"
                className="p-0"
                onClick={() => setActiveTab(activeTab === "login" ? "register" : "login")}
              >
                {activeTab === "login" ? "Registrati" : "Accedi"}
              </Button>
            </p>
            
            <div className="w-full">
              <Button 
                variant="outline" 
                className="w-full flex items-center gap-2" 
                onClick={createDemoUsers}
                disabled={isCreatingDemoUsers}
              >
                <UserPlus className="h-4 w-4" />
                {isCreatingDemoUsers ? "Creazione utenti in corso..." : "Crea utenti demo"}
              </Button>
              <p className="text-xs text-muted-foreground mt-1 text-center">
                Crea un admin (achi@salone.it) e un cliente (alberto@cliente.it)
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
