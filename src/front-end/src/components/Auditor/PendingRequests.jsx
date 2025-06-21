import React, { useEffect, useState } from "react";
import { usePublicClient, useWalletClient } from "wagmi";
import { CONTRACT_ADDRESSES } from "../../config/neroConfig";
import { Leaf, Calendar, User, Check, Loader2, Download } from "lucide-react";

const PendingRequests = ({ onSelectAudit }) => {
  const [harvests, setHarvests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState(null);

  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const loadHarvests = async () => {
    setLoading(true);

    try {
      if (!publicClient) return;

      const currentHarvestId = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.harvestManager.address,
        abi: CONTRACT_ADDRESSES.harvestManager.abi,
        functionName: "currentHarvestId",
      });

      const loadedHarvests = [];

      for (let i = 0; i < currentHarvestId; i++) {
        try {
          const harvest = await publicClient.readContract({
            address: CONTRACT_ADDRESSES.harvestManager.address,
            abi: CONTRACT_ADDRESSES.harvestManager.abi,
            functionName: "harvests",
            args: [i],
          });

          const status = Number(harvest[5]);
          if (status === 0) {
            const deliveryDate = new Date(Number(harvest[3]) * 1000);

            loadedHarvests.push({
              id: i,
              cropType: harvest[0],
              quantity: parseFloat(harvest[1]?.toString?.() ?? 0),
              pricePerUnit: parseFloat(harvest[2]?.toString?.() ?? 0),
              harvestDate: deliveryDate.toISOString(),
              farmerAddress: harvest[4], // nomeado corretamente
              documentation: harvest[7],
              status: "pending",
            });
          }
        } catch (harvestErr) {
          console.error(`Erro ao buscar harvest ${i}:`, harvestErr);
        }
      }

      setHarvests(loadedHarvests);
    } catch (err) {
      console.error("Erro geral ao buscar harvests:", err);
    }

    setLoading(false);
  };

  const approveHarvest = async (harvest) => {
    if (!walletClient || !publicClient) {
      alert("Carteira não conectada ou client não disponível.");
      return;
    }

    try {
      setApprovingId(harvest.id);

      const txHash = await walletClient.writeContract({
        address: CONTRACT_ADDRESSES.harvestManager.address,
        abi: CONTRACT_ADDRESSES.harvestManager.abi,
        functionName: "mintHarvest",
        args: [harvest.farmerAddress, harvest.id],
      });

      await publicClient.waitForTransactionReceipt({ hash: txHash });

      alert(`✅ Safra ${harvest.id} aprovada com sucesso!`);
      await loadHarvests();
    } catch (err) {
      console.error("❌ Erro ao aprovar safra:", err);
      alert(err?.shortMessage || "Erro ao aprovar safra.");
    } finally {
      setApprovingId(null);
    }
  };

  useEffect(() => {
    loadHarvests();
  }, [publicClient]);

  const downloadHarvestDocs = (linksString) => {
  
    const links = linksString.split(",").map((link) => link.trim());

    links.forEach(async (link) => {
      try {
        const response = await fetch(link);
        const blob = await response.blob();

        // Extrai o nome do arquivo da URL
        const fileName =
          link.split("/").pop()?.split("_").slice(1).join("_") || "arquivo";

        // Cria um link temporário e força o download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Erro ao baixar arquivo:", error);
      }
    });
  };

  return (
    <div className="grid gap-6">
      <h2 className="text-xl font-semibold text-gray-800">Pending Harvests</h2>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-gray-500">
          <Loader2 className="animate-spin h-6 w-6 mr-2" />
          Loading crops...
        </div>
      ) : harvests.length === 0 ? (
        <div className="text-gray-500">No pending harvest at this time.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {harvests.map((harvest) => (
            <div
              key={harvest.id}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition cursor-pointer"
              onClick={() => onSelectAudit(harvest)}
            >
              <div className="flex items-center mb-2">
                <Leaf className="h-5 w-5 text-green-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-800">
                  {harvest.cropType}
                </h3>
              </div>

              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex items-center">
                  <User className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="font-medium">{harvest.farmerAddress}</span>
                </div>

                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                  <span>
                    Delivery date:{" "}
                    {new Date(harvest.harvestDate).toLocaleDateString()}
                  </span>
                </div>

                <p>
                  Amount: <strong>{harvest.quantity}</strong> kg
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  downloadHarvestDocs(harvest.docs); // string com os links
                }}
                className="mb-2 w-full bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-2 rounded-md flex items-center justify-center transition"
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar documentos sobre a safra
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  approveHarvest(harvest);
                }}
                disabled={approvingId === harvest.id}
                className={`mt-4 w-full ${
                  approvingId === harvest.id
                    ? "bg-green-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                } text-white text-sm px-3 py-2 rounded-md flex items-center justify-center transition`}
              >
                {approvingId === harvest.id ? (
                  <Loader2 className="animate-spin h-4 w-4" />
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Approve Harvest
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PendingRequests;
