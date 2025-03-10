
import React from 'react';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, eachHourOfInterval, addMinutes, setHours, setMinutes, isSameDay, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { Card } from "@/components/ui/card";
import { CalendarClock, Clock, User } from 'lucide-react';

interface Appointment {
  id: number;
  client: string;
  service: string;
  duration: string;
  time: string;
  status: string;
  avatar: string;
  date: Date;
  notes?: string;
}

interface WeeklyCalendarViewProps {
  date: Date;
  appointments: Appointment[];
  onAppointmentClick?: (appointment: Appointment) => void;
}

const WeeklyCalendarView = ({ date, appointments, onAppointmentClick }: WeeklyCalendarViewProps) => {
  const startDate = startOfWeek(date, { locale: it });
  const endDate = endOfWeek(date, { locale: it });
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  // Genera gli slot di tempo per ogni mezz'ora dalle 9:00 alle 18:00
  const generateTimeSlots = (day: Date) => {
    const slots = [];
    let startTime = setHours(setMinutes(day, 0), 9);
    const endTime = setHours(day, 18);

    while (startTime < endTime) {
      slots.push(startTime);
      startTime = addMinutes(startTime, 30);
    }
    return slots;
  };

  // Trova gli appuntamenti per uno specifico slot temporale
  const getAppointmentsForTimeSlot = (day: Date, time: Date) => {
    return appointments.filter(appointment => {
      // Handle both Date objects and string dates
      const appointmentDate = appointment.date instanceof Date 
        ? appointment.date 
        : new Date(appointment.date);
      
      const appointmentTime = appointment.time.split(':');
      const appointmentDateTime = setHours(
        setMinutes(appointmentDate, parseInt(appointmentTime[1])),
        parseInt(appointmentTime[0])
      );

      return isSameDay(appointmentDateTime, day) && 
             appointmentDateTime.getHours() === time.getHours() &&
             appointmentDateTime.getMinutes() === time.getMinutes();
    });
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Intestazioni dei giorni */}
        <div className="grid grid-cols-8 gap-2 mb-2">
          <div className="font-medium text-sm text-center">Ora</div>
          {days.map((day) => (
            <div key={day.toString()} className="font-medium text-sm text-center">
              {format(day, "EEE d", { locale: it })}
            </div>
          ))}
        </div>

        {/* Slot temporali */}
        {generateTimeSlots(startDate).map((timeSlot) => (
          <div key={timeSlot.toString()} className="grid grid-cols-8 gap-2 mb-1">
            <div className="text-xs text-muted-foreground text-center py-2">
              {format(timeSlot, "HH:mm")}
            </div>
            {days.map((day) => {
              const dayAppointments = getAppointmentsForTimeSlot(day, timeSlot);
              return (
                <div
                  key={day.toString()}
                  className="min-h-[40px] border rounded-sm p-1"
                >
                  {dayAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="text-xs bg-primary/10 rounded p-2 mb-1 cursor-pointer hover:bg-primary/20 transition-colors flex flex-col gap-1"
                      onClick={() => onAppointmentClick && onAppointmentClick(appointment)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 font-medium">
                          <User className="h-3 w-3" />
                          <span>{appointment.client}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{appointment.time}</span>
                        </div>
                      </div>
                      <div className="text-muted-foreground">{appointment.service}</div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeeklyCalendarView;
