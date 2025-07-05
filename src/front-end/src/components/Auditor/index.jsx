import React, { useState, useEffect } from 'react'
import {
  Shield,
} from 'lucide-react'
import { usePublicClient } from 'wagmi'
import { CONTRACT_ADDRESSES } from '../../config/neroConfig'
import AuditorHeader from './AuditorHeader'
import PendingRequests from './PendingRequests'
import AuditDetail from './AuditDetail'

const AuditorDashboard = () => {
  const [selectedAudit, setSelectedAudit] = useState(null)
  const [harvestStats, setHarvestStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
  })

  const publicClient = usePublicClient()

  const loadHarvestStats = async () => {
    if (!publicClient) return

    try {
      const currentHarvestId = await publicClient.readContract({
        address: "0xa4C53F8729A73eE40edA6a56A3eCEbba3422c437",
        abi: CONTRACT_ADDRESSES.harvestManager.abi,
        functionName: 'currentHarvestId',
      })

      let pending = 0
      let approved = 0
      let rejected = 0

      for (let i = 0; i < currentHarvestId; i++) {
        try {
          const harvest = await publicClient.readContract({
            address: CONTRACT_ADDRESSES.harvestManager.address,
            abi: CONTRACT_ADDRESSES.harvestManager.abi,
            functionName: 'harvests',
            args: [i],
          })

          const status = Number(harvest[5])
          if (status === 0) pending++
          else if (status === 1) approved++
          else if (status === 5) rejected++
        } catch (err) {
          console.warn(`Erro ao ler safra ${i}:`, err)
        }
      }

      setHarvestStats({ pending, approved, rejected })
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err)
    }
  }

  useEffect(() => {
    loadHarvestStats()
  }, [publicClient])

  const handleSelectAudit = (harvest) => {
    setSelectedAudit(harvest)
  }

  const handleBackToList = () => {
    setSelectedAudit(null)
    loadHarvestStats()
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <AuditorHeader stats={harvestStats} />

      {!selectedAudit ? (
        <div>
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="flex items-center mb-4">
              <Shield className="h-6 w-6 text-green-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-800">
                Auditor Dashboard
              </h2>
            </div>
          </div>

          <PendingRequests onSelectAudit={handleSelectAudit} />
        </div>
      ) : (
        <AuditDetail
          audit={selectedAudit}
          onBack={handleBackToList}
        />
      )}
    </div>
  )
}

export default AuditorDashboard
