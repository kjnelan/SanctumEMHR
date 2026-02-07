/**
 * SanctumEMHR EMHR
 * Calendar page - Day/Week/Month views with appointment management
 * Supports creating appointments by clicking time slots
 *
 * Author: Kenneth J. Nelan
 * License: Proprietary and Confidential
 * Version: ALPHA
 *
 * Copyright © 2026 Sacred Wandering
 * Proprietary and Confidential
 */

import React, { useState, useEffect } from 'react';
import { getAppointments, getCalendarSettings } from '../services/CalendarService';
import { getProviders } from '../utils/api';
import MiniCalendar from '../components/calendar/MiniCalendar';
import AppointmentModal from '../components/calendar/AppointmentModal';
import { PrimaryButton } from '../components/PrimaryButton';

function Calendar() {
  const [view, setView] = useState('week'); // day, week, month
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [calendarSettings, setCalendarSettings] = useState({
    startHour: 8,
    endHour: 18,
    interval: 15,
    viewType: 'week'
  });

  // Appointment modal state
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [modalInitialDate, setModalInitialDate] = useState(null);
  const [modalInitialTime, setModalInitialTime] = useState(null);
  const [modalProviderId, setModalProviderId] = useState(null);
  const [editingAppointment, setEditingAppointment] = useState(null);

  // Generate time slots based on settings (respects interval)
  const generateTimeSlots = () => {
    const slots = [];
    const intervalMinutes = calendarSettings.interval;
    const slotsPerHour = 60 / intervalMinutes;

    for (let hour = calendarSettings.startHour; hour < calendarSettings.endHour; hour++) {
      for (let slot = 0; slot < slotsPerHour; slot++) {
        const minutes = slot * intervalMinutes;
        slots.push({ hour, minutes });
      }
    }

    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Load calendar settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await getCalendarSettings();
        console.log('Calendar settings response:', response);
        if (response.settings) {
          console.log('Setting calendar hours to:', response.settings);
          setCalendarSettings(response.settings);
          // Set the initial view from settings
          if (response.settings.viewType) {
            setView(response.settings.viewType);
          }
        } else {
          console.log('No settings in response, using defaults');
        }
      } catch (err) {
        console.error('Failed to load calendar settings:', err);
        // Keep defaults if fetch fails
      }
    };
    loadSettings();
  }, []);

  // Load providers on mount
  useEffect(() => {
    const loadProviders = async () => {
      try {
        const response = await getProviders();
        setProviders(response.providers || []);
      } catch (err) {
        console.error('Failed to load providers:', err);
      }
    };
    loadProviders();
  }, []);

  // Load appointments when date or provider changes
  useEffect(() => {
    loadAppointments();
  }, [currentDate, selectedProvider, view]);

  const loadAppointments = async () => {
    setLoading(true);
    setError(null);

    try {
      const { startDate, endDate } = getDateRange();
      console.log('Loading appointments:', { startDate, endDate, currentDate, view });
      const response = await getAppointments(startDate, endDate, selectedProvider);
      console.log('Appointments loaded:', response.appointments);
      setAppointments(response.appointments || []);
    } catch (err) {
      console.error('Failed to load appointments:', err);
      setError('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  // Get date range based on current view
  const getDateRange = () => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    if (view === 'week') {
      // Get Sunday of current week (US convention)
      const day = start.getDay();
      const diff = start.getDate() - day;  // Sunday = 0, so this gets us to Sunday
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);

      // Get Saturday of current week
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else if (view === 'day') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (view === 'month') {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
    }

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  };

  // Get week days for weekly view (Sunday - Saturday)
  const getWeekDays = () => {
    const start = new Date(currentDate);
    const day = start.getDay();
    const diff = start.getDate() - day;  // Sunday = 0, so this gets us to Sunday
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);  // Normalize to midnight

    // Use timestamp-based approach to avoid date mutation bugs
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      return new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    });

    console.log('Week days:', weekDays.map(d => d.toISOString().split('T')[0]));
    return weekDays;
  };

  // Navigate calendar
  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    if (view === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else if (view === 'day') {
      newDate.setDate(newDate.getDate() - 1);
    } else if (view === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else if (view === 'day') {
      newDate.setDate(newDate.getDate() + 1);
    } else if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Convert 24-hour time to 12-hour format
  const formatTime12Hour = (time24) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Format client name as "First L." (first name + last initial)
  const formatClientName = (fullName) => {
    if (!fullName) return '';
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) return parts[0];
    const firstName = parts[0];
    const lastName = parts[parts.length - 1];
    return `${firstName} ${lastName.charAt(0)}.`;
  };

  // Format clinician name as "First L." for compact display
  const formatClinicianName = (apt) => {
    if (!apt.providerFirstName) return apt.providerName || '';
    const firstName = apt.providerFirstName;
    const lastName = apt.providerLastName || '';
    return lastName ? `${firstName} ${lastName.charAt(0)}.` : firstName;
  };

  // Format appointment display - shows "Patient / Clinician" for client appts,
  // or just "Clinician" for non-client appts (supervision, clinic, etc.)
  const formatAppointmentDisplay = (apt) => {
    if (apt.patientName) {
      // Client appointment: show "Patient / Clinician"
      return `${formatClientName(apt.patientName)} / ${formatClinicianName(apt)}`;
    }
    // Non-client appointment: show just the clinician name
    return formatClinicianName(apt);
  };

  // Format compact appointment display for grid view (time + name)
  const formatCompactDisplay = (apt) => {
    const time = formatTime12Hour(apt.startTime).replace(' ', '');
    if (apt.patientName) {
      return `${time} ${formatClientName(apt.patientName)}`;
    }
    // Non-client appointment: show time + category name
    return `${time} ${apt.categoryName || formatClinicianName(apt)}`;
  };

  // Check if appointment is cancelled or no-show
  const isCancelledOrNoShow = (status) => {
    return status === 'cancelled' || status === 'no_show';
  };

  // Check if entry is an availability block (any non-client category)
  // All non-client categories (clinic, holiday) show as striped availability blocks
  // Client appointments show as solid appointments (therapy sessions, etc.)
  const isAvailabilityBlock = (apt) => {
    // All non-client categories are availability blocks with striped styling
    return apt.categoryType !== 'client';
  };

  // Check if appointment is a client appointment (therapy sessions, etc.)
  const isClientAppointment = (apt) => {
    return apt.categoryType === 'client';
  };

  // Get the category color for availability blocks (admin-defined)
  const getBlockColor = (apt) => {
    return apt.categoryColor || '#9CA3AF';
  };

  // Convert hex color to pastel by mixing with white
  const toPastel = (hex) => {
    const color = hex.replace('#', '');
    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);

    // Mix with white (65% white, 35% original) for soft pastel
    const pastelR = Math.round(r * 0.35 + 255 * 0.65);
    const pastelG = Math.round(g * 0.35 + 255 * 0.65);
    const pastelB = Math.round(b * 0.35 + 255 * 0.65);

    return `rgb(${pastelR}, ${pastelG}, ${pastelB})`;
  };

  // Get a slightly darker shade for the border
  const getPastelBorder = (hex) => {
    const color = hex.replace('#', '');
    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);

    // Mix with white (50% white, 50% original) for border
    const borderR = Math.round(r * 0.5 + 255 * 0.5);
    const borderG = Math.round(g * 0.5 + 255 * 0.5);
    const borderB = Math.round(b * 0.5 + 255 * 0.5);

    return `rgb(${borderR}, ${borderG}, ${borderB})`;
  };

  // Get appointment styling - returns only dynamic values (colors based on type)
  // Base glassy styling comes from CSS class .glass-appointment
  // Client appointments use provider/clinician color
  // Non-client appointments (clinic/holiday) use category color from admin settings
  const getAppointmentStyle = (apt) => {
    const isCancelled = isCancelledOrNoShow(apt.status);

    // Cancelled/no-show: uses CSS class .glass-appointment-cancelled
    if (isCancelled) {
      return {
        isCancelled: true,
        textClass: 'line-through text-gray-500',
        secondaryTextClass: 'text-gray-400'
      };
    }

    // Active appointments: compute pastel colors
    // Client appointments use provider color, non-client use category color
    const color = apt.categoryType === 'client'
      ? (apt.providerColor || '#3B82F6')
      : (apt.categoryColor || '#9CA3AF');
    const pastel = toPastel(color);
    const borderColor = getPastelBorder(color);

    return {
      isCancelled: false,
      borderColor: borderColor,
      textClass: 'text-gray-800',
      secondaryTextClass: 'text-gray-600',
      gradient: `linear-gradient(135deg, ${pastel} 0%, ${pastel.replace('rgb', 'rgba').replace(')', ', 0.85)')} 100%)`
    };
  };

  // Get appointments for a specific time slot
  const getAppointmentsForSlot = (date, hour, minutes) => {
    const dateStr = date.toISOString().split('T')[0];
    return appointments.filter(apt => {
      if (apt.eventDate !== dateStr) return false;

      const [aptHourStr, aptMinuteStr] = apt.startTime.split(':');
      const aptHour = parseInt(aptHourStr);
      const aptMinute = parseInt(aptMinuteStr);

      // Only return appointments that START in this specific time slot
      return aptHour === hour && aptMinute === minutes;
    });
  };

  // Calculate how many time slots an appointment spans
  const calculateSlotSpan = (appointment) => {
    if (!appointment.duration) return 1;
    const slots = Math.ceil(appointment.duration / calendarSettings.interval);
    return slots;
  };

  // Calculate absolute position for appointments (OpenEMR style)
  const calculateAppointmentPosition = (appointment) => {
    const [hours, minutes] = appointment.startTime.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const scheduleStartMinutes = calendarSettings.startHour * 60;

    // Calculate top position in pixels
    const minutesFromStart = startMinutes - scheduleStartMinutes;
    const intervalsFromStart = minutesFromStart / calendarSettings.interval;
    const slotHeight = 60; // Each 15-minute slot is 60px tall
    const top = intervalsFromStart * slotHeight;

    // Calculate height in pixels
    // API already converts duration to minutes
    const durationMinutes = appointment.duration || 0;
    const durationIntervals = durationMinutes / calendarSettings.interval;
    const height = durationIntervals * slotHeight;

    return { top, height };
  };

  // Get all appointments for a specific day (for absolute positioning)
  const getAppointmentsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return appointments.filter(apt => apt.eventDate === dateStr);
  };

  // Get appointments for a specific day (for month view)
  const getAppointmentsForDay = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return appointments.filter(apt => apt.eventDate === dateStr);
  };

  // Generate month calendar grid (6 weeks, Sun-Sat)
  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday

    // Start from the Sunday before (or on) the first day of the month
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDayOfWeek);
    startDate.setHours(0, 0, 0, 0);

    // Generate 42 days (6 weeks) for a complete calendar grid
    const days = Array.from({ length: 42 }, (_, i) => {
      return new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    });

    return days;
  };

  // Format date range display
  const getDateRangeDisplay = () => {
    if (view === 'week') {
      const weekDays = getWeekDays();
      const start = weekDays[0];
      const end = weekDays[6];
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else if (view === 'day') {
      return currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    } else {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
  };

  // Open appointment modal with optional date/time/provider pre-filled
  const openAppointmentModal = (date = null, time = null, provider = null) => {
    setEditingAppointment(null); // Clear any existing appointment being edited
    setModalInitialDate(date || currentDate.toISOString().split('T')[0]);
    setModalInitialTime(time);
    setModalProviderId(provider || (selectedProvider !== 'all' ? selectedProvider : null));
    setShowAppointmentModal(true);
  };

  // Open appointment modal for editing an existing appointment
  const handleAppointmentClick = (appointment, e) => {
    e.stopPropagation(); // Prevent time slot click from firing
    setEditingAppointment(appointment);
    setModalInitialDate(null);
    setModalInitialTime(null);
    setModalProviderId(null);
    setShowAppointmentModal(true);
  };

  // Handle time slot click - open modal with that date/time
  const handleTimeSlotClick = (date, hour, minutes) => {
    const dateStr = date.toISOString().split('T')[0];
    const timeStr = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    openAppointmentModal(dateStr, timeStr, selectedProvider !== 'all' ? selectedProvider : null);
  };

  // Handle appointment save - reload appointments
  const handleAppointmentSave = (newAppointment) => {
    console.log('New appointment created:', newAppointment);
    // Reload appointments to show the new one
    loadAppointments();
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="glass-card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>

            <div className="flex gap-3">
              {/* New Appointment Button */}
              <button
                onClick={() => openAppointmentModal()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Appointment
              </button>

              {/* View Toggle */}
              <div className="flex gap-2">
              <button
                onClick={() => setView('day')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  view === 'day'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setView('week')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  view === 'week'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setView('month')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  view === 'month'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Month
              </button>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-4">
            <button
              onClick={navigatePrevious}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={navigateNext}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <PrimaryButton onClick={goToToday}>
              Today
            </PrimaryButton>
            <h2 className="text-xl font-semibold text-gray-900">{getDateRangeDisplay()}</h2>
          </div>
        </div>

      {/* Error Message */}
      {error && (
        <div className="glass-card-sm bg-red-100/60 border-red-300/50 text-red-700 px-4 py-3 mb-6">
          {error}
        </div>
      )}

      {/* Main Content: Sidebar + Calendar */}
      <div className="flex gap-6">
        {/* Left Sidebar */}
        <div className="w-80 flex-shrink-0 space-y-6">
          {/* Mini Month Calendar */}
          <div className="glass-card p-4">
            <MiniCalendar
              currentDate={currentDate}
              onDateClick={setCurrentDate}
            />
          </div>

          {/* Provider List */}
          <div className="glass-card p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Providers</h3>
            <div className="space-y-2">
              <button
                onClick={() => setSelectedProvider('all')}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  selectedProvider === 'all'
                    ? 'bg-blue-100 text-blue-900 font-medium'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                All Providers
              </button>
              {providers.map(provider => (
                <button
                  key={provider.value}
                  onClick={() => setSelectedProvider(provider.value)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    selectedProvider === provider.value
                      ? 'bg-blue-100 text-blue-900 font-medium'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {provider.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Calendar Area */}
        <div className="flex-1">
          {/* Loading State */}
          {loading ? (
            <div className="glass-card p-12 text-center">
              <div className="text-gray-700">Loading appointments...</div>
            </div>
          ) : (
          /* Week View */
          view === 'week' && (
            selectedProvider === 'all' ? (
              /* Schedule Grid View - All Providers */
              <div className="glass-card overflow-hidden">
                {/* Header Row - Provider column + Days */}
                <div className="grid grid-cols-[160px_repeat(7,1fr)] border-b border-white/30">
                  {/* Provider column header */}
                  <div className="p-4 bg-white/20 border-r border-white/30 font-semibold text-gray-700">
                    Provider
                  </div>

                  {/* Day headers */}
                  {getWeekDays().map((day, index) => {
                    const isToday = day.toDateString() === new Date().toDateString();
                    return (
                      <div
                        key={index}
                        className={`p-4 border-r border-white/30 text-center ${
                          isToday ? 'bg-blue-100/40' : 'bg-white/20'
                        }`}
                      >
                        <div className="text-sm text-gray-600">
                          {day.toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                        <div className={`text-lg font-semibold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                          {day.getDate()}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Provider Rows */}
                <div>
                  {providers.map(provider => {
                    // Get all appointments for this provider
                    const providerAppointments = appointments.filter(apt =>
                      String(apt.providerId) === String(provider.value)
                    );

                    return (
                      <div key={provider.value} className="grid grid-cols-[160px_repeat(7,1fr)] border-b border-white/30 min-h-[80px]">
                        {/* Provider name cell */}
                        <div
                          className="p-3 bg-white/10 border-r border-white/30 flex items-start"
                          style={{
                            borderLeft: `4px solid ${providerAppointments[0]?.providerColor || '#3B82F6'}`
                          }}
                        >
                          <div>
                            <div className="font-semibold text-gray-900 text-sm">{provider.label}</div>
                            <div className="text-xs text-gray-500">
                              {providerAppointments.filter(apt => !isAvailabilityBlock(apt)).length} appts
                            </div>
                          </div>
                        </div>

                        {/* Day cells for this provider */}
                          {getWeekDays().map((day, dayIndex) => {
                            const dateStr = day.toISOString().split('T')[0];
                            // Separate availability blocks from regular appointments
                            const dayAvailabilityBlocks = providerAppointments
                              .filter(apt => apt.eventDate === dateStr && isAvailabilityBlock(apt));
                            const dayAppointments = providerAppointments
                              .filter(apt => apt.eventDate === dateStr && !isAvailabilityBlock(apt))
                              .sort((a, b) => a.startTime.localeCompare(b.startTime));
                            const isToday = day.toDateString() === new Date().toDateString();

                            return (
                              <div
                                key={dayIndex}
                                onClick={() => {
                                  // Click to add appointment for this provider on this day
                                  setModalInitialDate(dateStr);
                                  setModalInitialTime('09:00');
                                  setModalProviderId(provider.value);
                                  setEditingAppointment(null);
                                  setShowAppointmentModal(true);
                                }}
                                className={`p-2 border-r border-white/30 hover:bg-white/10 cursor-pointer transition-colors relative ${
                                  isToday ? 'bg-blue-50/30' : ''
                                }`}
                              >
                                {/* Availability blocks shown as background stripes */}
                                {dayAvailabilityBlocks.length > 0 && (
                                  <div
                                    className="availability-block absolute inset-0 pointer-events-none z-0"
                                    style={{ '--block-color': getBlockColor(dayAvailabilityBlocks[0]) }}
                                    title={dayAvailabilityBlocks.map(b => b.categoryName).join(', ')}
                                  />
                                )}
                                <div className="space-y-1 relative z-10">
                                  {/* Show availability block labels */}
                                  {dayAvailabilityBlocks.map(block => (
                                    <div
                                      key={block.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAppointmentClick(block, e);
                                      }}
                                      className="availability-block-label px-2 py-1 rounded text-xs text-gray-700"
                                      style={{ '--block-color': getBlockColor(block) }}
                                    >
                                      <span className="font-medium">{formatTime12Hour(block.startTime).replace(' ', '')}</span>
                                      {' '}{block.categoryName}
                                    </div>
                                  ))}
                                  {dayAppointments.slice(0, 4).map(apt => {
                                    const style = getAppointmentStyle(apt);

                                    return (
                                      <div
                                        key={apt.id}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleAppointmentClick(apt, e);
                                        }}
                                        className={`px-2 py-1.5 rounded-lg text-sm border cursor-pointer ${
                                          style.isCancelled
                                            ? 'glass-appointment-cancelled border-dashed'
                                            : 'glass-appointment'
                                        }`}
                                        style={style.isCancelled ? undefined : {
                                          background: style.gradient,
                                          borderColor: style.borderColor
                                        }}
                                        title={`${apt.patientName || apt.categoryName} - ${apt.categoryName}`}
                                      >
                                        <div className={`font-semibold truncate ${style.textClass}`}>
                                          {formatCompactDisplay(apt)}
                                        </div>
                                      </div>
                                    );
                                  })}
                                  {dayAppointments.length > 4 && (
                                    <div className="text-xs text-gray-500 pl-1">
                                      +{dayAppointments.length - 4} more
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Time-slot View - Single Provider */
              <div className="glass-card overflow-hidden">
                {/* Header Row */}
                <div className="flex border-b border-white/30">
                  {/* Time column header */}
                  <div className="w-20 flex-shrink-0 p-4 bg-white/20 border-r border-white/30 font-semibold text-gray-700">
                    Time
                  </div>

                  {/* Day headers */}
                  <div className="flex-1 flex">
                    {getWeekDays().map((day, index) => {
                      const isToday = day.toDateString() === new Date().toDateString();
                      return (
                        <div
                          key={index}
                          className={`flex-1 p-4 border-r border-white/30 text-center ${
                            isToday ? 'bg-blue-100/40' : 'bg-white/20'
                          }`}
                        >
                          <div className="text-sm text-gray-600">
                            {day.toLocaleDateString('en-US', { weekday: 'short' })}
                          </div>
                          <div className={`text-lg font-semibold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                            {day.getDate()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Calendar Body */}
                <div className="flex">
                  {/* Time labels column */}
                  <div className="w-20 flex-shrink-0 border-r border-white/30 bg-white/20">
                    {timeSlots.map(slot => (
                      <div
                        key={`time-${slot.hour}-${slot.minutes}`}
                        className="h-[60px] p-2 border-b border-white/30 text-xs text-gray-700 font-medium"
                      >
                        {slot.hour === 0 ? '12' : slot.hour < 12 ? slot.hour : slot.hour === 12 ? '12' : slot.hour - 12}:{slot.minutes.toString().padStart(2, '0')} {slot.hour < 12 ? 'AM' : 'PM'}
                      </div>
                    ))}
                  </div>

                  {/* Day columns with absolute positioning */}
                  <div className="flex-1 flex">
                    {getWeekDays().map((day, dayIndex) => {
                      const dayAppointments = getAppointmentsForDate(day);
                      const totalHeight = timeSlots.length * 60;

                      return (
                        <div
                          key={dayIndex}
                          className="flex-1 border-r border-white/30 relative"
                          style={{ height: `${totalHeight}px` }}
                        >
                          {/* Time slot grid lines (for clicking) */}
                          {timeSlots.map(slot => (
                            <div
                              key={`slot-${slot.hour}-${slot.minutes}`}
                              onClick={() => handleTimeSlotClick(day, slot.hour, slot.minutes)}
                              className="absolute w-full h-[60px] border-b border-white/30 hover:bg-white/10 cursor-pointer transition-colors"
                              style={{
                                top: `${timeSlots.findIndex(s => s.hour === slot.hour && s.minutes === slot.minutes) * 60}px`
                              }}
                            />
                          ))}

                          {/* Appointments with absolute positioning */}
                          {dayAppointments.map(apt => {
                            const { top, height } = calculateAppointmentPosition(apt);
                            const isAvailBlock = isAvailabilityBlock(apt);

                            // Availability blocks render as background with category color (admin-defined)
                            if (isAvailBlock) {
                              return (
                                <div
                                  key={apt.id}
                                  onClick={(e) => handleAppointmentClick(apt, e)}
                                  className="availability-block absolute left-0 right-0 z-5"
                                  style={{
                                    '--block-color': getBlockColor(apt),
                                    top: `${top}px`,
                                    height: `${height}px`
                                  }}
                                  title={`${apt.categoryName}${apt.comments ? ': ' + apt.comments : ''}`}
                                >
                                  <div className="p-2">
                                    <div className="font-semibold text-gray-800 text-sm">{formatClinicianName(apt)}</div>
                                    <div className="text-gray-600 text-xs">{apt.categoryName}</div>
                                  </div>
                                </div>
                              );
                            }

                            // Regular appointments are clickable cards with glassy pastel style
                            const style = getAppointmentStyle(apt);

                            return (
                              <div
                                key={apt.id}
                                onClick={(e) => handleAppointmentClick(apt, e)}
                                className={`absolute left-1 right-1 px-3 py-2 rounded-xl text-sm border cursor-pointer z-10 overflow-hidden ${
                                  style.isCancelled
                                    ? 'glass-appointment-cancelled border-dashed'
                                    : 'glass-appointment'
                                }`}
                                style={style.isCancelled ? {
                                  top: `${top}px`,
                                  height: `${height}px`
                                } : {
                                  top: `${top}px`,
                                  height: `${height}px`,
                                  background: style.gradient,
                                  borderColor: style.borderColor
                                }}
                              >
                                <div className={`font-semibold ${style.textClass}`}>
                                  {formatAppointmentDisplay(apt)}
                                </div>
                                {height > 40 && (
                                  <div className={`truncate ${style.secondaryTextClass}`}>
                                    {apt.categoryName}
                                  </div>
                                )}
                                {height > 60 && apt.room && (
                                  <div className={`truncate text-xs mt-1 ${style.secondaryTextClass} ${style.isCancelled ? 'line-through' : ''}`}>
                                    Room: {apt.room}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )
          )
        )}

          {/* Day and Month views - Coming soon placeholders */}
          {!loading && view === 'day' && (
            <div className="glass-card overflow-hidden">
              <div className="grid grid-cols-[150px_1fr] border-b border-white/30">
                {/* Time column header */}
                <div className="p-4 bg-white/20 border-r border-white/30 font-semibold text-gray-700">
                  Time
                </div>

                {/* Day header */}
                {(() => {
                  const isToday = currentDate.toDateString() === new Date().toDateString();
                  return (
                    <div
                      className={`p-4 border-r border-white/30 text-center ${
                        isToday ? 'bg-blue-100/40' : 'bg-white/20'
                      }`}
                    >
                      <div className="text-sm text-gray-600">
                        {currentDate.toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div className={`text-lg font-semibold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                        {currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Time slots */}
              {timeSlots.map(slot => (
                <div key={`${slot.hour}-${slot.minutes}`} className="grid grid-cols-[150px_1fr] border-b border-white/30">
                  {/* Time label */}
                  <div className="p-3 border-r border-white/30 bg-white/20 text-sm text-gray-700 font-medium">
                    {slot.hour === 0 ? '12' : slot.hour < 12 ? slot.hour : slot.hour === 12 ? '12' : slot.hour - 12}:{slot.minutes.toString().padStart(2, '0')} {slot.hour < 12 ? 'AM' : 'PM'}
                  </div>

                  {/* Day cell */}
                  {(() => {
                    const slotAppointments = getAppointmentsForSlot(currentDate, slot.hour, slot.minutes);
                    return (
                      <div
                        onClick={() => handleTimeSlotClick(currentDate, slot.hour, slot.minutes)}
                        className="p-2 border-r border-white/30 hover:bg-white/10 cursor-pointer transition-colors min-h-[60px]"
                      >
                        {slotAppointments.map(apt => {
                          // Check if this is an availability block ('holiday' type) or regular appointment
                          const isAvailBlock = isAvailabilityBlock(apt);
                          const isCancelled = isCancelledOrNoShow(apt.status);

                          // Calculate how many slots this appointment spans
                          const slotsSpan = calculateSlotSpan(apt);
                          const heightPx = slotsSpan * 60 - 8; // 60px per slot, minus padding

                          // Availability blocks use category color (admin-defined) with stripes
                          if (isAvailBlock) {
                            return (
                              <div
                                key={apt.id}
                                onClick={(e) => handleAppointmentClick(apt, e)}
                                className="availability-block-card mb-1 px-3 py-2 rounded-xl text-sm"
                                style={{
                                  '--block-color': getBlockColor(apt),
                                  height: `${heightPx}px`
                                }}
                              >
                                <div className="font-semibold text-gray-800 flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                  </svg>
                                  {apt.categoryName}
                                </div>
                                {apt.comments && (
                                  <div className="text-gray-600 truncate text-xs italic">{apt.comments}</div>
                                )}
                              </div>
                            );
                          }

                          // Regular appointments get glassy pastel styling
                          const style = getAppointmentStyle(apt);

                          return (
                            <div
                              key={apt.id}
                              onClick={(e) => handleAppointmentClick(apt, e)}
                              className={`mb-1 px-3 py-2 rounded-xl text-sm border cursor-pointer ${
                                style.isCancelled
                                  ? 'glass-appointment-cancelled border-dashed'
                                  : 'glass-appointment'
                              }`}
                              style={style.isCancelled ? {
                                height: `${heightPx}px`
                              } : {
                                height: `${heightPx}px`,
                                background: style.gradient,
                                borderColor: style.borderColor
                              }}
                            >
                              <div className={`font-semibold ${style.textClass}`}>
                                {formatAppointmentDisplay(apt)}
                              </div>
                              <div className={`truncate ${style.secondaryTextClass}`}>
                                {apt.categoryName}
                              </div>
                              {apt.room && (
                                <div className={`truncate text-xs ${style.secondaryTextClass} ${style.isCancelled ? 'line-through' : ''}`}>
                                  Room: {apt.room}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              ))}
            </div>
          )}

          {!loading && view === 'month' && (
            <div className="glass-card overflow-hidden">
              {/* Day of week headers */}
              <div className="grid grid-cols-7 border-b border-white/30">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div
                    key={day}
                    className="p-4 bg-white/20 border-r border-white/30 text-center font-semibold text-gray-700"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid - 6 weeks */}
              <div className="grid grid-cols-7">
                {getMonthDays().map((day, index) => {
                  const isToday = day.toDateString() === new Date().toDateString();
                  const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                  const dayAppointments = getAppointmentsForDay(day);

                  return (
                    <div
                      key={index}
                      className={`min-h-[120px] border-r border-b border-white/30 p-2 hover:bg-white/10 cursor-pointer transition-colors ${
                        !isCurrentMonth ? 'bg-white/5' : ''
                      }`}
                    >
                      {/* Day number */}
                      <div className="flex justify-between items-start mb-2">
                        <span
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
                            isToday
                              ? 'bg-blue-600 text-white'
                              : isCurrentMonth
                              ? 'text-gray-900'
                              : 'text-gray-400'
                          }`}
                        >
                          {day.getDate()}
                        </span>
                        {dayAppointments.length > 0 && (
                          <span className="text-xs bg-blue-100 text-blue-900 px-2 py-0.5 rounded-full font-medium">
                            {dayAppointments.length}
                          </span>
                        )}
                      </div>

                      {/* Appointments list */}
                      <div className="space-y-1.5">
                        {dayAppointments.slice(0, 3).map(apt => {
                          // Check if this is an availability block ('holiday' type) or regular appointment
                          const isAvailBlock = isAvailabilityBlock(apt);
                          const isCancelled = isCancelledOrNoShow(apt.status);

                          // Availability blocks use category color (admin-defined) with stripes
                          if (isAvailBlock) {
                            return (
                              <div
                                key={apt.id}
                                onClick={(e) => handleAppointmentClick(apt, e)}
                                className="availability-block-card px-2 py-1.5 rounded-lg text-xs truncate"
                                style={{ '--block-color': getBlockColor(apt) }}
                              >
                                <div className="font-semibold text-gray-800 flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                  </svg>
                                  <span className="truncate">{apt.categoryName}</span>
                                </div>
                              </div>
                            );
                          }

                          // Regular appointments get glassy pastel styling
                          const style = getAppointmentStyle(apt);

                          return (
                            <div
                              key={apt.id}
                              onClick={(e) => handleAppointmentClick(apt, e)}
                              className={`px-2 py-1.5 rounded-lg text-xs border cursor-pointer ${
                                style.isCancelled
                                  ? 'glass-appointment-cancelled border-dashed'
                                  : 'glass-appointment'
                              }`}
                              style={style.isCancelled ? undefined : {
                                background: style.gradient,
                                borderColor: style.borderColor
                              }}
                            >
                              <div className={`font-semibold truncate ${style.textClass}`}>
                                {formatAppointmentDisplay(apt)}
                              </div>
                              <div className={`truncate text-[11px] ${style.secondaryTextClass} ${style.isCancelled ? 'line-through' : ''}`}>
                                {apt.categoryName}
                              </div>
                            </div>
                          );
                        })}
                        {dayAppointments.length > 3 && (
                          <div className="text-xs text-gray-600 pl-2">
                            +{dayAppointments.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Appointment Modal */}
      <AppointmentModal
        isOpen={showAppointmentModal}
        onClose={() => setShowAppointmentModal(false)}
        onSave={handleAppointmentSave}
        initialDate={modalInitialDate}
        initialTime={modalInitialTime}
        providerId={modalProviderId}
        providers={providers}
        appointment={editingAppointment}
      />
    </div>
  );
}

export default Calendar;
