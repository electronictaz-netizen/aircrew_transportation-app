import { useState, useEffect, useRef } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, addDays, subDays } from 'date-fns';
import type { Schema } from '../../amplify/data/resource';
import './TripCalendar.css';

interface TripCalendarProps {
  trips: Array<Schema['Trip']['type']>;
  onDateClick: (date: Date, trips: Array<Schema['Trip']['type']>) => void;
}

function TripCalendar({ trips, onDateClick }: TripCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [focusedDate, setFocusedDate] = useState<Date | null>(null);
  const [announcement, setAnnouncement] = useState<string>('');
  const calendarRef = useRef<HTMLDivElement>(null);
  const focusedDateRef = useRef<HTMLButtonElement>(null);

  // Get trips for a specific date
  const getTripsForDate = (date: Date): Array<Schema['Trip']['type']> => {
    return trips.filter(trip => {
      if (!trip.pickupDate) return false;
      const tripDate = new Date(trip.pickupDate);
      return isSameDay(tripDate, date);
    });
  };


  // Navigate months
  const previousMonth = () => {
    const newMonth = subMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
    setAnnouncement(`Navigated to ${format(newMonth, 'MMMM yyyy')}`);
  };
  
  const nextMonth = () => {
    const newMonth = addMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
    setAnnouncement(`Navigated to ${format(newMonth, 'MMMM yyyy')}`);
  };
  
  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setFocusedDate(today);
    setAnnouncement(`Navigated to today, ${format(today, 'MMMM d, yyyy')}`);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!focusedDate) return;

      let newDate: Date | null = null;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          newDate = subDays(focusedDate, 1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          newDate = addDays(focusedDate, 1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          newDate = subDays(focusedDate, 7);
          break;
        case 'ArrowDown':
          e.preventDefault();
          newDate = addDays(focusedDate, 7);
          break;
        case 'Home':
          e.preventDefault();
          newDate = startOfMonth(currentMonth);
          break;
        case 'End':
          e.preventDefault();
          newDate = endOfMonth(currentMonth);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (focusedDate) {
            const dateTrips = trips.filter(trip => {
              if (!trip.pickupDate) return false;
              const tripDate = new Date(trip.pickupDate);
              return isSameDay(tripDate, focusedDate);
            });
            setSelectedDate(focusedDate);
            onDateClick(focusedDate, dateTrips);
          }
          return;
        case 'Escape':
          e.preventDefault();
          setFocusedDate(null);
          setSelectedDate(null);
          return;
        default:
          return;
      }

      if (newDate) {
        setFocusedDate(newDate);
        // Navigate to different month if needed
        if (!isSameMonth(newDate, currentMonth)) {
          setCurrentMonth(startOfMonth(newDate));
        }
        const dateTrips = trips.filter(trip => {
          if (!trip.pickupDate) return false;
          const tripDate = new Date(trip.pickupDate);
          return isSameDay(tripDate, newDate);
        });
        setAnnouncement(`${format(newDate, 'MMMM d, yyyy')}${dateTrips.length > 0 ? `, ${dateTrips.length} trip${dateTrips.length > 1 ? 's' : ''}` : ', no trips'}`);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedDate, currentMonth, trips, onDateClick]);

  // Focus management
  useEffect(() => {
    if (focusedDateRef.current) {
      focusedDateRef.current.focus();
    }
  }, [focusedDate]);

  // Initialize focused date to today
  useEffect(() => {
    if (!focusedDate) {
      setFocusedDate(new Date());
    }
  }, []);

  // Get calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday = 0
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Day names
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleDateClick = (date: Date) => {
    const dateTrips = getTripsForDate(date);
    setSelectedDate(date);
    setFocusedDate(date);
    onDateClick(date, dateTrips);
  };

  const handleDateFocus = (date: Date) => {
    setFocusedDate(date);
  };

  return (
    <div className="trip-calendar" ref={calendarRef} role="application" aria-label="Trip calendar">
      {/* Screen reader announcements */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
        style={{ position: 'absolute', left: '-10000px', width: '1px', height: '1px', overflow: 'hidden' }}
      >
        {announcement}
      </div>

      <div className="calendar-header">
        <button 
          className="calendar-nav-btn" 
          onClick={previousMonth} 
          aria-label={`Previous month, go to ${format(subMonths(currentMonth, 1), 'MMMM yyyy')}`}
          type="button"
        >
          ‹
        </button>
        <h3 className="calendar-month-year" id="calendar-month-year">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <button 
          className="calendar-nav-btn" 
          onClick={nextMonth} 
          aria-label={`Next month, go to ${format(addMonths(currentMonth, 1), 'MMMM yyyy')}`}
          type="button"
        >
          ›
        </button>
        <button 
          className="calendar-today-btn" 
          onClick={goToToday}
          aria-label="Go to today's date"
          type="button"
        >
          Today
        </button>
      </div>

      <div className="calendar-grid" role="grid" aria-labelledby="calendar-month-year">
        {/* Day names header */}
        <div className="calendar-weekdays" role="row">
          {dayNames.map(day => (
            <div key={day} className="calendar-weekday" role="columnheader" aria-label={day}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="calendar-days" role="rowgroup">
          {calendarDays.map((day, idx) => {
            const dayTrips = getTripsForDate(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isFocused = focusedDate && isSameDay(day, focusedDate);
            const dateLabel = format(day, 'EEEE, MMMM d, yyyy');
            const tripsLabel = dayTrips.length > 0 
              ? `${dayTrips.length} trip${dayTrips.length > 1 ? 's' : ''} scheduled`
              : 'No trips scheduled';

            return (
              <button
                key={idx}
                ref={isFocused ? focusedDateRef : null}
                className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${isFocused ? 'focused' : ''} ${dayTrips.length > 0 ? 'has-trips' : ''}`}
                onClick={() => handleDateClick(day)}
                onFocus={() => handleDateFocus(day)}
                type="button"
                role="gridcell"
                aria-label={`${dateLabel}, ${tripsLabel}`}
                aria-selected={isSelected || undefined}
                tabIndex={isFocused || (!focusedDate && isToday) ? 0 : -1}
              >
                <div className="calendar-day-number">
                  {format(day, 'd')}
                </div>
                {dayTrips.length > 0 && (
                  <div className="calendar-day-trips">
                    <span className="trip-count-badge" aria-label={`${dayTrips.length} trips`}>
                      {dayTrips.length}
                    </span>
                    {dayTrips.length === 1 && (
                      <div className="trip-preview" aria-hidden="true">
                        {format(new Date(dayTrips[0].pickupDate!), 'h:mm a')} - {dayTrips[0].flightNumber}
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="calendar-legend">
        <div className="legend-item">
          <div className="legend-color today"></div>
          <span>Today</span>
        </div>
        <div className="legend-item">
          <div className="legend-color has-trips"></div>
          <span>Has Trips</span>
        </div>
        <div className="legend-item">
          <div className="legend-color selected"></div>
          <span>Selected</span>
        </div>
      </div>
    </div>
  );
}

export default TripCalendar;
