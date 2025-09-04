import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, Users, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface TestUser {
  email: string;
  password: string;
  role: string;
  name: string;
}

const TestCredentials = () => {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [credentials, setCredentials] = useState<TestUser[]>([]);

  const createTestUsers = async () => {
    setIsCreating(true);
    try {
      const response = await fetch(`https://hwvlerwmojojisvxrlgz.supabase.co/functions/v1/create-test-users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3dmxlcndtb2pvamlzdnhybGd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4OTU5MDQsImV4cCI6MjA3MjQ3MTkwNH0.l9gzQmKveMAwhXroSFi9dlKrnFI9qqRbyrjO7OTJk_0`,
        },
      });

      const data = await response.json();
      
      if (data.credentials) {
        setCredentials(data.credentials);
        toast({
          title: "Utenti di test creati",
          description: "Gli utenti di test sono stati creati con successo",
        });
      } else {
        throw new Error(data.error || 'Errore nella creazione degli utenti');
      }
    } catch (error) {
      console.error('Error creating test users:', error);
      toast({
        title: "Errore",
        description: "Impossibile creare gli utenti di test",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiato",
      description: "Credenziali copiate negli appunti",
    });
  };

  const defaultCredentials: TestUser[] = [
    {
      email: 'admin@test.it',
      password: 'Test123456!',
      role: 'admin',
      name: 'Mario Rossi'
    },
    {
      email: 'cliente1@test.it',
      password: 'Test123456!',
      role: 'client',
      name: 'Giulia Bianchi'
    },
    {
      email: 'cliente2@test.it',
      password: 'Test123456!',
      role: 'client',
      name: 'Marco Verdi'
    }
  ];

  const displayCredentials = credentials.length > 0 ? credentials : defaultCredentials;

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Credenziali di Test
        </CardTitle>
        <CardDescription>
          Utilizza queste credenziali per testare l'applicazione con diversi ruoli utente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Crea gli utenti di test nel database per iniziare
          </p>
          <Button 
            onClick={createTestUsers}
            disabled={isCreating}
            variant="outline"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creazione...
              </>
            ) : (
              <>
                <Users className="mr-2 h-4 w-4" />
                Crea Utenti Test
              </>
            )}
          </Button>
        </div>

        <div className="space-y-3">
          {displayCredentials.map((user, index) => (
            <div key={index} className="p-3 border rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{user.name}</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                </div>
                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                  {user.role}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Password:</span>
                <code className="bg-muted px-2 py-1 rounded text-xs">{user.password}</code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(`${user.email}\n${user.password}`)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• <strong>Admin:</strong> Accesso completo a tutte le funzionalità</p>
          <p>• <strong>Client:</strong> Visualizzazione e gestione dei propri appuntamenti</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TestCredentials;