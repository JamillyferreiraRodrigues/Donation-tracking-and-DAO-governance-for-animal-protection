import { useState, useEffect, useCallback } from "react";
import { usePublicClient } from "wagmi";
import {
  PETS_CONTRACT_ADDRESS,
  PETS_CONTRACT_ABI
} from "../config";

export const useLoadPets = () => {
  const publicClient = usePublicClient();

  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);

  // ----------------------------------------------------------------
  // 1) Buscar totalSupply direto do contrato
  // ----------------------------------------------------------------
  const loadTotalSupply = async () => {
    try {
      return await publicClient.readContract({
        address: PETS_CONTRACT_ADDRESS,
        abi: PETS_CONTRACT_ABI,
        functionName: "totalsupply",
      });
    } catch {
      return 0;
    }
  };

  // ----------------------------------------------------------------
  // 2) Carregar todos os pets existentes
  // ----------------------------------------------------------------
  const loadPets = useCallback(async () => {
    try {
      setLoading(true);
      const total = Number(await loadTotalSupply());

      if (total === 0) {
        setPets([]);
        setLoading(false);
        return;
      }

      const loaded = [];

      for (let tokenId = 1; tokenId <= total; tokenId++) {
        try {
          // ----------------------------------------------------------
          // OWNER
          // ----------------------------------------------------------
          const owner = await publicClient.readContract({
            address: PETS_CONTRACT_ADDRESS,
            abi: PETS_CONTRACT_ABI,
            functionName: "ownerOf",
            args: [tokenId],
          });

          // ----------------------------------------------------------
          // TOKEN URI
          // ----------------------------------------------------------
          const tokenURI = await publicClient.readContract({
            address: PETS_CONTRACT_ADDRESS,
            abi: PETS_CONTRACT_ABI,
            functionName: "tokenURI",
            args: [tokenId],
          });

          // ----------------------------------------------------------
          // REQUESTER
          // ----------------------------------------------------------
          const requester = await publicClient.readContract({
            address: PETS_CONTRACT_ADDRESS,
            abi: PETS_CONTRACT_ABI,
            functionName: "getAdoptionRequester",
            args: [tokenId],
          });

          // ----------------------------------------------------------
          // CARREGAR METADATA (se for link HTTP ou dataURI)
          // ----------------------------------------------------------
          let metadata = {};

          if (tokenURI.startsWith("data:application/json")) {
            // dataURI → converter base64
            const base64 = tokenURI.split(",")[1];
            metadata = JSON.parse(atob(base64));
          } else {
            try {
              const res = await fetch(tokenURI);
              metadata = await res.json();
            } catch {
              metadata = { name: `Pet #${tokenId}`, description: "Sem metadata" };
            }
          }

          // Montar objeto final
          loaded.push({
            id: tokenId,
            tokenId,
            owner,
            requester: requester === "0x0000000000000000000000000000000000000000" ? null : requester,
            metadata,
          });

        } catch (err) {
          console.warn(`❗ Erro ao carregar token ${tokenId}:`, err);
        }
      }

      setPets(loaded);
      setLoading(false);

    } catch (err) {
      console.error("Erro ao carregar pets:", err);
      setLoading(false);
    }
  }, []);

  // Executar a leitura
  useEffect(() => {
    loadPets();
  }, []);

  // Atualizar a cada 30s
  useEffect(() => {
    const interval = setInterval(loadPets, 30000);
    return () => clearInterval(interval);
  }, [loadPets]);

  return { pets, loading, reloadPets: loadPets };
};

