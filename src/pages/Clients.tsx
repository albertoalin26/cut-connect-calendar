
import React, { useState } from "react";
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

// Mock client data
const clientsData = [
  {
    id: 1,
    name: "Emma Johnson",
    email: "emma@example.com",
    phone: "(555) 123-4567",
    lastVisit: "Oct 15, 2023",
    appointmentsCount: 12,
    avatar: "EJ",
    notes: "Prefers natural hair products",
  },
  {
    id: 2,
    name: "Michael Smith",
    email: "michael@example.com",
    phone: "(555) 234-5678",
    lastVisit: "Nov 3, 2023",
    appointmentsCount: 8,
    avatar: "MS",
    notes: "Has color sensitivities, check product ingredients",
  },
  {
    id: 3,
    name: "Sophia Garcia",
    email: "sophia@example.com",
    phone: "(555) 345-6789",
    lastVisit: "Dec 20, 2023",
    appointmentsCount: 5,
    avatar: "SG",
    notes: "Likes to maintain short hairstyles",
  },
  {
    id: 4,
    name: "Daniel Brown",
    email: "daniel@example.com",
    phone: "(555) 456-7890",
    lastVisit: "Jan 8, 2024",
    appointmentsCount: 7,
    avatar: "DB",
    notes: "Usually books haircut and beard trim together",
  },
  {
    id: 5,
    name: "Olivia Wilson",
    email: "olivia@example.com",
    phone: "(555) 567-8901",
    lastVisit: "Feb 12, 2024",
    appointmentsCount: 4,
    avatar: "OW",
    notes: "Prefers appointments in the afternoon",
  },
];

const Clients = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newClient, setNewClient] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
  });

  const filteredClients = clientsData.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  );

  const handleAddClient = () => {
    console.log("Adding new client:", newClient);
    toast.success("Client added successfully!");
    setDialogOpen(false);
    setNewClient({ name: "", email: "", phone: "", notes: "" });
  };

  return (
    <div className="space-y-8 animate-slide-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Clients</h2>
          <p className="text-muted-foreground">Manage your client information</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>Add Client</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
              <DialogDescription>
                Enter the client's information below
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newClient.name}
                  onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                  placeholder="Enter full name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={newClient.phone}
                  onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={newClient.notes}
                  onChange={(e) => setNewClient({ ...newClient, notes: e.target.value })}
                  placeholder="Any additional information"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleAddClient}>Add Client</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients by name, email, or phone..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">All Clients</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="frequent">Frequent</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Client List</CardTitle>
                <CardDescription>
                  {filteredClients.length} total clients
                </CardDescription>
              </CardHeader>
              <CardContent>
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
                              <div className="flex items-center gap-1">
                                <Mail className="h-3.5 w-3.5" />
                                <span>{client.email}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Phone className="h-3.5 w-3.5" />
                                <span>{client.phone}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-row sm:flex-col items-center sm:items-end gap-4 sm:gap-1">
                          <div className="text-sm flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>Last visit: {client.lastVisit}</span>
                          </div>
                          <Badge variant="outline" className="rounded-full">
                            {client.appointmentsCount} appointments
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No clients match your search. Try different keywords or add a new client.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="recent" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Clients</CardTitle>
                <CardDescription>
                  Clients who visited in the last 30 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Recent clients view will be implemented in the next update.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="frequent" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Frequent Clients</CardTitle>
                <CardDescription>
                  Clients with the most appointments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Frequent clients view will be implemented in the next update.
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
