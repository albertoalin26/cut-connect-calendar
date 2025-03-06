
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Clock, Plus, Scissors } from "lucide-react";
import { format, addDays } from "date-fns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";

// Mock data for appointments
const appointmentsData = [
  {
    id: 1,
    client: "Emma Johnson",
    service: "Haircut & Styling",
    duration: "45 min",
    time: "09:00 AM",
    status: "confirmed",
    avatar: "EJ",
  },
  {
    id: 2,
    client: "Michael Smith",
    service: "Hair Coloring",
    duration: "2 hours",
    time: "11:30 AM",
    status: "confirmed",
    avatar: "MS",
  },
  {
    id: 3,
    client: "Sophia Garcia",
    service: "Blowout",
    duration: "30 min",
    time: "02:15 PM",
    status: "pending",
    avatar: "SG",
  },
  {
    id: 4,
    client: "Daniel Brown",
    service: "Haircut & Beard Trim",
    duration: "1 hour",
    time: "04:45 PM",
    status: "confirmed",
    avatar: "DB",
  },
];

const timeSlots = [
  "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", 
  "11:30 AM", "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", 
  "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM", 
  "4:30 PM", "5:00 PM", "5:30 PM", "6:00 PM"
];

const Appointments = () => {
  const navigate = useNavigate();
  const [date, setDate] = useState<Date>(new Date());
  const [view, setView] = useState("day");

  const renderTimeSlot = (time: string) => {
    const appointments = appointmentsData.filter(app => app.time === time);
    
    return (
      <div key={time} className="flex items-start gap-2 py-2 border-t border-border">
        <div className="w-20 text-sm text-muted-foreground pt-2">{time}</div>
        <div className="flex-1">
          {appointments.map(appointment => (
            <Card key={appointment.id} className="mb-2 appointment-card bg-secondary/50">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{appointment.avatar}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{appointment.client}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Scissors className="h-3 w-3" />
                        <span>{appointment.service}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={appointment.status === "confirmed" ? "default" : "outline"}
                      className="text-xs"
                    >
                      {appointment.status}
                    </Badge>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      {appointment.duration}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-slide-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Appointments</h2>
          <p className="text-muted-foreground">Manage your salon appointments</p>
        </div>
        <Button onClick={() => navigate("/appointments/new")} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          <span>New Appointment</span>
        </Button>
      </div>

      <Tabs defaultValue="day" value={view} onValueChange={setView} className="space-y-4">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="day">Day</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <Button
                variant="outline"
                size="icon"
                className="rounded-r-none"
                onClick={() => setDate(prev => addDays(prev, -1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="rounded-l-none"
                onClick={() => setDate(prev => addDays(prev, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-sm font-medium">
              {format(date, "MMMM d, yyyy")}
            </div>
          </div>
        </div>

        <TabsContent value="day" className="space-y-4">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Daily Schedule</CardTitle>
                  <CardDescription>
                    Appointments for {format(date, "MMMM d, yyyy")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="max-h-[600px] overflow-y-auto">
                  <div className="space-y-1">
                    {timeSlots.map(renderTimeSlot)}
                  </div>
                </CardContent>
              </Card>
            </div>
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Calendar</CardTitle>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => newDate && setDate(newDate)}
                    className="pointer-events-auto"
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="week">
          <Card>
            <CardHeader>
              <CardTitle>Weekly View</CardTitle>
              <CardDescription>
                View your appointments for the week of {format(date, "MMMM d, yyyy")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center p-12 text-muted-foreground">
                <p>Weekly view will be implemented in the next update.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="month">
          <Card>
            <CardHeader>
              <CardTitle>Monthly View</CardTitle>
              <CardDescription>
                View your appointments for {format(date, "MMMM yyyy")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center p-12 text-muted-foreground">
                <p>Monthly view will be implemented in the next update.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Appointments;
