// src/PatasConfiaDApp.jsx 
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { 
  useAccount, 
  useBalance, 
  useConnect, 
  useDisconnect,
  useContractRead,
  usePublicClient
} from "wagmi";
import { 
  USERS_CONTRACT_ADDRESS, 
  USERS_CONTRACT_ABI, 
  PETS_CONTRACT_ADDRESS, 
  PETS_CONTRACT_ABI 
} from "./config";
import { useLoadPets } from "./hooks/useLoadPets";

// ------------------
// Serviço Pinata/IPFS
// ------------------
class MetadataService {
  static async generateMetadata(petData) {
    console.log("📝 Gerando metadata para:", petData.name);
    
    let imageUrl = petData.imageUrl;
    
    
    if (petData.imageFile) {
      console.log("🖼️ Processando imagem...");
      try {
        imageUrl = await this.uploadImageToIPFS(petData.imageFile);
        console.log("✅ Imagem processada:", imageUrl);
      } catch (error) {
        console.error("❌ Erro ao processar imagem:", error);
      }
    }

    // Criar metadata
    const metadata = {
      name: petData.name,
      description: petData.description,
      image: imageUrl || "https://via.placeholder.com/400x400/4caf50/ffffff?text=Pet+Sem+Imagem",
      attributes: [
        { trait_type: "Espécie", value: petData.species },
        { trait_type: "Raça", value: petData.breed || "SRD" },
        { trait_type: "Idade", value: petData.age || "Não informada" },
        { trait_type: "Porte", value: petData.size },
        { trait_type: "Gênero", value: petData.gender },
        { trait_type: "Saúde", value: petData.health },
        { trait_type: "Temperamento", value: petData.temperament },
        { trait_type: "Localização", value: petData.location || "Não informada" },
      ],
      created_at: new Date().toISOString()
    };

    console.log("📄 Metadata gerada:", metadata);
    return metadata;
  }

  static async uploadImageToIPFS(imageFile) {
    try {
      const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;
      
      if (!PINATA_JWT) {
        console.warn("⚠️ PINATA_JWT não configurado. Usando fallback...");
        return null;
      }

      const formData = new FormData();
      formData.append('file', imageFile);

      console.log("📤 Enviando imagem para Pinata...");
      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PINATA_JWT}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Erro Pinata:", errorText);
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("📸 Imagem salva no IPFS:", data.IpfsHash);
      return `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`;
    } catch (error) {
      console.error('❌ Erro ao fazer upload da imagem:', error);
      return null;
    }
  }

  static async uploadToIPFS(metadata) {
    try {
      const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;
      
      if (!PINATA_JWT) {
        console.warn("⚠️ PINATA_JWT não configurado. Usando fallback base64...");
        const jsonString = JSON.stringify(metadata);
        const base64Data = btoa(unescape(encodeURIComponent(jsonString)));
        return `data:application/json;base64,${base64Data}`;
      }

      console.log("📤 Enviando metadata para Pinata...");
      const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${PINATA_JWT}`
        },
        body: JSON.stringify(metadata)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Erro Pinata:", errorText);
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("✅ Metadata salva no IPFS:", data.IpfsHash);
      return `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`;
    } catch (error) {
      console.error('❌ Erro ao fazer upload para IPFS:', error);
      // Fallback: usar base64
      const jsonString = JSON.stringify(metadata);
      const base64Data = btoa(unescape(encodeURIComponent(jsonString)));
      return `data:application/json;base64,${base64Data}`;
    }
  }
}

// ------------------
// Estilos
// ------------------
const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f0f9f0 0%, #e0f2e0 100%)",
    color: "#1a3c1a",
    padding: "24px",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  card: {
    background: "white",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
    border: "2px solid #c8e6c9",
    marginBottom: "20px"
  },
  input: {
    width: "100%",
    padding: "12px",
    border: "2px solid #c8e6c9",
    borderRadius: "12px",
    background: "white",
    fontSize: "16px",
    marginBottom: "12px"
  },
  button: {
    padding: "12px 24px",
    borderRadius: "12px",
    background: "#4caf50",
    color: "white",
    border: "none",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(76, 175, 80, 0.3)",
    transition: "all 0.3s ease"
  },
  secondaryButton: {
    padding: "12px 24px",
    borderRadius: "12px",
    background: "#81c784",
    color: "#1a3c1a",
    border: "none",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(129, 199, 132, 0.3)"
  },
  nav: {
    background: "#c8e6c9",
    color: "#1a3c1a",
    padding: "16px",
    borderRadius: "16px",
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    justifyContent: "center",
    marginBottom: "24px",
    border: "2px solid #a5d6a7"
  },
  navLink: {
    fontWeight: "bold",
    padding: "8px 16px",
    borderRadius: "8px",
    background: "#e8f5e9",
    textDecoration: "none",
    color: "#1a3c1a",
    border: "1px solid #a5d6a7",
    cursor: "pointer"
  },
  grid: {
    display: "grid",
    gap: "16px"
  },
  grid2: {
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))"
  },
  grid3: {
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))"
  }
};

// ------------------
// Componentes Compartilhados
// ------------------
const PixelBanner = () => (
  <div style={{ 
    width: "100%", 
    display: "flex", 
    justifyContent: "center", 
    marginBottom: "32px" 
  }}>
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "16px",
      background: "#e8f5e9",
      borderRadius: "16px",
      padding: "16px",
      border: "2px solid #a5d6a7"
    }}>
      <span style={{ fontSize: "48px" }}>🐕</span>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: "32px", fontWeight: "bold", color: "#1a3c1a", margin: 0 }}>
          🐾 Patas Confia
        </h1>
        <p style={{ color: "#2e7d32", margin: 0 }}>Plataforma de Adoção Responsável - CESS Testnet</p>
      </div>
      <span style={{ fontSize: "48px" }}>🐈</span>
    </div>
  </div>
);

// ------------------
// NOVO: Componente de Introdução do Projeto
// ------------------
const ProjectIntroduction = () => (
  <div style={{
    ...styles.card,
    background: "linear-gradient(135deg, #e8f5e9 0%, #d4edda 100%)",
    border: "2px solid #a5d6a7",
    textAlign: "center",
    marginBottom: "32px",
    padding: "32px 24px"
  }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", marginBottom: "20px" }}>
      <span style={{ fontSize: "48px" }}>💚</span>
      <h2 style={{ fontSize: "28px", fontWeight: "bold", color: "#1a3c1a", margin: 0 }}>
        Bem-vindo ao Patas Confia
      </h2>
      <span style={{ fontSize: "48px" }}>🐾</span>
    </div>
    
    <div style={{
      maxWidth: "800px",
      margin: "0 auto",
      fontSize: "16px",
      lineHeight: "1.6",
      color: "#2e7d32"
    }}>
      <p style={{ marginBottom: "16px" }}>
        🌟 <strong>Nosso objetivo:</strong> Conectar <strong>doadores responsáveis</strong> a 
        <strong> adotantes comprometidos</strong> através da tecnologia blockchain, 
        garantindo transparência, segurança e rastreabilidade em todo o processo de adoção.
      </p>
      
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "16px",
        margin: "20px 0"
      }}>
        <div style={{
          background: "white",
          borderRadius: "12px",
          padding: "16px",
          border: "2px solid #a5d6a7"
        }}>
          <div style={{ fontSize: "32px", marginBottom: "8px" }}>🦮</div>
          <h3 style={{ fontSize: "16px", fontWeight: "bold", color: "#1a3c1a", marginBottom: "8px" }}>
            Apenas animais legais
          </h3>
          <p style={{ fontSize: "14px", color: "#2e7d32" }}>
            Somente pets que podem ser legalmente doados devem ser registrados
          </p>
        </div>
        
        <div style={{
          background: "white",
          borderRadius: "12px",
          padding: "16px",
          border: "2px solid #a5d6a7"
        }}>
          <div style={{ fontSize: "32px", marginBottom: "8px" }}>❤️</div>
          <h3 style={{ fontSize: "16px", fontWeight: "bold", color: "#1a3c1a", marginBottom: "8px" }}>
            Responsabilidade acima de tudo
          </h3>
          <p style={{ fontSize: "14px", color: "#2e7d32" }}>
            Compromisso com o bem-estar animal é essencial
          </p>
        </div>
        
        <div style={{
          background: "white",
          borderRadius: "12px",
          padding: "16px",
          border: "2px solid #a5d6a7"
        }}>
          <div style={{ fontSize: "32px", marginBottom: "8px" }}>🏠</div>
          <h3 style={{ fontSize: "16px", fontWeight: "bold", color: "#1a3c1a", marginBottom: "8px" }}>
            Adoção consciente
          </h3>
          <p style={{ fontSize: "14px", color: "#2e7d32" }}>
            Cada adoção é uma decisão que muda vidas
          </p>
        </div>
      </div>
      
      <div style={{
        background: "rgba(255, 255, 255, 0.8)",
        borderRadius: "12px",
        padding: "16px",
        border: "2px solid #ff9800",
        marginTop: "20px"
      }}>
        <p style={{ fontStyle: "italic", color: "#e65100", fontWeight: "bold" }}>
          ⚠️ <strong>Importante:</strong> Este não é apenas um site de adoção - 
          é um compromisso com a vida animal, onde cada transação representa 
          uma nova chance de felicidade para um pet!
        </p>
      </div>
      
      <div style={{ marginTop: "24px", fontSize: "14px", color: "#388e3c" }}>
        <span style={{ fontSize: "24px" }}>🌿</span>
        <p style={{ margin: "8px 0" }}>
          <strong>Como funciona:</strong> Registre-se → Cadastre pets (doadores) → 
          Solicite adoção (adotantes) → Aprove seu novo amigo!
        </p>
      </div>
    </div>
  </div>
);

const WalletConnect = () => {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "16px",
        marginBottom: "24px",
        padding: "16px",
        background: "#e8f5e9",
        borderRadius: "16px",
        border: "2px solid #a5d6a7"
      }}>
        <span style={{ fontSize: "24px" }}>🌼</span>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div style={{
            width: "12px",
            height: "12px",
            background: "#4caf50",
            borderRadius: "50%",
            animation: "pulse 1.5s infinite"
          }}></div>
          <span style={{
            fontFamily: "monospace",
            fontSize: "14px",
            background: "white",
            padding: "8px 12px",
            borderRadius: "8px",
            border: "1px solid #a5d6a7",
            wordBreak: "break-all",
            maxWidth: "300px"
          }}>
            {address}
          </span>
          <span style={{ fontSize: "14px", color: "#2e7d32", whiteSpace: "nowrap" }}>
            Saldo: {balance?.formatted?.slice(0, 6)} {balance?.symbol}
          </span>
          <button
            onClick={() => disconnect()}
            style={{
              ...styles.secondaryButton,
              whiteSpace: "nowrap"
            }}
          >
            Desconectar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "16px",
      marginBottom: "24px",
      padding: "16px",
      background: "#e8f5e9",
      borderRadius: "16px",
      border: "2px solid #a5d6a7"
    }}>
      <span style={{ fontSize: "24px" }}>🌼</span>
      {connectors.map((connector) => (
        <button
          key={connector.uid}
          onClick={() => connect({ connector })}
          style={styles.button}
        >
          🌿 Conectar {connector.name}
        </button>
      ))}
    </div>
  );
};

const Navbar = ({ currentPage, setCurrentPage }) => (
  <nav style={styles.nav}>
    <button 
      onClick={() => setCurrentPage("registro")}
      style={{
        ...styles.navLink,
        background: currentPage === "registro" ? "#a5d6a7" : "#e8f5e9"
      }}
    >
      🌼 Registro
    </button>
    <button 
      onClick={() => setCurrentPage("criar")}
      style={{
        ...styles.navLink,
        background: currentPage === "criar" ? "#a5d6a7" : "#e8f5e9"
      }}
    >
      🐕 Criar Pets
    </button>
    <button 
      onClick={() => setCurrentPage("adotar")}
      style={{
        ...styles.navLink,
        background: currentPage === "adotar" ? "#a5d6a7" : "#e8f5e9"
      }}
    >
      🏠 Adotar
    </button>
    <button 
      onClick={() => setCurrentPage("solicitacoes")}
      style={{
        ...styles.navLink,
        background: currentPage === "solicitacoes" ? "#a5d6a7" : "#e8f5e9"
      }}
    >
      📋 Solicitações
    </button>
    <button 
      onClick={() => setCurrentPage("adocoes")}
      style={{
        ...styles.navLink,
        background: currentPage === "adocoes" ? "#a5d6a7" : "#e8f5e9"
      }}
    >
      ❤️ Minhas Adoções
    </button>
  </nav>
);

// ------------------
// UTIL: Criar contrato com signer
// ------------------
const getSignerContract = async (abi, address) => {
  if (!window.ethereum) throw new Error("Carteira não encontrada (window.ethereum)");
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  return new ethers.Contract(address, abi, signer);
};

// ------------------
// Página 1 — Registro de Usuário 
// ------------------
const Registro = () => {
  const { address, isConnected } = useAccount();
  const [tipoConta, setTipoConta] = useState("1");
  const [message, setMessage] = useState("");
  const [walletConsulta, setWalletConsulta] = useState("");
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  // Consultar usuário atual
  const { data: userData, refetch: refetchUser } = useContractRead({
    address: USERS_CONTRACT_ADDRESS,
    abi: USERS_CONTRACT_ABI,
    functionName: "getUser",
    args: [address],
    enabled: false,
  });

  // Consultar usuário por wallet
  const { data: queriedUserData, refetch: refetchQueriedUser } = useContractRead({
    address: USERS_CONTRACT_ADDRESS,
    abi: USERS_CONTRACT_ABI,
    functionName: "getUser",
    args: [walletConsulta || "0x0000000000000000000000000000000000000000"],
    enabled: false,
  });

  // Registrar usuário com ethers
  const handleRegister = async () => {
    if (!isConnected) {
      setMessage("❌ Conecte a carteira primeiro");
      return;
    }
    
    try {
      setLoading(true);
      setMessage("🔐 Solicitando assinatura...");
      
      const contract = await getSignerContract(USERS_CONTRACT_ABI, USERS_CONTRACT_ADDRESS);
      const tx = await contract.RegisterUser(parseInt(tipoConta));
      
      setMessage(`⏳ Transação enviada: ${tx.hash}`);
      await tx.wait();
      
      setMessage("✅ Usuário registrado com sucesso!");
      refetchUser();
    } catch (err) {
      console.error("Erro no registro:", err);
      setMessage(`❌ Erro: ${err?.message || String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  // Verificar se o usuário atual está registrado
  const checkSelf = async () => {
    if (!isConnected) {
      setMessage("❌ Conecte a carteira primeiro");
      return;
    }
    
    try {
      const result = await refetchUser();
      if (result.data && result.data.wallet !== "0x0000000000000000000000000000000000000000") {
        const u = result.data;
        setUserInfo({
          wallet: u.wallet,
          tipo: Number(u.tipo),
          data: new Date(Number(u.data) * 1000).toLocaleString("pt-BR")
        });
        setMessage(`✅ Você está cadastrado como ${Number(u.tipo) === 1 ? "🐕 Doador" : "🐾 Adotante"}`);
      } else {
        setUserInfo(null);
        setMessage("❌ Você não está cadastrado");
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Erro ao verificar cadastro");
    }
  };

  // Consultar outro usuário
  const getUser = async () => {
    if (!walletConsulta.trim()) {
      setMessage("❌ Informe um endereço");
      return;
    }
    
    try {
      const result = await refetchQueriedUser();
      if (result.data && result.data.wallet !== "0x0000000000000000000000000000000000000000") {
        const u = result.data;
        setUserInfo({
          wallet: u.wallet,
          tipo: Number(u.tipo),
          data: new Date(Number(u.data) * 1000).toLocaleString("pt-BR")
        });
        setMessage("✅ Usuário encontrado!");
      } else {
        setUserInfo(null);
        setMessage("❌ Usuário não encontrado");
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Erro ao buscar usuário");
    }
  };

  // Verificar automaticamente quando conectar
  useEffect(() => {
    if (isConnected) {
      checkSelf();
    }
  }, [isConnected]);

  return (
    <div style={styles.container}>
      <PixelBanner />
      
      {/* NOVO: Introdução do Projeto */}
      <ProjectIntroduction />
      
      <WalletConnect />
      
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <div style={{ ...styles.grid, ...styles.grid2, gap: "24px" }}>
          
          {/* Coluna 1: Registrar Usuário */}
          <div style={styles.card}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
              <span style={{ fontSize: "24px" }}>🌼</span>
              <h1 style={{ fontSize: "24px", fontWeight: "bold", color: "#1a3c1a", margin: 0 }}>
                Cadastro de Usuário
              </h1>
            </div>

            {message && (
              <div style={{
                padding: "12px",
                borderRadius: "8px",
                marginBottom: "16px",
                background: message.includes("❌") ? "#ffebee" : "#e8f5e9",
                border: message.includes("❌") ? "2px solid #f44336" : "2px solid #4caf50",
                color: message.includes("❌") ? "#c62828" : "#2e7d32",
                fontSize: "14px"
              }}>
                {message}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ fontWeight: "600", marginBottom: "8px", display: "block" }}>
                  Tipo de Conta
                </label>
                <select 
                  value={tipoConta} 
                  onChange={(e) => setTipoConta(e.target.value)}
                  style={styles.input}
                  disabled={loading}
                >
                  <option value="1">🐕 Doador - Posso cadastrar pets para adoção</option>
                  <option value="2">🐾 Adotante - Quero adotar pets</option>
                </select>
              </div>

              <button 
                onClick={handleRegister}
                disabled={loading || !isConnected}
                style={{
                  ...styles.button,
                  width: "100%",
                  opacity: (!isConnected || loading) ? 0.5 : 1
                }}
              >
                {loading ? "⏳ Processando..." : 
                 !isConnected ? "🔒 Conecte a Carteira" : 
                 "✅ Registrar Usuário"}
              </button>
            </div>
          </div>

          {/* Coluna 2: Consultar Usuário */}
          <div style={styles.card}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
              <span style={{ fontSize: "24px" }}>🔍</span>
              <h1 style={{ fontSize: "24px", fontWeight: "bold", color: "#1a3c1a", margin: 0 }}>
                Consultar Usuário
              </h1>
            </div>

            <input 
              placeholder="Digite o endereço da carteira (0x...)" 
              value={walletConsulta} 
              onChange={(e) => setWalletConsulta(e.target.value)} 
              style={styles.input}
            />
            
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              <button 
                onClick={getUser} 
                disabled={!walletConsulta.trim()}
                style={{
                  ...styles.button,
                  flex: 1,
                  opacity: !walletConsulta.trim() ? 0.5 : 1
                }}
              >
                📋 Buscar Dados
              </button>
              
              <button 
                onClick={checkSelf} 
                disabled={!isConnected}
                style={{
                  ...styles.secondaryButton,
                  flex: 1,
                  opacity: !isConnected ? 0.5 : 1
                }}
              >
                👤 Ver Meu Cadastro
              </button>
            </div>

            {/* Resultados da consulta */}
            {userInfo && (
              <div style={{ 
                marginTop: "16px", 
                padding: "16px", 
                background: "white", 
                border: "2px solid #2ecc71",
                borderRadius: "8px"
              }}>
                <h3 style={{ color: "#27ae60", marginBottom: "12px", fontSize: "18px" }}>✅ Usuário Encontrado</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div>
                    <strong>👤 Carteira:</strong> 
                    <div style={{ 
                      fontFamily: "monospace", 
                      fontSize: "12px", 
                      background: "#f5f5f5", 
                      padding: "8px", 
                      borderRadius: "4px",
                      marginTop: "4px",
                      wordBreak: "break-all"
                    }}>
                      {userInfo.wallet}
                    </div>
                  </div>
                  <div>
                    <strong>🎯 Tipo:</strong> 
                    <span style={{ 
                      color: userInfo.tipo === 1 ? "#e67e22" : "#2ecc71",
                      fontWeight: "bold",
                      marginLeft: "8px"
                    }}>
                      {userInfo.tipo === 1 ? "🐕 Doador" : "🐾 Adotante"}
                    </span>
                  </div>
                  <div><strong>📅 Data de Registro:</strong> {userInfo.data}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// -----------------
// Página Criar Pets
// ------------------
const CriarPets = ({ reloadPets }) => {
  const { address, isConnected } = useAccount();
  const [petForm, setPetForm] = useState({
    name: "",
    description: "",
    species: "cachorro",
    breed: "",
    age: "",
    size: "medio",
    gender: "macho",
    health: "saudavel",
    temperament: "calmo",
    location: "",
    imageUrl: "",
    imageFile: null,
    imagePreview: ""
  });
  const [message, setMessage] = useState("");
  const [tokenURI, setTokenURI] = useState("");
  const [creating, setCreating] = useState(false);

  const handlePetFormChange = (e) => {
    const { name, value } = e.target;
    setPetForm(prev => ({ ...prev, [name]: value }));
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setPetForm(prev => ({
        ...prev,
        imageFile: file,
        imagePreview: reader.result,
        imageUrl: ""
      }));
    };
    reader.readAsDataURL(file);
  };

  const resetPetForm = () => {
    setPetForm({
      name: "", description: "", species: "cachorro", breed: "", age: "",
      size: "medio", gender: "macho", health: "saudavel", temperament: "calmo",
      location: "", imageUrl: "", imageFile: null, imagePreview: ""
    });
    setTokenURI("");
  };

  const createMetadata = async () => {
    if (!isConnected || !address) {
      setMessage("❌ Conecte a carteira primeiro");
      return null;
    }
    
    if (!petForm.name || !petForm.description) {
      setMessage("❌ Nome e descrição são obrigatórios");
      return null;
    }

    setCreating(true);
    setMessage("⏳ Preparando metadata...");

    try {
      const metadata = await MetadataService.generateMetadata(petForm);
      const uri = await MetadataService.uploadToIPFS(metadata);
      
      setTokenURI(uri);
      setMessage("✅ Metadata pronta! Clique em 'Criar NFT' para continuar.");
      setCreating(false);
      return uri;
      
    } catch (err) {
      setMessage(`❌ Erro ao criar metadata: ${err.message}`);
      setCreating(false);
      return null;
    }
  };

  const handleCreatePet = async () => {
    try {
      if (!tokenURI) {
        const uri = await createMetadata();
        if (uri) setTokenURI(uri);
        return;
      }

      // Mint: usar ethers com signer
      if (!isConnected || !address) {
        setMessage("❌ Conecte a carteira antes de mintar");
        return;
      }

      setCreating(true);
      setMessage("🔐 Solicitando assinatura para mint...");

      const contract = await getSignerContract(PETS_CONTRACT_ABI, PETS_CONTRACT_ADDRESS);
      const tx = await contract.mintPet(address, tokenURI);
      
      setMessage(`⏳ Transação enviada: ${tx.hash}. Aguardando confirmação...`);
      await tx.wait();
      
      setMessage("🎉 Pet NFT criado com sucesso!");
      resetPetForm();
      setTokenURI("");
      if (reloadPets) setTimeout(() => reloadPets(), 1500);
    } catch (err) {
      console.error("Erro mint:", err);
      setMessage(`❌ Erro ao criar NFT: ${err?.message || String(err)}`);
    } finally {
      setCreating(false);
    }
  };

  const isLoading = creating;

  return (
    <div style={styles.container}>
      <PixelBanner />
      <WalletConnect />
      
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <div style={styles.card}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
            <span style={{ fontSize: "32px" }}>🐕</span>
            <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#1a3c1a", margin: 0 }}>
              Cadastrar Novo Pet
            </h1>
            <span style={{
              background: "#4caf50",
              color: "white",
              padding: "4px 12px",
              borderRadius: "12px",
              fontSize: "12px",
              fontWeight: "bold"
            }}>
              {!tokenURI ? "📝 Passo 1: Metadata" : "🚀 Passo 2: Blockchain"}
            </span>
          </div>

          {message && (
            <div style={{
              padding: "16px",
              borderRadius: "12px",
              marginBottom: "24px",
              background: message.includes("❌") ? "#ffebee" : "#e8f5e9",
              border: message.includes("❌") ? "2px solid #f44336" : "2px solid #4caf50",
              color: message.includes("❌") ? "#c62828" : "#2e7d32"
            }}>
              {message}
            </div>
          )}

          {tokenURI && (
            <div style={{
              padding: "12px",
              background: "#e3f2fd",
              border: "2px solid #2196f3",
              borderRadius: "8px",
              marginBottom: "16px",
              textAlign: "center"
            }}>
              <span style={{ fontWeight: "bold", color: "#0d47a1" }}>
                ✅ Metadata pronta!
              </span>
              <div style={{
                fontSize: "12px",
                fontFamily: "monospace",
                background: "white",
                padding: "6px",
                borderRadius: "4px",
                marginTop: "4px",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}>
                {tokenURI.substring(0, 60)}...
              </div>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ ...styles.grid, gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))" }}>
              <div>
                <label style={{ fontWeight: "600", marginBottom: "8px", display: "block" }}>Nome *</label>
                <input
                  name="name"
                  value={petForm.name}
                  onChange={handlePetFormChange}
                  style={styles.input}
                  placeholder="Ex: Rex, Luna"
                  required
                  disabled={isLoading || !!tokenURI}
                />
              </div>
              
              <div>
                <label style={{ fontWeight: "600", marginBottom: "8px", display: "block" }}>Espécie</label>
                <select 
                  name="species" 
                  value={petForm.species} 
                  onChange={handlePetFormChange} 
                  style={styles.input}
                  disabled={isLoading || !!tokenURI}
                >
                  <option value="cachorro">🐕 Cachorro</option>
                  <option value="gato">🐈 Gato</option>
                  <option value="outro">🐾 Outro</option>
                </select>
              </div>

              <div>
                <label style={{ fontWeight: "600", marginBottom: "8px", display: "block" }}>Raça</label>
                <input
                  name="breed"
                  value={petForm.breed}
                  onChange={handlePetFormChange}
                  style={styles.input}
                  placeholder="Ex: Vira-lata"
                  disabled={isLoading || !!tokenURI}
                />
              </div>
              
              <div>
                <label style={{ fontWeight: "600", marginBottom: "8px", display: "block" }}>Idade</label>
                <input
                  name="age"
                  value={petForm.age}
                  onChange={handlePetFormChange}
                  style={styles.input}
                  placeholder="Ex: 2 anos"
                  disabled={isLoading || !!tokenURI}
                />
              </div>
              
              <div>
                <label style={{ fontWeight: "600", marginBottom: "8px", display: "block" }}>Porte</label>
                <select 
                  name="size" 
                  value={petForm.size} 
                  onChange={handlePetFormChange} 
                  style={styles.input}
                  disabled={isLoading || !!tokenURI}
                >
                  <option value="pequeno">Pequeno</option>
                  <option value="medio">Médio</option>
                  <option value="grande">Grande</option>
                </select>
              </div>
              
              <div>
                <label style={{ fontWeight: "600", marginBottom: "8px", display: "block" }}>Gênero</label>
                <select 
                  name="gender" 
                  value={petForm.gender} 
                  onChange={handlePetFormChange} 
                  style={styles.input}
                  disabled={isLoading || !!tokenURI}
                >
                  <option value="macho">Macho</option>
                  <option value="femea">Fêmea</option>
                </select>
              </div>
              
              <div>
                <label style={{ fontWeight: "600", marginBottom: "8px", display: "block" }}>Saúde</label>
                <select 
                  name="health" 
                  value={petForm.health} 
                  onChange={handlePetFormChange} 
                  style={styles.input}
                  disabled={isLoading || !!tokenURI}
                >
                  <option value="saudavel">Saudável</option>
                  <option value="tratamento">Em tratamento</option>
                  <option value="especial">Cuidados especiais</option>
                </select>
              </div>
              
              <div>
                <label style={{ fontWeight: "600", marginBottom: "8px", display: "block" }}>Temperamento</label>
                <select 
                  name="temperament" 
                  value={petForm.temperament} 
                  onChange={handlePetFormChange} 
                  style={styles.input}
                  disabled={isLoading || !!tokenURI}
                >
                  <option value="calmo">Calmo</option>
                  <option value="ativo">Ativo</option>
                  <option value="timido">Tímido</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontWeight: "600", marginBottom: "8px", display: "block" }}>Localização</label>
              <input
                name="location"
                value={petForm.location}
                onChange={handlePetFormChange}
                style={styles.input}
                placeholder="Ex: São Paulo, SP"
                disabled={isLoading || !!tokenURI}
              />
            </div>

            <div>
              <label style={{ fontWeight: "600", marginBottom: "8px", display: "block" }}>
                Imagem do Pet
              </label>
              <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                {petForm.imagePreview ? (
                  <div style={{ position: "relative" }}>
                    <img 
                      src={petForm.imagePreview} 
                      alt="Preview" 
                      style={{
                        width: "100px",
                        height: "100px",
                        objectFit: "cover",
                        borderRadius: "8px",
                        border: "2px solid #a5d6a7"
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setPetForm(prev => ({ ...prev, imageFile: null, imagePreview: "" }))}
                      style={{
                        position: "absolute",
                        top: "-8px",
                        right: "-8px",
                        background: "#f44336",
                        color: "white",
                        border: "none",
                        borderRadius: "50%",
                        width: "24px",
                        height: "24px",
                        cursor: "pointer",
                        fontSize: "12px"
                      }}
                      disabled={isLoading || !!tokenURI}
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div style={{
                    width: "100px",
                    height: "100px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#f4f6f8",
                    borderRadius: "8px",
                    border: "2px dashed #a5d6a7",
                    color: "#7f8c8d"
                  }}>
                    🐾
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    disabled={isLoading || !!tokenURI}
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "2px solid #c8e6c9",
                      borderRadius: "8px",
                      background: "white"
                    }}
                  />
                  <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                    Ou insira uma URL da imagem:
                  </div>
                  <input
                    name="imageUrl"
                    value={petForm.imageUrl}
                    onChange={handlePetFormChange}
                    style={{ ...styles.input, marginBottom: "0", fontSize: "14px" }}
                    placeholder="https://exemplo.com/imagem.jpg"
                    disabled={isLoading || !!tokenURI || petForm.imageFile}
                  />
                </div>
              </div>
            </div>

            <div>
              <label style={{ fontWeight: "600", marginBottom: "8px", display: "block" }}>
                Descrição do Pet * (máx 250 caracteres)
              </label>
              <textarea
                name="description"
                value={petForm.description}
                onChange={handlePetFormChange}
                maxLength={250}
                rows={4}
                style={styles.input}
                placeholder="Conte sobre a personalidade, história, hábitos..."
                required
                disabled={isLoading || !!tokenURI}
              />
              <div style={{ textAlign: "right", fontSize: "14px", color: "#2e7d32", marginTop: "4px" }}>
                {petForm.description.length}/250 caracteres
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button 
                type="button" 
                onClick={resetPetForm}
                style={styles.secondaryButton}
                disabled={isLoading}
              >
                🔄 {tokenURI ? "Cancelar" : "Limpar"}
              </button>

              <button 
                type="button"
                onClick={handleCreatePet}
                disabled={isLoading || !isConnected || !petForm.name || !petForm.description}
                style={{
                  ...styles.button,
                  opacity: (isLoading || !isConnected || !petForm.name || !petForm.description) ? 0.5 : 1,
                  background: tokenURI ? "#2196f3" : "#4caf50"
                }}
              >
                {isLoading ? (
                  <>
                    <span style={{ marginRight: "8px" }}>⏳</span>
                    Processando...
                  </>
                ) : tokenURI ? "🚀 Criar NFT" : "📝 Preparar Metadata"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ------------------
// Página 3 — Adotar Pets
// ------------------
const AdotarPets = ({ pets, reloadPets }) => {
  const { address, isConnected } = useAccount();
  const [message, setMessage] = useState("");
  const [viewMode, setViewMode] = useState("disponiveis");
  const [solicitandoId, setSolicitandoId] = useState(null);
  const [busy, setBusy] = useState(false);

  const solicitarAdocao = async (tokenId) => {
    if (!isConnected) {
      setMessage("❌ Conecte a carteira primeiro");
      return;
    }
    try {
      setSolicitandoId(tokenId);
      setBusy(true);
      setMessage("🔐 Solicitando adoção - assine na carteira...");
      
      const contract = await getSignerContract(PETS_CONTRACT_ABI, PETS_CONTRACT_ADDRESS);
      const tx = await contract.requestAdoption(tokenId);
      
      setMessage(`⏳ Tx enviada: ${tx.hash} — aguardando confirmação...`);
      await tx.wait();
      
      setMessage("✅ Solicitação enviada!");
      if (reloadPets) setTimeout(() => reloadPets(), 1500);
    } catch (err) {
      console.error("Erro requestAdoption:", err);
      setMessage(`❌ Erro: ${err?.message || String(err)}`);
    } finally {
      setSolicitandoId(null);
      setBusy(false);
    }
  };

  const getFilteredPets = () => {
    if (!pets || pets.length === 0) return [];

    switch (viewMode) {
      case "disponiveis":
        return pets.filter(pet => {
          if (!pet.owner || !address) return false;
          const isNotOwnedByUser = pet.owner.toLowerCase() !== address.toLowerCase();
          const hasNoRequest = !pet.requester;
          return isNotOwnedByUser && hasNoRequest;
        });

      case "todos":
        return pets;

      case "meus":
        return pets.filter(pet => 
          pet.owner && address && 
          pet.owner.toLowerCase() === address.toLowerCase()
        );

      default:
        return pets;
    }
  };

  const filteredPets = getFilteredPets();

  const shortAddr = (addr = "") => {
    if (!addr || addr === "0x0000000000000000000000000000000000000000") return "Sem dono";
    return `${addr.substring(0,6)}...${addr.substring(addr.length - 4)}`;
  };

  const getPetStatus = (pet) => {
    if (!pet.owner || !address) return "🔍 Carregando...";
    
    const isOwnedByUser = pet.owner.toLowerCase() === address.toLowerCase();
    const hasRequest = pet.requester;

    if (isOwnedByUser) {
      return hasRequest ? "📨 Tem solicitação" : "👑 Meu pet";
    } else {
      return hasRequest ? "⏳ Em processo" : "✅ Disponível";
    }
  };

  return (
    <div style={styles.container}>
      <PixelBanner />
      <WalletConnect />
      
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <span style={{ fontSize: "32px" }}>🐕</span>
          <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#1a3c1a", margin: 0 }}>
            Explorar Pets
          </h1>
          <span style={{
            background: "#4caf50",
            color: "white",
            padding: "4px 12px",
            borderRadius: "12px",
            fontSize: "14px",
            fontWeight: "bold"
          }}>
            {filteredPets.length} pets
          </span>
        </div>

        <div style={{
          background: "#e8f5e9",
          border: "2px solid #a5d6a7",
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "20px"
        }}>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              onClick={() => setViewMode("disponiveis")}
              style={{
                ...styles.button,
                background: viewMode === "disponiveis" ? "#4caf50" : "#81c784",
                fontSize: "14px",
                padding: "10px 16px"
              }}
            >
              🏠 Disponíveis
            </button>
            <button
              onClick={() => setViewMode("todos")}
              style={{
                ...styles.button,
                background: viewMode === "todos" ? "#2196f3" : "#64b5f6",
                fontSize: "14px",
                padding: "10px 16px"
              }}
            >
              📋 Todos
            </button>
            <button
              onClick={() => setViewMode("meus")}
              style={{
                ...styles.button,
                background: viewMode === "meus" ? "#ff9800" : "#ffb74d",
                fontSize: "14px",
                padding: "10px 16px"
              }}
            >
              ❤️ Meus
            </button>
          </div>
        </div>

        {message && (
          <div style={{
            padding: "16px",
            borderRadius: "12px",
            marginBottom: "20px",
            background: message.includes("❌") ? "#ffebee" : "#e8f5e9",
            border: message.includes("❌") ? "2px solid #f44336" : "2px solid #4caf50",
            color: message.includes("❌") ? "#c62828" : "#2e7d32"
          }}>
            {message}
          </div>
        )}

        <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            onClick={reloadPets}
            style={styles.secondaryButton}
          >
            🔄 Atualizar Lista
          </button>
          <span style={{ fontSize: '14px', color: '#2e7d32' }}>
            Mostrando {filteredPets.length} de {pets.length} pets
          </span>
        </div>

        {filteredPets.length === 0 ? (
          <div style={styles.card}>
            <div style={{ textAlign: "center", padding: "40px" }}>
              <span style={{ fontSize: "64px" }}>
                {viewMode === "disponiveis" ? "🏠" : 
                 viewMode === "meus" ? "❤️" : "📋"}
              </span>
              <h2 style={{ fontSize: "24px", fontWeight: "bold", color: "#1a3c1a", margin: "16px 0 8px 0" }}>
                {pets.length === 0 ? "Nenhum pet cadastrado" : 
                 viewMode === "disponiveis" ? "Nenhum pet disponível" :
                 viewMode === "meus" ? "Você não tem pets" : "Nenhum pet encontrado"}
              </h2>
              <p style={{ color: "#2e7d32", marginBottom: "20px" }}>
                {pets.length === 0 
                  ? "Cadastre o primeiro pet na página 'Criar Pets'!" 
                  : viewMode === "disponiveis" 
                    ? "Todos os pets já foram adotados ou têm solicitações."
                    : viewMode === "meus"
                      ? "Você ainda não cadastrou nenhum pet."
                      : "Tente outro modo de visualização."}
              </p>
              {viewMode === "disponiveis" && pets.length > 0 && (
                <button
                  onClick={() => setViewMode("todos")}
                  style={styles.button}
                >
                  👀 Ver Todos os Pets
                </button>
              )}
            </div>
          </div>
        ) : (
          <div style={{ ...styles.grid, ...styles.grid3 }}>
            {filteredPets.map(pet => {
              const status = getPetStatus(pet);
              const isOwnedByUser = address && pet.owner && 
                pet.owner.toLowerCase() === address.toLowerCase();
              const hasRequest = pet.requester;
              const canAdopt = !isOwnedByUser && !hasRequest;
              const isLoading = solicitandoId === pet.id && busy;

              return (
                <div key={pet.id} style={{
                  ...styles.card,
                  border: isOwnedByUser ? "2px solid #ff9800" : "2px solid #c8e6c9",
                  background: isOwnedByUser ? "#fff3e0" : "white",
                  position: "relative"
                }}>
                  <div style={{
                    position: "absolute",
                    top: "12px",
                    right: "12px",
                    background: 
                      status.includes("✅") ? "#4caf50" :
                      status.includes("⏳") ? "#ff9800" :
                      status.includes("👑") ? "#ff5722" : "#9e9e9e",
                    color: "white",
                    padding: "4px 8px",
                    borderRadius: "12px",
                    fontSize: "11px",
                    fontWeight: "bold",
                    zIndex: 1
                  }}>
                    {status}
                  </div>

                  {pet.metadata.image ? (
                    <img
                      src={pet.metadata.image}
                      alt={pet.metadata.name || `Pet ${pet.id}`}
                      style={{
                        width: "100%",
                        height: "200px",
                        objectFit: "cover",
                        borderRadius: "12px",
                        marginBottom: "16px",
                        border: "2px solid #a5d6a7"
                      }}
                    />
                  ) : (
                    <div style={{
                      width: "100%",
                      height: "200px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "#f4f6f8",
                      borderRadius: "12px",
                      marginBottom: "16px",
                      border: "2px solid #a5d6a7",
                      color: "#7f8c8d"
                    }}>
                      🐾 Sem imagem
                    </div>
                  )}
                  
                  <h3 style={{ fontSize: "20px", fontWeight: "bold", color: "#1a3c1a", margin: "0 0 8px 0" }}>
                    {pet.metadata.name || `Pet #${pet.id}`}
                  </h3>
                  <p style={{ 
                    color: "#2e7d32", 
                    fontSize: "14px", 
                    margin: "0 0 16px 0",
                    minHeight: "60px"
                  }}>
                    {pet.metadata.description || "Sem descrição"}
                  </p>
                  
                  <div style={{ 
                    display: "grid", 
                    gridTemplateColumns: "1fr 1fr", 
                    gap: "8px", 
                    marginBottom: "16px" 
                  }}>
                    {Array.isArray(pet.metadata.attributes) && pet.metadata.attributes.slice(0, 4).map((attr, idx) => (
                      attr.value && (
                        <div key={idx} style={{ fontSize: "12px" }}>
                          <span style={{ fontWeight: "600" }}>{attr.trait_type}:</span>
                          <div style={{ color: "#1a3c1a" }}>
                            {attr.value}
                          </div>
                        </div>
                      )
                    ))}
                  </div>

                  <div style={{ fontSize: "12px", color: "#2e7d32", marginBottom: "16px" }}>
                    <div>👤 Dono: {shortAddr(pet.owner)}</div>
                    {hasRequest && (
                      <div>📨 Solicitado por: {shortAddr(pet.requester)}</div>
                    )}
                  </div>

                  {canAdopt ? (
                    <button
                      onClick={() => solicitarAdocao(pet.id)}
                      disabled={isLoading || !isConnected}
                      style={{
                        ...styles.button,
                        width: "100%",
                        opacity: (!isConnected || isLoading) ? 0.5 : 1
                      }}
                    >
                      {isLoading ? "⏳ Solicitando..." : "📮 Solicitar Adoção"}
                    </button>
                  ) : isOwnedByUser ? (
                    <div style={{
                      padding: "12px",
                      background: "#fff3e0",
                      border: "1px solid #ffb74d",
                      borderRadius: "8px",
                      textAlign: "center",
                      fontSize: "14px",
                      color: "#e65100",
                      fontWeight: "600"
                    }}>
                      👑 Este é seu pet
                    </div>
                  ) : (
                    <div style={{
                      padding: "12px",
                      background: "#f5f5f5",
                      border: "1px solid #9e9e9e",
                      borderRadius: "8px",
                      textAlign: "center",
                      fontSize: "14px",
                      color: "#616161"
                    }}>
                      ⏳ Adoção em andamento
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ------------------
// Página 4 — Solicitações para DOADOR
// ------------------
const Solicitacoes = ({ pets, reloadPets }) => {
  const { address, isConnected } = useAccount();
  const [message, setMessage] = useState("");
  const [aprovandoId, setAprovandoId] = useState(null);
  const [rejeitandoId, setRejeitandoId] = useState(null);

  const aprovarAdocao = async (tokenId) => {
    if (!isConnected) {
      setMessage("❌ Conecte a carteira primeiro");
      return;
    }
    
    try {
      setAprovandoId(tokenId);
      setMessage("🔐 Aprovando - assine na carteira...");
      
      const contract = await getSignerContract(PETS_CONTRACT_ABI, PETS_CONTRACT_ADDRESS);
      const tx = await contract.approveAdoption(tokenId);
      
      setMessage(`⏳ Tx enviada: ${tx.hash}`);
      await tx.wait();
      
      setMessage("✅ Adoção aprovada!");
      if (reloadPets) setTimeout(() => reloadPets(), 1500);
    } catch (err) {
      console.error("Erro approveAdoption:", err);
      setMessage(`❌ Erro: ${err?.message || String(err)}`);
    } finally {
      setAprovandoId(null);
    }
  };

  const rejeitarAdocao = async (tokenId) => {
    if (!isConnected) {
      setMessage("❌ Conecte a carteira primeiro");
      return;
    }
    
    try {
      setRejeitandoId(tokenId);
      setMessage("🔐 Rejeitando - assine na carteira...");
      
      const contract = await getSignerContract(PETS_CONTRACT_ABI, PETS_CONTRACT_ADDRESS);
      const tx = await contract.rejectAdoption(tokenId);
      
      setMessage(`⏳ Tx enviada: ${tx.hash}`);
      await tx.wait();
      
      setMessage("✅ Solicitação rejeitada!");
      if (reloadPets) setTimeout(() => reloadPets(), 1500);
    } catch (err) {
      console.error("Erro rejectAdoption:", err);
      setMessage(`❌ Erro: ${err?.message || String(err)}`);
    } finally {
      setRejeitandoId(null);
    }
  };

  // Filtrar pets do usuário com solicitações pendentes
  const petsComSolicitacoes = pets.filter(pet => {
    if (!pet.owner || !address || !pet.requester) return false;
    return pet.owner.toLowerCase() === address.toLowerCase() && pet.requester;
  });

  const shortAddr = (addr = "") => {
    if (!addr) return "";
    return `${addr.substring(0,6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <div style={styles.container}>
      <PixelBanner />
      <WalletConnect />
      
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <span style={{ fontSize: "32px" }}>📋</span>
          <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#1a3c1a", margin: 0 }}>
            Solicitações de Adoção
          </h1>
          <span style={{
            background: petsComSolicitacoes.length > 0 ? "#ff9800" : "#4caf50",
            color: "white",
            padding: "4px 12px",
            borderRadius: "12px",
            fontSize: "14px",
            fontWeight: "bold"
          }}>
            {petsComSolicitacoes.length} pendentes
          </span>
        </div>

        <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            onClick={reloadPets}
            style={styles.secondaryButton}
          >
            🔄 Atualizar Lista
          </button>
          <span style={{ fontSize: '14px', color: '#2e7d32' }}>
            Clique para atualizar após aprovar ou rejeitar
          </span>
        </div>

        {message && (
          <div style={{
            padding: "16px",
            borderRadius: "12px",
            marginBottom: "24px",
            background: message.includes("❌") ? "#ffebee" : "#e8f5e9",
            border: message.includes("❌") ? "2px solid #f44336" : "2px solid #4caf50",
            color: message.includes("❌") ? "#c62828" : "#2e7d32"
          }}>
            {message}
          </div>
        )}

        {petsComSolicitacoes.length === 0 ? (
          <div style={styles.card}>
            <div style={{ textAlign: "center", padding: "48px" }}>
              <span style={{ fontSize: "64px" }}>✅</span>
              <h2 style={{ fontSize: "24px", fontWeight: "bold", color: "#1a3c1a", margin: "16px 0 8px 0" }}>
                Nenhuma solicitação pendente
              </h2>
              <p style={{ color: "#2e7d32" }}>
                Seus pets ainda não receberam solicitações de adoção.
                Quando receberem, elas aparecerão aqui.
              </p>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {petsComSolicitacoes.map(pet => (
              <div key={pet.id} style={styles.card}>
                <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
                  {pet.metadata.image ? (
                    <img
                      src={pet.metadata.image}
                      alt={pet.metadata.name}
                      style={{
                        width: "120px",
                        height: "120px",
                        objectFit: "cover",
                        borderRadius: "12px",
                        border: "2px solid #a5d6a7"
                      }}
                    />
                  ) : (
                    <div style={{
                      width: "120px",
                      height: "120px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "#f4f6f8",
                      borderRadius: "12px",
                      border: "2px solid #a5d6a7",
                      color: "#7f8c8d"
                    }}>
                      🐾
                    </div>
                  )}
                  
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: "22px", fontWeight: "bold", color: "#1a3c1a", margin: "0 0 8px 0" }}>
                      {pet.metadata.name || `Pet #${pet.id}`}
                    </h3>
                    <p style={{ color: "#2e7d32", margin: "0 0 12px 0" }}>
                      {pet.metadata.description || "Sem descrição"}
                    </p>
                    
                    <div style={{
                      background: "#fff3cd",
                      border: "2px solid #ffd54f",
                      borderRadius: "8px",
                      padding: "12px",
                      marginBottom: "12px"
                    }}>
                      <div style={{ fontWeight: "600", color: "#856404", marginBottom: "4px" }}>
                        📧 Solicitação de adoção:
                      </div>
                      <div style={{
                        fontFamily: "monospace",
                        fontSize: "14px",
                        background: "white",
                        padding: "6px 10px",
                        borderRadius: "6px",
                        border: "1px solid #ffd54f"
                      }}>
                        {shortAddr(pet.requester)}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                      {Array.isArray(pet.metadata.attributes) && pet.metadata.attributes.slice(0, 3).map((attr, idx) => (
                        attr.value && (
                          <div key={idx} style={{ fontSize: "13px" }}>
                            <span style={{ fontWeight: "600" }}>{attr.trait_type}:</span>
                            <div style={{ color: "#1a3c1a" }}>{attr.value}</div>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: "140px" }}>
                    <button
                      onClick={() => aprovarAdocao(pet.id)}
                      disabled={aprovandoId === pet.id || rejeitandoId}
                      style={{
                        ...styles.button,
                        whiteSpace: "nowrap",
                        background: "#4caf50",
                        fontSize: "14px",
                        padding: "10px 12px",
                        opacity: (aprovandoId === pet.id || rejeitandoId) ? 0.5 : 1
                      }}
                    >
                      {aprovandoId === pet.id ? "⏳ Aprovando..." : "✅ Aprovar"}
                    </button>
                    
                    <button
                      onClick={() => rejeitarAdocao(pet.id)}
                      disabled={rejeitandoId === pet.id || aprovandoId}
                      style={{
                        ...styles.button,
                        whiteSpace: "nowrap",
                        background: "#f44336",
                        fontSize: "14px",
                        padding: "10px 12px",
                        opacity: (rejeitandoId === pet.id || aprovandoId) ? 0.5 : 1
                      }}
                    >
                      {rejeitandoId === pet.id ? "⏳ Rejeitando..." : "❌ Rejeitar"}
                    </button>
                    
                    <div style={{ fontSize: "12px", color: "#666", textAlign: "center" }}>
                      ID: #{pet.id}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ------------------
// Página 5 — Minhas Adoções
// ------------------
const MinhasAdocoes = ({ pets }) => {
  const { address } = useAccount();
  
  // Filtrar pets adotados pelo usuário
  const meusPets = pets.filter(pet => 
    pet.owner && address && 
    pet.owner.toLowerCase() === address.toLowerCase()
  );

  const shortAddr = (addr = "") => {
    if (!addr) return "";
    return `${addr.substring(0,6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <div style={styles.container}>
      <PixelBanner />
      <WalletConnect />
      
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
          <span style={{ fontSize: "32px" }}>🐕</span>
          <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#1a3c1a", margin: 0 }}>
            Meus Pets Adotados
          </h1>
          <span style={{
            background: "#4caf50",
            color: "white",
            padding: "4px 12px",
            borderRadius: "12px",
            fontSize: "14px",
            fontWeight: "bold"
          }}>
            {meusPets.length} pets
          </span>
        </div>

        {meusPets.length === 0 ? (
          <div style={styles.card}>
            <div style={{ textAlign: "center", padding: "48px" }}>
              <span style={{ fontSize: "64px" }}>🐈</span>
              <h2 style={{ fontSize: "24px", fontWeight: "bold", color: "#1a3c1a", margin: "16px 0 8px 0" }}>
                Nenhum pet adotado
              </h2>
              <p style={{ color: "#2e7d32" }}>
                Você ainda não adotou nenhum pet. Visite a página de adoção para encontrar seu novo amigo!
              </p>
            </div>
          </div>
        ) : (
          <div style={{ ...styles.grid, ...styles.grid3 }}>
            {meusPets.map(pet => (
              <div key={pet.id} style={styles.card}>
                {pet.metadata.image ? (
                  <img
                    src={pet.metadata.image}
                    alt={pet.metadata.name || `Pet ${pet.id}`}
                    style={{
                      width: "100%",
                      height: "200px",
                      objectFit: "cover",
                      borderRadius: "12px",
                      marginBottom: "16px",
                      border: "2px solid #a5d6a7"
                    }}
                  />
                ) : (
                  <div style={{
                    width: "100%",
                    height: "200px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#f4f6f8",
                    borderRadius: "12px",
                    marginBottom: "16px",
                    border: "2px solid #a5d6a7",
                    color: "#7f8c8d"
                  }}>
                    🐾 Sem imagem
                  </div>
                )}
                
                <h3 style={{ fontSize: "20px", fontWeight: "bold", color: "#1a3c1a", margin: "0 0 8px 0" }}>
                  {pet.metadata.name || `Pet #${pet.id}`}
                </h3>
                <p style={{ color: "#2e7d32", fontSize: "14px", margin: "0 0 16px 0" }}>
                  {pet.metadata.description || "-"}
                </p>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "16px" }}>
                  {Array.isArray(pet.metadata.attributes) && pet.metadata.attributes.slice(0, 4).map((attr, idx) => (
                    attr.value && (
                      <div key={idx} style={{ fontSize: "12px" }}>
                        <span style={{ fontWeight: "600" }}>{attr.trait_type}:</span>
                        <div style={{ color: "#1a3c1a" }}>{attr.value}</div>
                      </div>
                    )
                  ))}
                </div>
                
                <div style={{
                  marginTop: "16px",
                  padding: "12px",
                  background: "#e8f5e9",
                  borderRadius: "8px",
                  border: "1px solid #a5d6a7"
                }}>
                  <div style={{ fontSize: "12px", fontWeight: "600", color: "#1a3c1a" }}>ID do Pet:</div>
                  <div style={{ fontFamily: "monospace", fontSize: "14px" }}>#{pet.id}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ------------------
// Componente Principal (FINAL)
// ------------------
function PatasConfiaDApp() {
  const [currentPage, setCurrentPage] = useState("registro");
  const { pets, loading, reloadPets } = useLoadPets();

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "registro":
        return <Registro />;
      case "criar":
        return <CriarPets reloadPets={reloadPets} />;
      case "adotar":
        return <AdotarPets pets={pets} reloadPets={reloadPets} />;
      case "solicitacoes":
        return <Solicitacoes pets={pets} reloadPets={reloadPets} />;
      case "adocoes":
        return <MinhasAdocoes pets={pets} />;
      default:
        return <Registro />;
    }
  };

  return (
    <div style={styles.container}>
      <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} />

      <div style={{
        textAlign: "center",
        marginBottom: "16px",
        padding: "12px",
        background: "#e8f5e9",
        borderRadius: "12px",
        border: "2px solid #a5d6a7",
        fontWeight: "bold",
        color: "#2e7d32"
      }}>
        <span>🐾 Total de Pets: {pets.length}</span>

        <button 
          onClick={reloadPets}
          style={{
            ...styles.secondaryButton,
            marginLeft: "16px",
            fontSize: "12px",
            padding: "6px 12px"
          }}
        >
          🔄 Atualizar
        </button>
      </div>

      {loading && (
        <div style={{
          padding: "40px",
          textAlign: "center",
          background: "#e8f5e9",
          borderRadius: "12px",
          margin: "20px auto",
          maxWidth: "600px"
        }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔄</div>
          <div>Carregando pets...</div>
        </div>
      )}

      {renderCurrentPage()}
    </div>
  );
}

export default PatasConfiaDApp;
