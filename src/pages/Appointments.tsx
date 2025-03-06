
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
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { it } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";

// Dati di esempio per gli appuntamenti
const appointmentsData = [
  {
    id: 1,
    client: "Emma Johnson",
    service: "Taglio & Piega",
    duration: "45 min",
    time: "09:00",
    status: "confermato",
    avatar: "EJ",
    date: new Date(2023, 6, 15),
  },
  {
    id: 2,
    client: "Michael Smith",
    service: "Colorazione",
    duration: "2 ore",
    time: "11:30",
    status: "confermato",
    avatar: "MS",
    date: new Date(2023, 6, 15),
  },
  {
    id: 3,
    client: "Sophia Garcia",
    service: "Piega",
    duration: "30 min",
    time: "14:15",
    status: "in attesa",
    avatar: "SG",
    date: new Date(2023, 6, 16),
  },
  {
    id: 4,
    client: "Daniel Brown",
    service: "Taglio & Barba",
    duration: "1 ora",
    time: "16:45",
    status: "confermato",
    avatar: "DB",
    date: new Date(2023, 6, 17),
  },
];

const fasce_orarie = [
  "9:00", "9:30", "10:00", "10:30", "11:00", 
  "11:30", "12:00", "12:30", "13:00", "13:30", 
  "14:00", "14:30", "15:00", "15:30", "16:00", 
  "16:30", "17:00", "17:30", "18:00"
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
                      variant={appointment.status === "confermato" ? "default" : "outline"}
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

  const renderMonthlyView = () => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const days = eachDayOfInterval({ start, end });

    return (
      <div className="grid grid-cols-7 gap-1">
        {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map((day) => (
          <div key={day} className="text-center font-medium p-2 text-sm">
            {day}
          </div>
        ))}
        {Array.from({ length: start.getDay() === 0 ? 6 : start.getDay() - 1 }).map((_, i) => (
          <div key={`empty-${i}`} className="p-2 h-24" />
        ))}
        {days.map((day) => {
          const dayAppointments = appointmentsData.filter(
            (appointment) => 
              appointment.date.getDate() === day.getDate() &&
              appointment.date.getMonth() === day.getMonth() &&
              appointment.date.getFullYear() === day.getFullYear()
          );
          
          return (
            <div 
              key={day.toString()} 
              className={`border rounded-md p-1 h-24 overflow-y-auto ${
                day.getDate() === new Date().getDate() && 
                day.getMonth() === new Date().getMonth() &&
                day.getFullYear() === new Date().getFullYear()
                  ? "bg-accent/30"
                  : ""
              }`}
            >
              <div className="text-right text-sm font-medium mb-1">
                {format(day, "d", { locale: it })}
              </div>
              {dayAppointments.map((appointment) => (
                <div 
                  key={appointment.id}
                  className="text-xs p-1 mb-1 rounded bg-primary/10 truncate"
                >
                  {appointment.time} - {appointment.client}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-slide-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Appuntamenti</h2>
          <p className="text-muted-foreground">Gestisci gli appuntamenti del salone</p>
        </div>
        <Button onClick={() => navigate("/appointments/new")} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          <span>Nuovo Appuntamento</span>
        </Button>
      </div>

      <Tabs defaultValue="day" value={view} onValueChange={setView} className="space-y-4">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="day">Giorno</TabsTrigger>
            <TabsTrigger value="week">Settimana</TabsTrigger>
            <TabsTrigger value="month">Mese</TabsTrigger>
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
              {format(date, "d MMMM yyyy", { locale: it })}
            </div>
          </div>
        </div>

        <TabsContent value="day" className="space-y-4">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Programma Giornaliero</CardTitle>
                  <CardDescription>
                    Appuntamenti per il {format(date, "d MMMM yyyy", { locale: it })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="max-h-[600px] overflow-y-auto">
                  <div className="space-y-1">
                    {fasce_orarie.map(renderTimeSlot)}
                  </div>
                </CardContent>
              </Card>
            </div>
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Calendario</CardTitle>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => newDate && setDate(newDate)}
                    className="pointer-events-auto"
                    locale={it}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="week">
          <Card>
            <CardHeader>
              <CardTitle>Vista Settimanale</CardTitle>
              <CardDescription>
                Visualizza gli appuntamenti per la settimana dal {format(date, "d MMMM yyyy", { locale: it })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center p-12 text-muted-foreground">
                <p>La vista settimanale sarà implementata nel prossimo aggiornamento.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="month">
          <Card>
            <CardHeader>
              <CardTitle>Vista Mensile</CardTitle>
              <CardDescription>
                Visualizza gli appuntamenti per {format(date, "MMMM yyyy", { locale: it })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderMonthlyView()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Appointments;
