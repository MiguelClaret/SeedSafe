import React from 'react'

const AuditorHeader = ({ stats }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Dr. Carlos Mendes</h2>
          <p className="text-sm text-gray-500">Senior Auditor</p>
        </div>

        <div className="relative">
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full text-white text-xs flex items-center justify-center">
            {stats?.pending ?? 0}
          </div>
          <span className="text-gray-400">🔔</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-sm font-medium text-yellow-800">Pending Reviews</p>
          <p className="text-2xl font-bold text-yellow-800">{stats?.pending ?? 0}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <p className="text-sm font-medium text-green-800">Approved</p>
          <p className="text-2xl font-bold text-green-800">{stats?.approved ?? 0}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-sm font-medium text-red-800">Rejected</p>
          <p className="text-2xl font-bold text-red-800">{stats?.rejected ?? 0}</p>
        </div>
      </div>
    </div>
  )
}

export default AuditorHeader
