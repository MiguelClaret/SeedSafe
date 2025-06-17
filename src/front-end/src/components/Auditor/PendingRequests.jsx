import React, { useEffect, useState } from 'react';
import { usePublicClient } from 'wagmi';
import { CONTRACT_ADDRESSES } from '../../config/neroConfig';

const PendingRequests = () => {
  const [harvests, setHarvests] = useState([]);
  const publicClient = usePublicClient();

  useEffect(() => {
    const loadHarvests = async () => {
      try {
        console.log("📡 Iniciando carregamento de harvests...");

        console.log("📡 Lendo currentHarvestId...");
        const currentHarvestId = await publicClient.readContract({
          address: CONTRACT_ADDRESSES.harvestManager.address,
          abi: CONTRACT_ADDRESSES.harvestManager.abi,
          functionName: 'currentHarvestId',
        });

        console.log(`🔢 currentHarvestId recebido: ${currentHarvestId}`);

        const loadedHarvests = [];

        for (let i = 0; i < currentHarvestId; i++) {
          console.log(`📥 Lendo harvest ID: ${i}`);

          const harvest = await publicClient.readContract({
            address: CONTRACT_ADDRESSES.harvestManager.address,
            abi: CONTRACT_ADDRESSES.harvestManager.abi,
            functionName: 'harvests',
            args: [i],
          });

          console.log(`✅ Harvest ${i}:`, harvest);

          loadedHarvests.push({
            id: i,
            cropType: harvest[0],
            quantity: harvest[1].toString(),
            pricePerUnit: harvest[2].toString(),
            deliveryDate: new Date(harvest[3] * 1000).toLocaleDateString(),
            farmer: harvest[4],
            status: harvest[5],
            harvestedAmount: harvest[6].toString(),
            documentation: harvest[7],
          });
        }

        console.log("✅ Todos harvests carregados:", loadedHarvests);
        setHarvests(loadedHarvests);
      } catch (err) {
        console.error('❌ Erro ao buscar harvests:', err);
      }
    };

    loadHarvests();
  }, [publicClient]);

  return (
    <div>
      <h2>Pending Requests</h2>
      {harvests.length === 0 ? (
        <p>Loading harvests...</p>
      ) : (
        harvests.map((harvest) => (
          <div key={harvest.id}>
            <h3>{harvest.cropType}</h3>
            <p>Quantity: {harvest.quantity}</p>
            <p>Price per Unit: {harvest.pricePerUnit}</p>
            <p>Delivery Date: {harvest.deliveryDate}</p>
            <p>Farmer: {harvest.farmer}</p>
            <p>Status: {harvest.status}</p>
            <p>Harvested Amount: {harvest.harvestedAmount}</p>
            <p>Documentation: {harvest.documentation}</p>
          </div>
        ))
      )}
    </div>
  );
};

export default PendingRequests;
