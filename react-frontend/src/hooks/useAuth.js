import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, getUserDetails, getAppointments } from '../utils/api';

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

                setUser({
                    id: userId,
                    name: displayName,
                    initials,
                    role: isAdmin ? 'admin' : 'user',
                    permissions: isAdmin ? ['admin'] : [],
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
