/**
 * PortalService.js
 * API service for the client portal (/mycare)
 *
 * Handles all portal-specific API calls including authentication,
 * profile management, and appointment retrieval.
 */

const PORTAL_API = '/custom/api/portal';

async function portalRequest(endpoint, options = {}) {
  const response = await fetch(`${PORTAL_API}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('portalClient');
      window.location.href = '/app/#/mycare/login';
      throw new Error('Session expired');
    }
    throw new Error(data.message || data.error || 'Request failed');
  }

  return data;
}

// --- Authentication ---

export async function portalLogin(username, password) {
  const response = await fetch(`${PORTAL_API}/login.php`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error || 'Login failed');
  }

  if (data.success && data.client) {
    localStorage.setItem('portalClient', JSON.stringify(data.client));
  }

  return data;
}

export async function portalGetSession() {
  return portalRequest('/session.php');
}

export async function portalLogout() {
  try {
    await fetch(`${PORTAL_API}/logout.php`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Portal logout error:', error);
  } finally {
    localStorage.removeItem('portalClient');
    window.location.href = '/app/#/mycare/login';
  }
}

export async function portalChangePassword(newPassword, confirmPassword) {
  return portalRequest('/session.php', {
    method: 'POST',
    body: JSON.stringify({ new_password: newPassword, confirm_password: confirmPassword }),
  });
}

// --- Profile ---

export async function portalGetProfile() {
  return portalRequest('/profile.php');
}

export async function portalUpdateProfile(updates) {
  return portalRequest('/profile.php', {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

// --- Appointments ---

export async function portalGetAppointments(view = 'upcoming') {
  return portalRequest(`/appointments.php?view=${view}`);
}

// --- Admin (staff-side portal management) ---

export async function portalAdminEnable(clientId, portalUsername, temporaryPassword) {
  const response = await fetch(`${PORTAL_API}/admin_manage.php`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: clientId, portal_username: portalUsername, temporary_password: temporaryPassword }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to enable portal access');
  return data;
}

export async function portalAdminResetPassword(clientId, temporaryPassword) {
  const response = await fetch(`${PORTAL_API}/admin_manage.php`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: clientId, temporary_password: temporaryPassword }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to reset password');
  return data;
}

export async function portalAdminRevoke(clientId) {
  const response = await fetch(`${PORTAL_API}/admin_manage.php`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: clientId }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to revoke access');
  return data;
}
