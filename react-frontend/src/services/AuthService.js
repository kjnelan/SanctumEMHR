/**
 * AuthService.js
 * Centralized service for authentication-related operations
 *
 * This service handles:
 * - User session management
 * - Login/logout operations
 * - User details retrieval
 */

import { apiRequest } from '../utils/api';

/**
 * Get current user info from localStorage
 * (populated during login)
 * @returns {Object|null} User object or null if not logged in
 */
export function getCurrentUser() {
  const userJson = localStorage.getItem('user');
  if (!userJson) return null;

  try {
    return JSON.parse(userJson);
  } catch (error) {
    console.error('AuthService: Error parsing user data:', error);
    return null;
  }
}

/**
 * Fetch user details from session endpoint
 * Maps backend fields to React-expected field names
 * @returns {Promise<Object|null>} User details or null
 */
export async function getUserDetails() {
  try {
    const response = await apiRequest('/custom/api/session_user.php', { noRedirect: true });
    console.log('Session user response:', response);

    if (response && response.username) {
      // Store the raw response for compatibility
      localStorage.setItem('user', JSON.stringify(response));

      // Return in format the React app expects, mapping new API fields to old field names
      return {
        id: response.id || null,
        fname: response.firstName || response.fname || '',
        lname: response.lastName || response.lname || '',
        fullName: response.fullName || response.fullName || '',
        displayName: response.displayName || response.fullName || '',
        admin: response.isAdmin || response.admin || false,
        isAdmin: response.isAdmin || response.admin || false,
        isSupervisor: response.isSupervisor || false,
        isSocialWorker: response.isSocialWorker || false,
        isProvider: response.isProvider || false,
        userType: response.userType || 'user',
        username: response.username || null
      };
    }
  } catch (error) {
    console.log('AuthService: Session user fetch failed:', error.message);
  }

  return null;
}

/**
 * Logout the current user
 * Destroys session on server and clears local storage
 */
export async function logout() {
  try {
    await fetch('/custom/api/session_logout.php', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('AuthService: Logout error:', error);
  } finally {
    // Clear local storage
    localStorage.removeItem('user');
    // Redirect to login
    window.location.href = '/app/';
  }
}
