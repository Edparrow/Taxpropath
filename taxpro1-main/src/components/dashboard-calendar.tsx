"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin } from "lucide-react";

// Extracted from "United States September 2026–August 2028.pdf"
const EVENTS = [
  { date: "2026-09-07", title: "Labor Day", type: "holiday" },
  { date: "2026-10-12", title: "Columbus Day", type: "holiday" },
  { date: "2026-10-31", title: "Halloween", type: "holiday" },
  { date: "2026-11-03", title: "Election Day", type: "holiday" },
  { date: "2026-11-11", title: "Veterans Day", type: "holiday" },
  { date: "2026-11-26", title: "Thanksgiving Day", type: "holiday" },
  { date: "2026-11-27", title: "Black Friday", type: "holiday" },
  { date: "2026-12-24", title: "Christmas Eve", type: "holiday" },
  { date: "2026-12-25", title: "Christmas Day", type: "holiday" },
  { date: "2026-12-31", title: "New Year's Eve", type: "holiday" },
  { date: "2027-01-01", title: "New Year's Day", type: "holiday" },
  { date: "2027-01-18", title: "Martin Luther King Jr. Day", type: "holiday" },
  { date: "2027-02-14", title: "Valentine's Day", type: "holiday" },
  { date: "2027-02-15", title: "President's Day", type: "holiday" },
  { date: "2027-03-17", title: "St. Patrick's Day", type: "holiday" },
  { date: "2027-03-28", title: "Easter Sunday", type: "holiday" },
  { date: "2027-04-15", title: "Tax Day", type: "holiday" },
  { date: "2027-05-05", title: "Cinco de Mayo", type: "holiday" },
  { date: "2027-05-31", title: "Memorial Day", type: "holiday" },
  { date: "2027-07-04", title: "Independence Day", type: "holiday" },
];

const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function DashboardCalendar() {
  const [currentDate, setCurrentDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  // Nothing pre-selected: "today" can differ between the server and the browser.
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Get first day of the month (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  
  // Get number of days in the current month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // Helper to format date to YYYY-MM-DD for comparison
  const formatDate = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  const isToday = (year: number, month: number, day: number) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
  };

  const isSelected = (year: number, month: number, day: number) => {
    if (!selectedDate) return false;
    return selectedDate.getDate() === day && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;
  };

  const getEventsForDate = (year: number, month: number, day: number) => {
    const dateStr = formatDate(year, month, day);
    return EVENTS.filter((e) => e.date === dateStr);
  };

  // Build the calendar grid
  const renderCalendarDays = () => {
    const days = [];
    
    // Add empty slots for days before the 1st
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-10" />);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = getEventsForDate(currentYear, currentMonth, day);
      const hasEvents = dayEvents.length > 0;
      const today = isToday(currentYear, currentMonth, day);
      const selected = isSelected(currentYear, currentMonth, day);

      days.push(
        <button
          key={day}
          onClick={() => setSelectedDate(new Date(currentYear, currentMonth, day))}
          className={`relative flex h-10 w-full items-center justify-center rounded-full text-sm font-medium transition-all
            ${selected ? 'bg-brand-600 text-white shadow-md' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}
            ${today && !selected ? 'text-brand-600 font-bold' : ''}
            ${!selected && !today ? 'text-slate-700 dark:text-slate-300' : ''}
          `}
        >
          {day}
          {hasEvents && !selected && (
            <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 size-1 rounded-full bg-brand-500" />
          )}
          {hasEvents && selected && (
            <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 size-1 rounded-full bg-white" />
          )}
        </button>
      );
    }

    return days;
  };

  // Get events for the selected date to show below
  const selectedDateEvents = selectedDate 
    ? getEventsForDate(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate())
    : [];

  return (
    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-navy-950 dark:text-white flex items-center gap-2">
          <div className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <CalendarIcon className="size-4 text-slate-600 dark:text-slate-400" />
          </div>
          Event Calendar
        </h3>
        
        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <button 
            onClick={prevMonth}
            className="flex size-8 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-slate-700 transition-colors"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="text-[14px] font-bold text-navy-950 dark:text-white min-w-[120px] text-center">
            {MONTHS[currentMonth]} {currentYear}
          </span>
          <button 
            onClick={nextMonth}
            className="flex size-8 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-slate-700 transition-colors"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 mb-2">
        {DAYS_OF_WEEK.map((day) => (
          <div key={day} className="text-center text-[12px] font-bold text-slate-400 dark:text-slate-500 pb-2">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-y-1 gap-x-1 mb-6">
        {renderCalendarDays()}
      </div>

      {/* Selected Date Events */}
      <div className="pt-5 border-t border-slate-100 dark:border-slate-800">
        <h4 className="text-[13px] font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">
          {selectedDate ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'Select a date'}
        </h4>
        
        {selectedDateEvents.length > 0 ? (
          <div className="space-y-3">
            {selectedDateEvents.map((event, idx) => (
              <div key={idx} className="flex items-start gap-3 rounded-2xl bg-brand-50 dark:bg-slate-800/50 p-3 border border-brand-100/50 dark:border-slate-700/50">
                <div className="mt-0.5 size-2 rounded-full bg-brand-500 shrink-0" />
                <div>
                  <p className="text-[14px] font-bold text-navy-950 dark:text-white">{event.title}</p>
                  <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="size-3" /> United States Holiday
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-[13px] font-medium text-slate-400 dark:text-slate-500 py-3 text-center bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800/50">
            No events scheduled for this day.
          </div>
        )}
      </div>

    </div>
  );
}
