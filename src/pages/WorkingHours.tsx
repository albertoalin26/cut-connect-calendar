
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Calendar, Save, Info } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const timeOptions = [
  "Closed",
  "8:00 AM",
  "8:30 AM",
  "9:00 AM",
  "9:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "12:00 PM",
  "12:30 PM",
  "1:00 PM",
  "1:30 PM",
  "2:00 PM",
  "2:30 PM",
  "3:00 PM",
  "3:30 PM",
  "4:00 PM",
  "4:30 PM",
  "5:00 PM",
  "5:30 PM",
  "6:00 PM",
  "6:30 PM",
  "7:00 PM",
  "7:30 PM",
  "8:00 PM",
];

const WorkingHours = () => {
  const [workingHours, setWorkingHours] = useState({
    monday: { isOpen: true, start: "9:00 AM", end: "6:00 PM" },
    tuesday: { isOpen: true, start: "9:00 AM", end: "6:00 PM" },
    wednesday: { isOpen: true, start: "9:00 AM", end: "6:00 PM" },
    thursday: { isOpen: true, start: "9:00 AM", end: "6:00 PM" },
    friday: { isOpen: true, start: "9:00 AM", end: "6:00 PM" },
    saturday: { isOpen: true, start: "10:00 AM", end: "4:00 PM" },
    sunday: { isOpen: false, start: "Closed", end: "Closed" },
  });

  const [specialDates, setSpecialDates] = useState([
    { id: 1, date: "2024-07-04", isOpen: false, note: "Independence Day" },
    { id: 2, date: "2024-12-25", isOpen: false, note: "Christmas Day" },
    { id: 3, date: "2024-01-01", isOpen: false, note: "New Year's Day" },
  ]);

  const handleToggleDay = (day: string) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day as keyof typeof prev],
        isOpen: !prev[day as keyof typeof prev].isOpen,
        start: !prev[day as keyof typeof prev].isOpen ? "9:00 AM" : "Closed",
        end: !prev[day as keyof typeof prev].isOpen ? "6:00 PM" : "Closed",
      }
    }));
  };

  const handleTimeChange = (day: string, field: string, value: string) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day as keyof typeof prev],
        [field]: value
      }
    }));
  };

  const handleSaveChanges = () => {
    console.log("Saving working hours:", workingHours);
    toast.success("Working hours updated successfully!");
  };

  return (
    <div className="space-y-8 animate-slide-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Working Hours</h2>
          <p className="text-muted-foreground">Set your salon's operating hours</p>
        </div>
        <Button onClick={handleSaveChanges} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          <span>Save Changes</span>
        </Button>
      </div>

      <Tabs defaultValue="regular" className="space-y-4">
        <TabsList>
          <TabsTrigger value="regular" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Regular Hours</span>
          </TabsTrigger>
          <TabsTrigger value="special" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Special Days</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="regular" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Schedule</CardTitle>
              <CardDescription>Set your regular working hours for each day of the week</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(workingHours).map(([day, hours]) => (
                <div key={day} className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base capitalize">{day}</Label>
                      <Switch
                        checked={hours.isOpen}
                        onCheckedChange={() => handleToggleDay(day)}
                      />
                    </div>
                  </div>
                  <div className="col-span-9">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`${day}-start`} className="text-sm">Opening Time</Label>
                        <Select
                          disabled={!hours.isOpen}
                          value={hours.start}
                          onValueChange={(value) => handleTimeChange(day, "start", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                          <SelectContent>
                            {timeOptions.map((time) => (
                              <SelectItem key={`${day}-start-${time}`} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor={`${day}-end`} className="text-sm">Closing Time</Label>
                        <Select
                          disabled={!hours.isOpen}
                          value={hours.end}
                          onValueChange={(value) => handleTimeChange(day, "end", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                          <SelectContent>
                            {timeOptions.map((time) => (
                              <SelectItem key={`${day}-end-${time}`} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="special" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Special Days & Holidays</CardTitle>
              <CardDescription>Set custom hours for holidays or special events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center p-3 rounded-lg bg-secondary/50 border border-border">
                  <Info className="h-5 w-5 text-primary mr-3" />
                  <p className="text-sm">
                    Add special dates such as holidays or events when your salon will have different hours or be closed.
                  </p>
                </div>
                
                <div className="space-y-4 mt-6">
                  {specialDates.map((specialDate) => (
                    <div key={specialDate.id} className="grid grid-cols-12 gap-4 items-center p-4 rounded-lg bg-secondary/30">
                      <div className="col-span-3">
                        <div className="space-y-1">
                          <Label className="text-sm">Date</Label>
                          <Input 
                            type="date" 
                            value={specialDate.date} 
                            onChange={() => {}} 
                          />
                        </div>
                      </div>
                      <div className="col-span-2">
                        <div className="space-y-1">
                          <Label className="text-sm">Status</Label>
                          <div className="flex items-center space-x-2 pt-2">
                            <Switch checked={!specialDate.isOpen} />
                            <Label className="text-sm">Closed</Label>
                          </div>
                        </div>
                      </div>
                      <div className="col-span-5">
                        <div className="space-y-1">
                          <Label className="text-sm">Note</Label>
                          <Input 
                            value={specialDate.note} 
                            onChange={() => {}} 
                            placeholder="Description (e.g. Holiday)" 
                          />
                        </div>
                      </div>
                      <div className="col-span-2 flex justify-end">
                        <Button variant="ghost" size="sm">Remove</Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Button variant="outline" className="w-full mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Special Day
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WorkingHours;
