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
import { useAuth } from "@/contexts/AuthContext";
import { Separator } from "@/components/ui/separator";

const loginSchema = z.object({
  email: z.string().email({ message: "Inserisci un'email valida" }),
  password: z.string().min(6, { message: "La password deve contenere almeno 6 caratteri" }),
});

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
  const { user, signInWithGoogle, signInWithPassword } = useAuth();
  const [manualCheckDone, setManualCheckDone] = useState(false);

  useEffect(() => {
    console.log("Auth component mounted, checking session");
    const timer = setTimeout(() => {
      setManualCheckDone(true);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (user) {
      console.log("User authenticated in state, redirecting to dashboard", user.email);
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

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
      
      if (!data.email || !data.password) {
        toast.error("Email e password sono obbligatori");
        setIsLoading(false);
        return;
      }
      
      await signInWithPassword(data.email, data.password);
    } catch (error: any) {
      console.error("Login exception:", error);
      toast.error("Errore durante il login. Riprova.");
    } finally {
      setIsLoading(false);
    }
  };

  const onRegisterSubmit = async (data: RegisterFormValues) => {
    try {
      setIsLoading(true);
      
      const cleanEmail = data.email.trim().toLowerCase();
      console.log("Attempting registration with email:", cleanEmail);
      
      const { error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
          },
        },
      });
      
      if (error) {
        console.error("Registration error details:", error);
        toast.error(error.message || "Si è verificato un errore durante la registrazione");
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
      
      loginForm.setValue('email', data.admin.email);
      loginForm.setValue('password', data.admin.password);
      
      toast.info(`Admin: ${data.admin.email} / ${data.admin.password}`);
      toast.info(`Client: ${data.client.email} / ${data.client.password}`);
      
      setActiveTab("login");
    } catch (error: any) {
      console.error("Demo users exception:", error);
      toast.error(error.message || "Si è verificato un errore durante la creazione degli utenti demo");
    } finally {
      setIsCreatingDemoUsers(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      console.log("Starting Google sign in process");
      await signInWithGoogle();
    } catch (error) {
      console.error("Error in handleGoogleSignIn:", error);
      toast.error("Errore durante l'accesso con Google");
    } finally {
      setIsLoading(false);
    }
  };

  const debugLogin = async () => {
    try {
      console.log("Debug: Verificando l'autenticazione...");
      
      setIsLoading(true);
      toast.info("Tentativo di debug login in corso...");
      
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Debug - Errore sessione:", error);
        toast.error("Errore nel recupero della sessione");
        return;
      }
      
      if (data.session) {
        console.log("Debug - Utente già autenticato:", data.session.user.email);
        toast.info(`Già autenticato come: ${data.session.user.email}`);

        navigate("/dashboard", { replace: true });
      } else {
        console.log("Debug - Nessuna sessione attiva");
        toast.info("Nessuna sessione attiva. Tentativo di login automatico...");
        
        const demoEmail = 'achi@salone.it';
        const demoPassword = 'Password123!';
        
        loginForm.setValue('email', demoEmail);
        loginForm.setValue('password', demoPassword);
        
        toast.info(`Credenziali inserite: ${demoEmail} / ${demoPassword}`);
        
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: demoEmail,
            password: demoPassword,
          });
          
          if (error) {
            console.error("Debug login error:", error);
            toast.error(`Errore login: ${error.message}`);
          } else if (data && data.user) {
            console.log("Debug login successful:", data.user.email);
            toast.success("Debug login riuscito!");
            
            setTimeout(() => {
              navigate("/dashboard", { replace: true });
            }, 1500);
          }
        } catch (loginError) {
          console.error("Exception during debug login:", loginError);
          toast.error("Eccezione durante il login automatico");
        }
      }
    } catch (error) {
      console.error("Debug exception:", error);
      toast.error("Errore durante il debug");
    } finally {
      setIsLoading(false);
    }
  };

  if (!manualCheckDone && !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
        <span className="text-muted-foreground">Verifica sessione in corso...</span>
        <Button 
          variant="link" 
          className="mt-4" 
          onClick={() => {
            setManualCheckDone(true);
            toast.info("Verificazione sessione annullata");
          }}
        >
          Annulla verifica
        </Button>
      </div>
    );
  }

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

        <Card className="shadow-lg">
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
                    {isLoading ? (
                      <span className="flex items-center">
                        <span className="animate-spin h-4 w-4 mr-2 border-2 border-b-transparent rounded-full"></span>
                        Accesso in corso...
                      </span>
                    ) : "Accedi"}
                  </Button>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <Separator />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Oppure
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" className="h-4 w-4">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Continua con Google
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
                    {isLoading ? (
                      <span className="flex items-center">
                        <span className="animate-spin h-4 w-4 mr-2 border-2 border-b-transparent rounded-full"></span>
                        Registrazione in corso...
                      </span>
                    ) : "Registrati"}
                  </Button>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <Separator />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Oppure
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" className="h-4 w-4">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Continua con Google
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
            
            <div className="w-full space-y-2">
              <Button 
                variant="outline" 
                className="w-full flex items-center gap-2" 
                onClick={createDemoUsers}
                disabled={isCreatingDemoUsers || isLoading}
              >
                <UserPlus className="h-4 w-4" />
                {isCreatingDemoUsers ? (
                  <span className="flex items-center">
                    <span className="animate-spin h-4 w-4 mr-2 border-2 border-b-transparent rounded-full"></span>
                    Creazione in corso...
                  </span>
                ) : "Crea utenti demo"}
              </Button>

              <Button
                variant="ghost"
                className="w-full text-xs text-muted-foreground"
                onClick={debugLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <span className="animate-spin h-4 w-4 mr-2 border-2 border-b-transparent rounded-full"></span>
                    Debug in corso...
                  </span>
                ) : "Debug Login (Login Automatico)"}
              </Button>
              
              <p className="text-xs text-muted-foreground mt-1 text-center">
                Credenziali Demo: <br />
                Admin: achi@salone.it / Password123! <br />
                Cliente: alberto@cliente.it / Password123!
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
