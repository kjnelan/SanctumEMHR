/**
 * Mindline EMHR
 * Calendar Availability - Provider availability/blocking management
 * Allows providers to block time on their calendar (vacation, meetings, etc.)
 *
 * Author: Kenneth J. Nelan
 * License: Proprietary and Confidential
 * Version: ALPHA
 *
 * Copyright © 2026 Sacred Wandering
 * Proprietary and Confidential
 */

import React, { useState, useEffect } from 'react';
import { getAppointments, getAppointmentCategories, createAppointment, getCurrentUser } from '../../utils/api';
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

  // Load availability categories (Type 1) on mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Load availability blocks when date changes
  useEffect(() => {
    loadAvailabilityBlocks();
  }, [currentDate, view]);

  const loadCategories = async () => {
    try {
      // Fetch Type 1 categories (provider availability/blocking)
      const response = await getAppointmentCategories(1);
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

      // Filter to only show availability blocks (Type 1 categories) for THIS user
      const blocks = response.appointments.filter(apt => {
        const isAvailabilityBlock = apt.categoryType === 1;
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

  // Generate time slots (8 AM to 6 PM, 15-minute intervals)
  const timeSlots = Array.from({ length: 40 }, (_, i) => {
    const hour = Math.floor(i / 4) + 8;
    const minutes = (i % 4) * 15;
    return { hour, minutes };
  });

  // Calculate absolute position for blocks (OpenEMR style)
  const calculateBlockPosition = (block) => {
    const [hours, minutes] = block.startTime.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const scheduleStartMinutes = 8 * 60; // 8 AM start

    // Calculate top position in pixels
    const minutesFromStart = startMinutes - scheduleStartMinutes;
    const intervalsFromStart = minutesFromStart / 15;
    const slotHeight = 60; // Each 15-minute slot is 60px tall
    const top = intervalsFromStart * slotHeight;

    // Calculate height in pixels
    const durationMinutes = block.duration || 0;
    const durationIntervals = durationMinutes / 15;
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
        <p className="text-gray-600">Block time for vacation, meetings, lunch breaks, and other unavailable periods</p>
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
                          const bgColor = block.categoryColor || '#E5E7EB';
                          const borderColor = block.categoryColor ? `${block.categoryColor}80` : '#9CA3AF80';

                          return (
                            <div
                              key={block.id}
                              onClick={(e) => handleBlockClick(block, e)}
                              className="absolute left-1 right-1 px-2 py-1 rounded-lg text-xs border hover:opacity-80 hover:shadow-md transition-all cursor-pointer z-10 overflow-hidden"
                              style={{
                                top: `${top}px`,
                                height: `${height}px`,
                                backgroundColor: `${bgColor}B3`,
                                borderColor: borderColor
                              }}
                            >
                              <div className="font-semibold text-gray-900">{block.categoryName}</div>
                              {height > 30 && block.comments && (
                                <div className="text-gray-700 text-[10px] truncate">{block.comments}</div>
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

      {/* Block Time Modal */}
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
