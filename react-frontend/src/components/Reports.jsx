import { useState, useEffect } from 'react';
import { getClientDemographics } from '../utils/api';

function Reports() {
  const [demographics, setDemographics] = useState({
    age: [],
    gender: [],
    race: [],
    ethnicity: []
  });
  const [demographicsLoading, setDemographicsLoading] = useState(true);

  // Fetch demographics on component mount
  useEffect(() => {
    const fetchDemographics = async () => {
      try {
        const demographicsData = await getClientDemographics();
        setDemographics(demographicsData);
      } catch (err) {
        console.error('Failed to fetch demographics:', err);
      } finally {
        setDemographicsLoading(false);
      }
    };

    fetchDemographics();
  }, []);

  const renderDemographicBar = (data, title) => {
    if (!data || data.length === 0) {
      return (
        <div className="text-gray-500 text-sm text-center py-4">No data available</div>
      );
    }

    const total = data.reduce((sum, item) => sum + item.count, 0);

    return (
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">{title}</h4>
        <div className="space-y-2">
          {data.map((item, index) => {
            const percentage = total > 0 ? (item.count / total) * 100 : 0;
            return (
              <div key={index}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600">{item.category}</span>
                  <span className="text-gray-500 font-semibold">{item.count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="card-main">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">Reports</h2>
        <p className="text-gray-600 text-xs">Analytics and demographic insights</p>
      </div>

      {/* Active Demographics Card */}
      <div className="card-main">
        <h3 className="text-sm font-bold text-gray-700 mb-4">Active Demographics</h3>
        {demographicsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-3 bg-gray-300 rounded w-20 mb-2"></div>
                <div className="h-2 bg-gray-300 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-5">
            <div>{renderDemographicBar(demographics.age, 'Age Range')}</div>
            <div>{renderDemographicBar(demographics.gender, 'Gender')}</div>
            <div>{renderDemographicBar(demographics.race, 'Race')}</div>
            <div>{renderDemographicBar(demographics.ethnicity, 'Ethnicity')}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Reports;
