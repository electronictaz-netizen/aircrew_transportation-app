import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import type { Schema } from '../../amplify/data/resource';
import './TripCalendar.css';

interface TripCalendarProps {
  trips: Array<Schema['Trip']['type']>;
  onDateClick: (date: Date, trips: Array<Schema['Trip']['type']>) => void;
}

function TripCalendar({ trips, onDateClick }: TripCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Get trips for a specific date
  const getTripsForDate = (date: Date): Array<Schema['Trip']['type']> => {
    return trips.filter(trip => {
      if (!trip.pickupDate) return false;
      const tripDate = new Date(trip.pickupDate);
      return isSameDay(tripDate, date);
    });
  };


  // Navigate months
  const previousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

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
    onDateClick(date, dateTrips);
  };

  return (
    <div className="trip-calendar">
      <div className="calendar-header">
        <button className="calendar-nav-btn" onClick={previousMonth} aria-label="Previous month">
          ‹
        </button>
        <h3 className="calendar-month-year">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <button className="calendar-nav-btn" onClick={nextMonth} aria-label="Next month">
          ›
        </button>
        <button className="calendar-today-btn" onClick={goToToday}>
          Today
        </button>
      </div>

      <div className="calendar-grid">
        {/* Day names header */}
        <div className="calendar-weekdays">
          {dayNames.map(day => (
            <div key={day} className="calendar-weekday">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="calendar-days">
          {calendarDays.map((day, idx) => {
            const dayTrips = getTripsForDate(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());
            const isSelected = selectedDate && isSameDay(day, selectedDate);

            return (
              <div
                key={idx}
                className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${dayTrips.length > 0 ? 'has-trips' : ''}`}
                onClick={() => handleDateClick(day)}
              >
                <div className="calendar-day-number">
                  {format(day, 'd')}
                </div>
                {dayTrips.length > 0 && (
                  <div className="calendar-day-trips">
                    <span className="trip-count-badge">{dayTrips.length}</span>
                    {dayTrips.length === 1 && (
                      <div className="trip-preview">
                        {format(new Date(dayTrips[0].pickupDate!), 'h:mm a')} - {dayTrips[0].flightNumber}
                      </div>
                    )}
                  </div>
                )}
              </div>
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
