
import React, { useState } from "react";
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

// Appointment form schema
const appointmentFormSchema = z.object({
  client: z.string().min(2, { message: "Client name is required" }),
  service: z.string().min(1, { message: "Service is required" }),
  date: z.date({ required_error: "Appointment date is required" }),
  time: z.string().min(1, { message: "Appointment time is required" }),
  duration: z.string().min(1, { message: "Duration is required" }),
  notes: z.string().optional(),
});

// Mock data for services and time slots
const services = [
  { id: 1, name: "Haircut", duration: "30 min", price: "$35" },
  { id: 2, name: "Haircut & Styling", duration: "45 min", price: "$50" },
  { id: 3, name: "Hair Coloring", duration: "2 hours", price: "$120" },
  { id: 4, name: "Highlights", duration: "1.5 hours", price: "$100" },
  { id: 5, name: "Blowout", duration: "30 min", price: "$30" },
  { id: 6, name: "Hair Treatment", duration: "1 hour", price: "$65" },
  { id: 7, name: "Beard Trim", duration: "15 min", price: "$20" },
];

const timeSlots = [
  "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", 
  "11:30 AM", "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", 
  "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM", 
  "4:30 PM", "5:00 PM", "5:30 PM"
];

const durations = [
  "15 min", "30 min", "45 min", "1 hour", "1.5 hours", "2 hours", "2.5 hours", "3 hours"
];

// Mock clients
const clients = [
  { id: 1, name: "Emma Johnson", phone: "555-1234", email: "emma@example.com" },
  { id: 2, name: "Michael Smith", phone: "555-5678", email: "michael@example.com" },
  { id: 3, name: "Sophia Garcia", phone: "555-9012", email: "sophia@example.com" },
  { id: 4, name: "Daniel Brown", phone: "555-3456", email: "daniel@example.com" },
  { id: 5, name: "Olivia Wilson", phone: "555-7890", email: "olivia@example.com" }
];

type FormData = z.infer<typeof appointmentFormSchema>;

const NewAppointment = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  
  const form = useForm<FormData>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      notes: "",
    },
  });

  const onSubmit = (data: FormData) => {
    console.log("Appointment data:", data);
    toast.success("Appointment created successfully!");
    navigate("/appointments");
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
          <h2 className="text-3xl font-bold tracking-tight">New Appointment</h2>
          <p className="text-muted-foreground">Schedule a new appointment</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Appointment Details</CardTitle>
            <CardDescription>
              Enter the appointment information below
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
                        <FormLabel>Client</FormLabel>
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <User className="mr-2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              placeholder="Search clients or enter new name" 
                              value={searchTerm}
                              onChange={e => {
                                setSearchTerm(e.target.value);
                                field.onChange(e.target.value);
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
                                    }}
                                  >
                                    <div className="font-medium">{client.name}</div>
                                    <div className="text-xs text-muted-foreground">{client.phone} • {client.email}</div>
                                  </div>
                                ))
                              ) : (
                                <div className="p-2 text-muted-foreground text-sm">
                                  No clients found. Use this name to create a new client.
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
                        <FormLabel>Service</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <div className="flex items-center gap-2">
                                <Scissors className="h-4 w-4 text-muted-foreground" />
                                <SelectValue placeholder="Select a service" />
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
                          <FormLabel>Date</FormLabel>
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
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
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
                          <FormLabel>Time</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <SelectValue placeholder="Select a time" />
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
                        <FormLabel>Duration</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <SelectValue placeholder="Select duration" />
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
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Add any special instructions or notes"
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
                    Cancel
                  </Button>
                  <Button type="submit">
                    Save Appointment
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-1">Service Categories</h4>
              <div className="space-y-2">
                {["Haircuts", "Styling", "Color", "Treatments"].map((category) => (
                  <div key={category} className="flex items-center gap-2">
                    <Scissors className="h-4 w-4 text-primary" />
                    <span className="text-sm">{category}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-1">Working Hours</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Monday - Friday: 9:00 AM - 6:00 PM</p>
                <p>Saturday: 10:00 AM - 4:00 PM</p>
                <p>Sunday: Closed</p>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-1">Need Help?</h4>
              <p className="text-sm text-muted-foreground">
                Double-check availability before scheduling. For complex bookings, 
                please contact the salon directly.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NewAppointment;
