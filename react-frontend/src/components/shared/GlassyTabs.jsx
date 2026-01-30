/**
 * SanctumEMHR EMHR
 * GlassyTabs - Shared component for beautiful glassy tab navigation
 * Provides consistent tab styling across the application
 *
 * Author: Kenneth J. Nelan
 * License: Proprietary and Confidential
 * Version: ALPHA
 *
 * Copyright © 2026 Sacred Wandering
 * Proprietary and Confidential
 */

import React from 'react';

/**
 * GlassyTabs - Container for tab navigation with glassy styling
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - GlassyTab components
 * @param {string} props.className - Additional classes for the container
 */
export function GlassyTabs({ children, className = '' }) {
  return (
    <div
      className={`flex flex-wrap gap-2 p-2 rounded-xl ${className}`}
      style={{
        backdropFilter: 'blur(60px) saturate(180%)',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.4) 100%)',
        boxShadow: '0 8px 32px rgba(107, 154, 196, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
        border: '1px solid rgba(255, 255, 255, 0.6)'
      }}
    >
      {children}
    </div>
  );
}

/**
 * GlassyTab - Individual tab button with glassy active/inactive states
 *
 * @param {object} props
 * @param {boolean} props.active - Whether this tab is currently active
 * @param {function} props.onClick - Click handler
 * @param {React.ReactNode} props.children - Tab label content
 * @param {string} props.className - Additional classes
 */
export function GlassyTab({ active, onClick, children, className = '' }) {
  const baseStyles = {
    padding: '0.75rem 1.25rem',
    fontWeight: 600,
    transition: 'all 300ms',
    whiteSpace: 'nowrap',
    borderRadius: '0.75rem',
    cursor: 'pointer',
    border: 'none',
    outline: 'none'
  };

  const activeStyles = {
    ...baseStyles,
    background: 'linear-gradient(135deg, rgba(232, 220, 196, 0.6) 0%, rgba(107, 154, 196, 0.5) 100%)',
    backdropFilter: 'blur(20px)',
    color: 'rgb(30, 58, 88)',
    boxShadow: '0 4px 12px rgba(107, 154, 196, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.5)'
  };

  const inactiveStyles = {
    ...baseStyles,
    background: 'transparent',
    color: 'rgb(55, 65, 81)',
    border: '1px solid transparent'
  };

  return (
    <button
      onClick={onClick}
      className={`hover:bg-white/35 ${className}`}
      style={active ? activeStyles : inactiveStyles}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.color = 'rgb(17, 24, 39)';
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.35)';
          e.currentTarget.style.backdropFilter = 'blur(20px)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(107, 154, 196, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5)';
          e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.4)';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.color = 'rgb(55, 65, 81)';
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.backdropFilter = 'none';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.border = '1px solid transparent';
        }
      }}
    >
      {children}
    </button>
  );
}

export default GlassyTabs;
