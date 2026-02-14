import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { portalGetSession } from '../services/PortalService';

export function usePortalAuth() {
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkSession() {
      try {
        // Quick check: is there cached portal data?
        const cached = localStorage.getItem('portalClient');
        if (!cached) {
          navigate('/mycare/login');
          return;
        }

        // Verify session is still valid server-side
        const sessionData = await portalGetSession();

        if (sessionData && sessionData.id) {
          setClient({
            id: sessionData.id,
            firstName: sessionData.firstName,
            lastName: sessionData.lastName,
            fullName: sessionData.fullName,
            email: sessionData.email,
            phone: sessionData.phone,
            dateOfBirth: sessionData.dateOfBirth,
            providerName: sessionData.providerName,
            forcePasswordChange: sessionData.forcePasswordChange,
            initials: (sessionData.firstName?.[0] || '') + (sessionData.lastName?.[0] || '')
          });
        } else {
          localStorage.removeItem('portalClient');
          navigate('/mycare/login');
        }
      } catch (error) {
        console.log('Portal session check failed:', error.message);
        localStorage.removeItem('portalClient');
        navigate('/mycare/login');
      } finally {
        setLoading(false);
      }
    }

    checkSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - navigate is stable but eslint doesn't know that

  return { client, loading };
}
