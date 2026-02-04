import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, getUserDetails, getAppointments } from '../utils/api';
import { getPendingReviews, getMyPendingNotes } from './services/DashboardService';

export function useAuth() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                // Check if user data exists in localStorage
                const currentUser = getCurrentUser();
                if (!currentUser) {
                    navigate('/');
                    return;
                }

                // Default fallback using stored data
                let displayName = currentUser.fullName || currentUser.username || 'User';
                let initials = displayName.substring(0, 2).toUpperCase();
                let isAdmin = currentUser.admin || false;
                let userId = currentUser.id;

                // Variables for role flags
                let isSupervisor = false;
                let isSocialWorker = false;
                let isProvider = false;
                let userType = 'user';

                try {
                    // Verify session is still valid and get latest user details
                    const userDetails = await getUserDetails();

                    if (userDetails) {
                        if (userDetails.fullName) {
                            displayName = userDetails.fullName;
                        }

                        if (userDetails.admin !== undefined) {
                            isAdmin = userDetails.admin;
                        }

                        if (userDetails.id) {
                            userId = userDetails.id;
                        }

                        // Extract role flags from user details
                        isSupervisor = userDetails.isSupervisor || false;
                        isSocialWorker = userDetails.isSocialWorker || false;
                        isProvider = userDetails.isProvider || false;
                        userType = userDetails.userType || 'user';

                        // Compute initials from full name
                        const nameParts = displayName.trim().split(/\s+/);
                        if (nameParts.length > 1) {
                            initials = (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
                        } else {
                            initials = displayName.substring(0, 2).toUpperCase();
                        }
                    }
                } catch (error) {
                    console.log('Could not verify session, using cached data:', error);
                    // If session check fails, redirect to login
                    navigate('/');
                    return;
                }

                // Determine primary role for display
                let role = 'user';
                if (isAdmin) role = 'admin';
                else if (isSupervisor) role = 'supervisor';
                else if (isSocialWorker) role = 'social_worker';
                else if (isProvider) role = 'provider';

                // Build permissions array
                const permissions = [];
                if (isAdmin) permissions.push('admin', 'view_all_clients', 'edit_all_clients', 'view_all_notes');
                if (isSupervisor) permissions.push('view_supervisee_clients', 'view_supervisee_notes');
                if (isProvider) permissions.push('view_own_clients', 'edit_own_clients', 'view_own_notes', 'create_clinical_notes');
                if (isSocialWorker) permissions.push('view_assigned_clients', 'edit_demographics', 'create_case_notes');

                setUser({
                    id: userId,
                    name: displayName,
                    initials,
                    role,
                    userType,
                    isAdmin,
                    isSupervisor,
                    isSocialWorker,
                    isProvider,
                    permissions,
                    unreadMessages: 0
                });

                // Fetch today's appointments
                try {
                    // Use local date, not UTC (fixes timezone issues)
                    const today = new Date();
                    const year = today.getFullYear();
                    const month = String(today.getMonth() + 1).padStart(2, '0');
                    const day = String(today.getDate()).padStart(2, '0');
                    const todayLocal = `${year}-${month}-${day}`;

                    const appointmentsResponse = await getAppointments(todayLocal, todayLocal);
                    setAppointments(appointmentsResponse.appointments || []);
                } catch (error) {
                    console.error('Failed to load today\'s appointments:', error);
                    setAppointments([]);
                }

                setLoading(false);

            } catch (error) {
                console.error('Error loading dashboard data:', error);
                navigate('/');
            }
        }

        loadData();
    }, [navigate]);

    return { user, appointments, loading };
}
