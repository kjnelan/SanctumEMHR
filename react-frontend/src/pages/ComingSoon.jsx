import React from 'react';

function ComingSoon({ tabName }) {
  return (
    <div className="card-main text-center">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">{tabName} Coming Soon</h2>
      <p className="text-gray-600">
        This feature is under development and will be available in a future update.
      </p>
    </div>
  );
}

export default ComingSoon;
