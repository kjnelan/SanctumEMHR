/**
 * SanctumEMHR EMHR
 * Calendar Availability - Provider availability management
 * Allows providers to set their availability (in office, vacation, meetings, etc.)
 *
 * Author: Kenneth J. Nelan
 * License: Proprietary and Confidential
 * Version: ALPHA
 *
 * Copyright © 2026 Sacred Wandering
 * Proprietary and Confidential
 */

import React, { useState, useEffect } from 'react';
import { getAppointments, getAppointmentCategories, createAppointment, getCalendarSettings } from '../../services/CalendarService';
import { getCurrentUser } from '../../services/AuthService';
import BlockTimeModal from './BlockTimeModal';

function CalendarAvailability() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('week');
  const [availabilityBlocks, setAvailabilityBlocks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [editingBlock, setEditingBlock] = useState(null);
  // Calendar settings from admin
  const [calendarSettings, setCalendarSettings] = useState({
    startHour: 8,
    endHour: 17,
    interval: 15
  });

  // Load calendar settings and categories on mount
  useEffect(() => {
    loadCalendarSettings();
    loadCategories();
  }, []);

  // Load availability blocks when date changes
  useEffect(() => {
    loadAvailabilityBlocks();
  }, [currentDate, view]);

  const loadCalendarSettings = async () => {
    try {
      const response = await getCalendarSettings();
      if (response.settings) {
        setCalendarSettings({
          startHour: response.settings.startHour || 8,
          endHour: response.settings.endHour || 17,
          interval: response.settings.interval || 15
        });
      }
    } catch (err) {
      console.error('Failed to load calendar settings:', err);
      // Keep defaults if settings fail to load
    }
  };

  const loadCategories = async () => {
    try {
      // Fetch non-client categories (clinic, holiday) for availability/blocking
      // Pass null for type to get all, and 'client' to exclude client appointment types
      const response = await getAppointmentCategories(null, 'client');
      setCategories(response.categories || []);
    } catch (err) {
      console.error('Failed to load availability categories:', err);
    }
  };

  const loadAvailabilityBlocks = async () => {
    setLoading(true);
    try {
      // Get current user's provider ID
      const currentUser = getCurrentUser();
      console.log('[CalendarAvailability] Current user:', currentUser);

      if (!currentUser || !currentUser.id) {
        console.error('No current user found');
        setAvailabilityBlocks([]);
        setLoading(false);
        return;
      }

      const { startDate, endDate } = getDateRange();
      console.log('[CalendarAvailability] Date range:', { startDate, endDate });
      console.log('[CalendarAvailability] Fetching for provider ID:', currentUser.id);

      // TEMPORARY: Try without provider filter to debug
      const response = await getAppointments(startDate, endDate, 'all');
      console.log('[CalendarAvailability] API response:', response);
      console.log('[CalendarAvailability] Total appointments:', response.appointments?.length);

      // Filter to only show availability blocks for THIS user
      // All non-client categories (clinic, holiday) are availability blocks
      const blocks = response.appointments.filter(apt => {
        const isAvailabilityBlock = apt.categoryType !== 'client';
        const isCurrentProvider = apt.providerId == currentUser.id; // Use == for loose comparison
        console.log('[CalendarAvailability] Checking appointment:', {
          id: apt.id,
          categoryType: apt.categoryType,
          providerId: apt.providerId,
          currentUserId: currentUser.id,
          isAvailabilityBlock,
          isCurrentProvider
        });
        return isAvailabilityBlock && isCurrentProvider;
      });

      console.log('[CalendarAvailability] Filtered blocks:', blocks);
      setAvailabilityBlocks(blocks);
    } catch (err) {
      console.error('Failed to load availability blocks:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = () => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    if (view === 'week') {
      const day = start.getDay();
      const diff = start.getDate() - day;
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else if (view === 'day') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    }

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  };

  const getWeekDays = () => {
    const start = new Date(currentDate);
    const day = start.getDay();
    const diff = start.getDate() - day;
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);

    return Array.from({ length: 7 }, (_, i) => {
      return new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    });
  };

  const handleTimeSlotClick = (date, hour, minutes) => {
    const dateStr = date.toISOString().split('T')[0];
    const timeStr = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    setEditingBlock(null); // Clear editing block for new creation
    setSelectedSlot({ date: dateStr, time: timeStr });
    setShowBlockModal(true);
  };

  const handleBlockClick = (block, e) => {
    e.stopPropagation(); // Prevent time slot click from firing
    setEditingBlock(block);
    setSelectedSlot(null);
    setShowBlockModal(true);
  };

  const handleBlockSave = () => {
    setShowBlockModal(false);
    setEditingBlock(null);
    loadAvailabilityBlocks();
  };

  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    if (view === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getDateRangeDisplay = () => {
    if (view === 'week') {
      const weekDays = getWeekDays();
      const start = weekDays[0];
      const end = weekDays[6];
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    }
  };

  // Generate time slots based on admin calendar settings
  const { startHour, endHour, interval } = calendarSettings;
  const slotsPerHour = 60 / interval;
  const totalHours = endHour - startHour;
  const totalSlots = totalHours * slotsPerHour;

  const timeSlots = Array.from({ length: totalSlots }, (_, i) => {
    const hour = Math.floor(i / slotsPerHour) + startHour;
    const minutes = (i % slotsPerHour) * interval;
    return { hour, minutes };
  });

  // Calculate absolute position for blocks (OpenEMR style)
  const calculateBlockPosition = (block) => {
    const [hours, minutes] = block.startTime.split(':').map(Number);
    const blockStartMinutes = hours * 60 + minutes;
    const scheduleStartMinutes = startHour * 60;

    // Calculate top position in pixels
    const minutesFromStart = blockStartMinutes - scheduleStartMinutes;
    const intervalsFromStart = minutesFromStart / interval;
    const slotHeight = 60; // Each slot is 60px tall
    const top = intervalsFromStart * slotHeight;

    // Calculate height in pixels
    const durationMinutes = block.duration || 0;
    const durationIntervals = durationMinutes / interval;
    const height = durationIntervals * slotHeight;

    return { top, height };
  };

  // Get all blocks for a specific date (for absolute positioning)
  const getBlocksForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return availabilityBlocks.filter(block => block.eventDate === dateStr);
  };

  return (
    <div className="glass-card p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Manage My Availability</h2>
        <p className="text-gray-600">Set your availability for vacation, meetings, lunch breaks, in-office hours, and more</p>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mb-6">
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
          <button
            onClick={goToToday}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
          >
            Today
          </button>
          <h3 className="text-xl font-semibold text-gray-900">{getDateRangeDisplay()}</h3>
        </div>

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
        </div>
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-600">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
          {/* Week View */}
          {view === 'week' && (
            <div>
              {/* Day Headers */}
              <div className="flex border-b border-gray-200">
                <div className="w-20 p-4 bg-gray-50 border-r border-gray-200 font-semibold text-gray-700 flex-shrink-0">
                  Time
                </div>
                {getWeekDays().map((day, index) => {
                  const isToday = day.toDateString() === new Date().toDateString();
                  return (
                    <div
                      key={index}
                      className={`flex-1 p-4 border-r border-gray-200 text-center ${
                        isToday ? 'bg-blue-50' : 'bg-gray-50'
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

              {/* Calendar Body with Absolute Positioning */}
              <div className="flex">
                {/* Time Labels Column */}
                <div className="w-20 flex-shrink-0 border-r border-gray-200 bg-gray-50">
                  {timeSlots.map(slot => (
                    <div
                      key={`time-${slot.hour}-${slot.minutes}`}
                      className="h-[60px] p-3 border-b border-gray-200 text-sm text-gray-700 font-medium"
                    >
                      {slot.hour === 0 ? '12' : slot.hour < 12 ? slot.hour : slot.hour === 12 ? '12' : slot.hour - 12}:{slot.minutes.toString().padStart(2, '0')} {slot.hour < 12 ? 'AM' : 'PM'}
                    </div>
                  ))}
                </div>

                {/* Day Columns with Absolute Positioning */}
                <div className="flex-1 flex">
                  {getWeekDays().map((day, dayIndex) => {
                    const dayBlocks = getBlocksForDate(day);
                    const totalHeight = timeSlots.length * 60;

                    return (
                      <div
                        key={dayIndex}
                        className="flex-1 border-r border-gray-200 relative"
                        style={{ height: `${totalHeight}px` }}
                      >
                        {/* Time slot grid lines (for clicking) */}
                        {timeSlots.map(slot => (
                          <div
                            key={`slot-${slot.hour}-${slot.minutes}`}
                            onClick={() => handleTimeSlotClick(day, slot.hour, slot.minutes)}
                            className="absolute w-full h-[60px] border-b border-gray-200 hover:bg-blue-50 cursor-pointer transition-colors"
                            style={{
                              top: `${timeSlots.findIndex(s => s.hour === slot.hour && s.minutes === slot.minutes) * 60}px`
                            }}
                          />
                        ))}

                        {/* Blocks with absolute positioning */}
                        {dayBlocks.map(block => {
                          const { top, height } = calculateBlockPosition(block);
                          // Use category color from admin settings, fallback to gray
                          const blockColor = block.categoryColor || '#9CA3AF';

                          return (
                            <div
                              key={block.id}
                              onClick={(e) => handleBlockClick(block, e)}
                              className="availability-block-card absolute left-1 right-1 px-2 py-1 rounded-lg text-xs z-10 overflow-hidden"
                              style={{
                                '--block-color': blockColor,
                                top: `${top}px`,
                                height: `${height}px`
                              }}
                            >
                              <div className="font-semibold text-gray-800">{block.categoryName}</div>
                              {height > 30 && block.comments && (
                                <div className="text-gray-600 text-[10px] truncate">{block.comments}</div>
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
          )}
        </div>
      )}

      {/* Availability Modal */}
      <BlockTimeModal
        isOpen={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        onSave={handleBlockSave}
        initialDate={selectedSlot?.date}
        initialTime={selectedSlot?.time}
        categories={categories}
        block={editingBlock}
      />
    </div>
  );
}

export default CalendarAvailability;
