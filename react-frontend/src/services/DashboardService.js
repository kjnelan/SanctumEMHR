import { apiRequest } from '../utils/api';

export const getPendingReviews = async () => {
  try {
    const response = await apiRequest('/custom/api/notes/pending_supervisor_review.php', {
      credentials: 'include'
    });
    return response;
  } catch (error) {
    console.error('Error fetching pending reviews:', error);
    throw error;
  }
};

export const getMyPendingNotes = async () => {
  try {
    const response = await apiRequest('/custom/api/notes/my_pending_notes.php', {
      credentials: 'include'
    });
    return response;
  } catch (error) {
    console.error('Error fetching my pending notes:', error);
    throw error;
  }
};

export const getUserDetails = async () => {
  try {
    const response = await apiRequest('/custom/api/user_details.php', {
      credentials: 'include'
    });
    return response;
  } catch (error) {
    console.error('Error fetching user details:', error);
    throw error;
  }
};
