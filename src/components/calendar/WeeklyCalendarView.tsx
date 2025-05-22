
import React, { useState } from 'react';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, eachHourOfInterval, addMinutes, setHours, setMinutes, isSameDay, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { Card } from "@/components/ui/card";
import { CalendarClock, Clock, User } from 'lucide-react';
import AppointmentBookingModal from '@/components/appointments/AppointmentBookingModal';
import { useAuth } from "@/contexts/AuthContext";

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
  isInteractive?: boolean;
  onRefresh?: () => void;
}

const WeeklyCalendarView = ({ 
  date, 
  appointments, 
  onAppointmentClick, 
  isInteractive = false,
  onRefresh
}: WeeklyCalendarViewProps) => {
  const { isAdmin } = useAuth();
  const startDate = startOfWeek(date, { locale: it });
  const endDate = endOfWeek(date, { locale: it });
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date, time: string } | null>(null);

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

  const handleSlotClick = (day: Date, time: Date) => {
    if (!isInteractive) return;
    
    const timeString = format(time, "HH:mm");
    const appointments = getAppointmentsForTimeSlot(day, time);
    
    // Se non ci sono appuntamenti per questo slot, apri il modal di prenotazione
    if (appointments.length === 0) {
      setSelectedSlot({
        date: day,
        time: timeString
      });
      setBookingModalOpen(true);
    }
  };

  const handleBookingSuccess = () => {
    if (onRefresh) {
      onRefresh();
    }
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
              const isEmpty = dayAppointments.length === 0;
              
              return (
                <div
                  key={day.toString()}
                  className={`min-h-[40px] border rounded-sm p-1 ${isEmpty && isInteractive ? 'cursor-pointer hover:bg-primary/5' : ''}`}
                  onClick={() => isEmpty && isAdmin && isInteractive && handleSlotClick(day, timeSlot)}
                >
                  {dayAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="text-xs bg-primary/10 rounded p-1.5 mb-1 cursor-pointer hover:bg-primary/20 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onAppointmentClick && (isAdmin || !isAdmin)) onAppointmentClick(appointment);
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <div className="font-medium truncate max-w-[70px]">
                          {appointment.client.split(' ')[0]}
                        </div>
                        <div className="text-muted-foreground text-[10px] shrink-0">
                          {appointment.time}
                        </div>
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                        {appointment.service}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Modal di prenotazione - solo per admin */}
      {isAdmin && selectedSlot && (
        <AppointmentBookingModal
          isOpen={bookingModalOpen}
          onClose={() => setBookingModalOpen(false)}
          date={selectedSlot.date}
          time={selectedSlot.time}
          onSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
};

export default WeeklyCalendarView;
