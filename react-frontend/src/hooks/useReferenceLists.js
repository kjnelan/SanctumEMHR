import { useState, useEffect } from 'react';

/**
 * Custom hook to fetch reference lists from the API
 * @param {string[]} listTypes - Array of list types to fetch (e.g., ['sexual-orientation', 'gender-identity'])
 * @returns {object} - Object with loading state, error, and data for each list type
 */
function useReferenceLists(listTypes = []) {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReferenceLists = async () => {
      if (listTypes.length === 0) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch all list types in parallel
        const promises = listTypes.map(async (type) => {
          const response = await fetch(
            `/custom/api/reference_lists.php?type=${type}`,
            {
              method: 'GET',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );

          if (!response.ok) {
            throw new Error(`Failed to fetch ${type}`);
          }

          const result = await response.json();
          return { type, items: result.items || [] };
        });

        const results = await Promise.all(promises);

        // Transform results into an object keyed by list type
        const listsData = {};
        results.forEach(({ type, items }) => {
          // Filter to only active items and format for dropdown use
          listsData[type] = items
            .filter(item => item.active !== false)
            .map(item => ({
              value: item.id,
              label: item.name,
              description: item.description
            }));
        });

        setData(listsData);
      } catch (err) {
        console.error('Error fetching reference lists:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReferenceLists();
  }, [JSON.stringify(listTypes)]); // Stringify to compare array contents

  return { data, loading, error };
}

export default useReferenceLists;
