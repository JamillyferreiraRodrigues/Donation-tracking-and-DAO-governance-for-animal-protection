// src/PatasConfiaDApp.jsx 
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { 
  useAccount, 
  useBalance, 
  useConnect, 
  useDisconnect,
  useContractRead
} from "wagmi";
import { 
  USERS_CONTRACT_ADDRESS, 
  USERS_CONTRACT_ABI, 
  PETS_CONTRACT_ADDRESS, 
  PETS_CONTRACT_ABI 
} from "./config";
import { useLoadPets } from "./hooks/useLoadPets";

// ------------------
// Pinata/IPFS Service
// ------------------
class MetadataService {
  static async generateMetadata(petData) {
    console.log("📝 Generating metadata for:", petData.name);
    
    let imageUrl = petData.imageUrl;
    
    if (petData.imageFile) {
      console.log("🖼️ Processing image...");
      try {
        imageUrl = await this.uploadImageToIPFS(petData.imageFile);
        console.log("✅ Image processed:", imageUrl);
      } catch (error) {
        console.error("❌ Error processing image:", error);
      }
    }

    const metadata = {
      name: petData.name,
      description: petData.description,
      image: imageUrl || "https://via.placeholder.com/400x400/4caf50/ffffff?text=Pet+No+Image",
      attributes: [
        { trait_type: "Species", value: petData.species },
        { trait_type: "Breed", value: petData.breed || "Mixed" },
        { trait_type: "Age", value: petData.age || "Not informed" },
        { trait_type: "Size", value: petData.size },
        { trait_type: "Gender", value: petData.gender },
        { trait_type: "Health", value: petData.health },
        { trait_type: "Temperament", value: petData.temperament },
        { trait_type: "Location", value: petData.location || "Not informed" },
      ],
      created_at: new Date().toISOString()
    };

    console.log("📄 Metadata generated:", metadata);
    return metadata;
  }

  static async uploadImageToIPFS(imageFile) {
    try {
      const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;
      
      if (!PINATA_JWT) {
        console.warn("⚠️ PINATA_JWT not configured. Using fallback...");
        return null;
      }

      const formData = new FormData();
      formData.append('file', imageFile);

      console.log("📤 Uploading image to Pinata...");
      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PINATA_JWT}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Pinata Error:", errorText);
        throw new Error(`HTTP Error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("📸 Image saved to IPFS:", data.IpfsHash);
      return `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`;
    } catch (error) {
      console.error('❌ Error uploading image:', error);
      return null;
    }
  }

  static async uploadToIPFS(metadata) {
    try {
      const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;
      
      if (!PINATA_JWT) {
        console.warn("⚠️ PINATA_JWT not configured. Using base64 fallback...");
        const jsonString = JSON.stringify(metadata);
        const base64Data = btoa(unescape(encodeURIComponent(jsonString)));
        return `data:application/json;base64,${base64Data}`;
      }

      console.log("📤 Uploading metadata to Pinata...");
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
        console.error("❌ Pinata Error:", errorText);
        throw new Error(`HTTP Error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("✅ Metadata saved to IPFS:", data.IpfsHash);
      return `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`;
    } catch (error) {
      console.error('❌ Error uploading to IPFS:', error);
      const jsonString = JSON.stringify(metadata);
      const base64Data = btoa(unescape(encodeURIComponent(jsonString)));
      return `data:application/json;base64,${base64Data}`;
    }
  }
}

// ------------------
// Styles
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
// Shared Components
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
          🐾 Donation Tracking & DAO Governance for Animal Protection
        </h1>
        <p style={{ color: "#2e7d32", margin: 0 }}>Transparent Donation Management • Community Governance • Animal Welfare</p>
      </div>
      <span style={{ fontSize: "48px" }}>🐈</span>
    </div>
  </div>
);

// ------------------
// Project Introduction Component
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
        Welcome to Donation Tracking & DAO Governance
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
        🌟 <strong>Our Mission:</strong> Eliminate donation trust issues through blockchain transparency. 
        Anyone in the world can participate by donating and becoming part of the governance process, 
        ensuring every contribution reaches animals in need.
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
          <div style={{ fontSize: "32px", marginBottom: "8px" }}>💰</div>
          <h3 style={{ fontSize: "16px", fontWeight: "bold", color: "#1a3c1a", marginBottom: "8px" }}>
            Transparent Donations
          </h3>
          <p style={{ fontSize: "14px", color: "#2e7d32" }}>
            Every donation is recorded on-chain - trace where your money goes
          </p>
        </div>
        
        <div style={{
          background: "white",
          borderRadius: "12px",
          padding: "16px",
          border: "2px solid #a5d6a7"
        }}>
          <div style={{ fontSize: "32px", marginBottom: "8px" }}>🗳️</div>
          <h3 style={{ fontSize: "16px", fontWeight: "bold", color: "#1a3c1a", marginBottom: "8px" }}>
            DAO Governance
          </h3>
          <p style={{ fontSize: "14px", color: "#2e7d32" }}>
            Donors vote on fund allocation and protection initiatives
          </p>
        </div>
        
        <div style={{
          background: "white",
          borderRadius: "12px",
          padding: "16px",
          border: "2px solid #a5d6a7"
        }}>
          <div style={{ fontSize: "32px", marginBottom: "8px" }}>🌍</div>
          <h3 style={{ fontSize: "16px", fontWeight: "bold", color: "#1a3c1a", marginBottom: "8px" }}>
            Global Participation
          </h3>
          <p style={{ fontSize: "14px", color: "#2e7d32" }}>
            Anyone from anywhere can donate and help animals worldwide
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
          ⚠️ <strong>Why Blockchain?</strong> Complete transparency eliminates the question 
          "Where does my donation go?" - every transaction is verifiable and traceable.
        </p>
      </div>
      
      <div style={{ marginTop: "24px", fontSize: "14px", color: "#388e3c" }}>
        <span style={{ fontSize: "24px" }}>🌿</span>
        <p style={{ margin: "8px 0" }}>
          <strong>How it works:</strong> Register → Donate → Participate in DAO votes → 
          Track fund allocation → Help animals worldwide!
        </p>
      </div>
    </div>
  </div>
);

const WalletConnect = () => {
  const { address, isConnected } = useAccount();
  const { data: balance, isLoading: isBalanceLoading } = useBalance({ 
    address,
    chainId: 11155111,
  });
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
            Balance: {isBalanceLoading ? "Loading..." : `${balance?.formatted?.slice(0, 6) || "0"} ${balance?.symbol || "ETH"}`}
          </span>
          <button
            onClick={() => disconnect()}
            style={{
              ...styles.secondaryButton,
              whiteSpace: "nowrap"
            }}
          >
            Disconnect
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
          🌿 Connect {connector.name}
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
      🌼 Register
    </button>
    <button 
      onClick={() => setCurrentPage("criar")}
      style={{
        ...styles.navLink,
        background: currentPage === "criar" ? "#a5d6a7" : "#e8f5e9"
      }}
    >
      🐕 Register Pets
    </button>
    <button 
      onClick={() => setCurrentPage("adotar")}
      style={{
        ...styles.navLink,
        background: currentPage === "adotar" ? "#a5d6a7" : "#e8f5e9"
      }}
    >
      🏠 Adopt
    </button>
    <button 
      onClick={() => setCurrentPage("solicitacoes")}
      style={{
        ...styles.navLink,
        background: currentPage === "solicitacoes" ? "#a5d6a7" : "#e8f5e9"
      }}
    >
      📋 Requests
    </button>
    <button 
      onClick={() => setCurrentPage("adocoes")}
      style={{
        ...styles.navLink,
        background: currentPage === "adocoes" ? "#a5d6a7" : "#e8f5e9"
      }}
    >
      ❤️ My Adoptions
    </button>
  </nav>
);

// ------------------
// UTIL: Create contract with signer
// ------------------
const getSignerContract = async (abi, address) => {
  if (!window.ethereum) throw new Error("Wallet not found (window.ethereum)");
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  return new ethers.Contract(address, abi, signer);
};

// ------------------
// Page 1 — User Registration 
// ------------------
const Registro = () => {
  const { address, isConnected } = useAccount();
  const [tipoConta, setTipoConta] = useState("1");
  const [message, setMessage] = useState("");
  const [walletConsulta, setWalletConsulta] = useState("");
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  // Usando wagmi para ler o contrato
  const { data: userData, refetch: refetchUserData } = useContractRead({
    address: USERS_CONTRACT_ADDRESS,
    abi: USERS_CONTRACT_ABI,
    functionName: "getUser",
    args: [address],
    enabled: false,
    chainId: 11155111,
  });

  const { data: queriedUserData, refetch: refetchQueriedUser, isLoading: isLoadingQueried } = useContractRead({
    address: USERS_CONTRACT_ADDRESS,
    abi: USERS_CONTRACT_ABI,
    functionName: "getUser",
    args: [walletConsulta],
    enabled: false,
    chainId: 11155111,
  });

  // Register user with ethers
  const handleRegister = async () => {
    if (!isConnected) {
      setMessage("❌ Connect wallet first");
      return;
    }
    
    try {
      setLoading(true);
      setMessage("🔐 Requesting signature...");
      
      const contract = await getSignerContract(USERS_CONTRACT_ABI, USERS_CONTRACT_ADDRESS);
      const tx = await contract.RegisterUser(parseInt(tipoConta));
      
      setMessage(`⏳ Transaction sent: ${tx.hash}`);
      await tx.wait();
      
      setMessage("✅ User registered successfully!");
      refetchUserData();
    } catch (err) {
      console.error("Registration error:", err);
      setMessage(`❌ Error: ${err?.message || String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  // Check if current user is registered
  const checkSelf = async () => {
    if (!isConnected) {
      setMessage("❌ Connect wallet first");
      return;
    }

    try {
      setLoading(true);
      setMessage("🔍 Fetching user data...");
      
      const result = await refetchUserData();
      
      if (result.data && result.data.wallet !== "0x0000000000000000000000000000000000000000") {
        setUserInfo({
          wallet: result.data.wallet,
          tipo: Number(result.data.tipo),
          data: new Date(Number(result.data.data) * 1000).toLocaleString(),
        });
        setMessage("✅ User found!");
      } else {
        setUserInfo(null);
        setMessage("❌ You are not registered");
      }
    } catch (err) {
      console.error(err);
      setUserInfo(null);
      setMessage("❌ Error fetching user");
    } finally {
      setLoading(false);
    }
  };

  // Query another user
  const getUser = async () => {
    if (!walletConsulta.trim()) {
      setMessage("❌ Enter a wallet address");
      return;
    }

    try {
      setLoading(true);
      setMessage("🔍 Searching for user...");
      
      const result = await refetchQueriedUser();
      
      if (result.data && result.data.wallet !== "0x0000000000000000000000000000000000000000") {
        setUserInfo({
          wallet: result.data.wallet,
          tipo: Number(result.data.tipo),
          data: new Date(Number(result.data.data) * 1000).toLocaleString(),
        });
        setMessage("✅ User found!");
      } else {
        setUserInfo(null);
        setMessage("❌ User not found");
      }
    } catch (err) {
      console.error(err);
      setUserInfo(null);
      setMessage(`❌ Error: ${err?.message || "Failed to fetch user"}`);
    } finally {
      setLoading(false);
    }
  };

  // Auto-check when connected
  useEffect(() => {
    if (isConnected) {
      checkSelf();
    }
  }, [isConnected]);

  return (
    <div style={styles.container}>
      <PixelBanner />
      <ProjectIntroduction />
      <WalletConnect />
      
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <div style={{ ...styles.grid, ...styles.grid2, gap: "24px" }}>
          
          {/* Column 1: Register User */}
          <div style={styles.card}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
              <span style={{ fontSize: "24px" }}>🌼</span>
              <h1 style={{ fontSize: "24px", fontWeight: "bold", color: "#1a3c1a", margin: 0 }}>
                User Registration
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
                  Account Type
                </label>
                <select 
                  value={tipoConta} 
                  onChange={(e) => setTipoConta(e.target.value)}
                  style={styles.input}
                  disabled={loading}
                >
                  <option value="1">🐕 Donor - Can register pets for adoption</option>
                  <option value="2">🐾 Adopter - Want to adopt pets</option>
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
                {loading ? "⏳ Processing..." : 
                 !isConnected ? "🔒 Connect Wallet" : 
                 "✅ Register User"}
              </button>
            </div>
          </div>

          {/* Column 2: Query User */}
          <div style={styles.card}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
              <span style={{ fontSize: "24px" }}>🔍</span>
              <h1 style={{ fontSize: "24px", fontWeight: "bold", color: "#1a3c1a", margin: 0 }}>
                Query User
              </h1>
            </div>

            <input 
              placeholder="Enter wallet address (0x...)" 
              value={walletConsulta} 
              onChange={(e) => setWalletConsulta(e.target.value)} 
              style={styles.input}
            />
            
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              <button 
                onClick={getUser} 
                disabled={!walletConsulta.trim() || loading}
                style={{
                  ...styles.button,
                  flex: 1,
                  opacity: (!walletConsulta.trim() || loading) ? 0.5 : 1
                }}
              >
                {loading ? "⏳ Searching..." : "📋 Search User"}
              </button>
              
              <button 
                onClick={checkSelf} 
                disabled={!isConnected || loading}
                style={{
                  ...styles.secondaryButton,
                  flex: 1,
                  opacity: (!isConnected || loading) ? 0.5 : 1
                }}
              >
                {loading ? "⏳ Loading..." : "👤 Check My Registration"}
              </button>
            </div>

            {/* Query Results */}
            {userInfo && (
              <div style={{ 
                marginTop: "16px", 
                padding: "16px", 
                background: "white", 
                border: "2px solid #2ecc71",
                borderRadius: "8px"
              }}>
                <h3 style={{ color: "#27ae60", marginBottom: "12px", fontSize: "18px" }}>✅ User Found</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div>
                    <strong>👤 Wallet:</strong> 
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
                    <strong>🎯 Type:</strong> 
                    <span style={{ 
                      color: userInfo.tipo === 1 ? "#e67e22" : "#2ecc71",
                      fontWeight: "bold",
                      marginLeft: "8px"
                    }}>
                      {userInfo.tipo === 1 ? "🐕 Donor" : "🐾 Adopter"}
                    </span>
                  </div>
                  <div><strong>📅 Registration Date:</strong> {userInfo.data}</div>
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
// Page: Register Pets
// ------------------
const CriarPets = ({ reloadPets }) => {
  const { address, isConnected } = useAccount();
  const [petForm, setPetForm] = useState({
    name: "",
    description: "",
    species: "dog",
    breed: "",
    age: "",
    size: "medium",
    gender: "male",
    health: "healthy",
    temperament: "calm",
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
      name: "", description: "", species: "dog", breed: "", age: "",
      size: "medium", gender: "male", health: "healthy", temperament: "calm",
      location: "", imageUrl: "", imageFile: null, imagePreview: ""
    });
    setTokenURI("");
  };

  const createMetadata = async () => {
    if (!isConnected || !address) {
      setMessage("❌ Connect wallet first");
      return null;
    }
    
    if (!petForm.name || !petForm.description) {
      setMessage("❌ Name and description are required");
      return null;
    }

    setCreating(true);
    setMessage("⏳ Preparing metadata...");

    try {
      const metadata = await MetadataService.generateMetadata(petForm);
      const uri = await MetadataService.uploadToIPFS(metadata);
      
      setTokenURI(uri);
      setMessage("✅ Metadata ready! Click 'Create NFT' to continue.");
      setCreating(false);
      return uri;
      
    } catch (err) {
      setMessage(`❌ Error creating metadata: ${err.message}`);
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

      if (!isConnected || !address) {
        setMessage("❌ Connect wallet before minting");
        return;
      }

      setCreating(true);
      setMessage("🔐 Requesting signature for mint...");

      const contract = await getSignerContract(PETS_CONTRACT_ABI, PETS_CONTRACT_ADDRESS);
      const tx = await contract.mintPet(address, tokenURI);
      
      setMessage(`⏳ Transaction sent: ${tx.hash}. Waiting for confirmation...`);
      await tx.wait();
      
      setMessage("🎉 Pet NFT created successfully!");
      resetPetForm();
      setTokenURI("");
      if (reloadPets) setTimeout(() => reloadPets(), 1500);
    } catch (err) {
      console.error("Mint error:", err);
      setMessage(`❌ Error creating NFT: ${err?.message || String(err)}`);
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
              Register New Pet
            </h1>
            <span style={{
              background: "#4caf50",
              color: "white",
              padding: "4px 12px",
              borderRadius: "12px",
              fontSize: "12px",
              fontWeight: "bold"
            }}>
              {!tokenURI ? "📝 Step 1: Metadata" : "🚀 Step 2: Blockchain"}
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
                ✅ Metadata ready!
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
                <label style={{ fontWeight: "600", marginBottom: "8px", display: "block" }}>Name *</label>
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
                <label style={{ fontWeight: "600", marginBottom: "8px", display: "block" }}>Species</label>
                <select 
                  name="species" 
                  value={petForm.species} 
                  onChange={handlePetFormChange} 
                  style={styles.input}
                  disabled={isLoading || !!tokenURI}
                >
                  <option value="dog">🐕 Dog</option>
                  <option value="cat">🐈 Cat</option>
                  <option value="other">🐾 Other</option>
                </select>
              </div>

              <div>
                <label style={{ fontWeight: "600", marginBottom: "8px", display: "block" }}>Breed</label>
                <input
                  name="breed"
                  value={petForm.breed}
                  onChange={handlePetFormChange}
                  style={styles.input}
                  placeholder="Ex: Mixed breed"
                  disabled={isLoading || !!tokenURI}
                />
              </div>
              
              <div>
                <label style={{ fontWeight: "600", marginBottom: "8px", display: "block" }}>Age</label>
                <input
                  name="age"
                  value={petForm.age}
                  onChange={handlePetFormChange}
                  style={styles.input}
                  placeholder="Ex: 2 years"
                  disabled={isLoading || !!tokenURI}
                />
              </div>
              
              <div>
                <label style={{ fontWeight: "600", marginBottom: "8px", display: "block" }}>Size</label>
                <select 
                  name="size" 
                  value={petForm.size} 
                  onChange={handlePetFormChange} 
                  style={styles.input}
                  disabled={isLoading || !!tokenURI}
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>
              
              <div>
                <label style={{ fontWeight: "600", marginBottom: "8px", display: "block" }}>Gender</label>
                <select 
                  name="gender" 
                  value={petForm.gender} 
                  onChange={handlePetFormChange} 
                  style={styles.input}
                  disabled={isLoading || !!tokenURI}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              
              <div>
                <label style={{ fontWeight: "600", marginBottom: "8px", display: "block" }}>Health</label>
                <select 
                  name="health" 
                  value={petForm.health} 
                  onChange={handlePetFormChange} 
                  style={styles.input}
                  disabled={isLoading || !!tokenURI}
                >
                  <option value="healthy">Healthy</option>
                  <option value="treatment">In treatment</option>
                  <option value="special">Special needs</option>
                </select>
              </div>
              
              <div>
                <label style={{ fontWeight: "600", marginBottom: "8px", display: "block" }}>Temperament</label>
                <select 
                  name="temperament" 
                  value={petForm.temperament} 
                  onChange={handlePetFormChange} 
                  style={styles.input}
                  disabled={isLoading || !!tokenURI}
                >
                  <option value="calm">Calm</option>
                  <option value="active">Active</option>
                  <option value="shy">Shy</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontWeight: "600", marginBottom: "8px", display: "block" }}>Location</label>
              <input
                name="location"
                value={petForm.location}
                onChange={handlePetFormChange}
                style={styles.input}
                placeholder="Ex: New York, NY"
                disabled={isLoading || !!tokenURI}
              />
            </div>

            <div>
              <label style={{ fontWeight: "600", marginBottom: "8px", display: "block" }}>
                Pet Image
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
                    Or enter image URL:
                  </div>
                  <input
                    name="imageUrl"
                    value={petForm.imageUrl}
                    onChange={handlePetFormChange}
                    style={{ ...styles.input, marginBottom: "0", fontSize: "14px" }}
                    placeholder="https://example.com/image.jpg"
                    disabled={isLoading || !!tokenURI || petForm.imageFile}
                  />
                </div>
              </div>
            </div>

            <div>
              <label style={{ fontWeight: "600", marginBottom: "8px", display: "block" }}>
                Pet Description * (max 250 characters)
              </label>
              <textarea
                name="description"
                value={petForm.description}
                onChange={handlePetFormChange}
                maxLength={250}
                rows={4}
                style={styles.input}
                placeholder="Tell us about personality, history, habits..."
                required
                disabled={isLoading || !!tokenURI}
              />
              <div style={{ textAlign: "right", fontSize: "14px", color: "#2e7d32", marginTop: "4px" }}>
                {petForm.description.length}/250 characters
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button 
                type="button" 
                onClick={resetPetForm}
                style={styles.secondaryButton}
                disabled={isLoading}
              >
                🔄 {tokenURI ? "Cancel" : "Clear"}
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
                    Processing...
                  </>
                ) : tokenURI ? "🚀 Create NFT" : "📝 Prepare Metadata"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ------------------
// Page 3 — Adopt Pets
// ------------------
const AdotarPets = ({ pets, reloadPets }) => {
  const { address, isConnected } = useAccount();
  const [message, setMessage] = useState("");
  const [viewMode, setViewMode] = useState("available");
  const [solicitandoId, setSolicitandoId] = useState(null);
  const [busy, setBusy] = useState(false);

  const solicitarAdocao = async (tokenId) => {
    if (!isConnected) {
      setMessage("❌ Connect wallet first");
      return;
    }
    try {
      setSolicitandoId(tokenId);
      setBusy(true);
      setMessage("🔐 Requesting adoption - sign in wallet...");
      
      const contract = await getSignerContract(PETS_CONTRACT_ABI, PETS_CONTRACT_ADDRESS);
      const tx = await contract.requestAdoption(tokenId);
      
      setMessage(`⏳ Tx sent: ${tx.hash} — waiting for confirmation...`);
      await tx.wait();
      
      setMessage("✅ Request sent!");
      if (reloadPets) setTimeout(() => reloadPets(), 1500);
    } catch (err) {
      console.error("Error requestAdoption:", err);
      setMessage(`❌ Error: ${err?.message || String(err)}`);
    } finally {
      setSolicitandoId(null);
      setBusy(false);
    }
  };

  const getFilteredPets = () => {
    if (!pets || pets.length === 0) return [];

    switch (viewMode) {
      case "available":
        return pets.filter(pet => {
          if (!pet.owner || !address) return false;
          const isNotOwnedByUser = pet.owner.toLowerCase() !== address.toLowerCase();
          const hasNoRequest = !pet.requester;
          return isNotOwnedByUser && hasNoRequest;
        });

      case "all":
        return pets;

      case "mine":
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
    if (!addr || addr === "0x0000000000000000000000000000000000000000") return "No owner";
    return `${addr.substring(0,6)}...${addr.substring(addr.length - 4)}`;
  };

  const getPetStatus = (pet) => {
    if (!pet.owner || !address) return "🔍 Loading...";
    
    const isOwnedByUser = pet.owner.toLowerCase() === address.toLowerCase();
    const hasRequest = pet.requester;

    if (isOwnedByUser) {
      return hasRequest ? "📨 Has request" : "👑 My pet";
    } else {
      return hasRequest ? "⏳ In process" : "✅ Available";
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
            Explore Pets
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
              onClick={() => setViewMode("available")}
              style={{
                ...styles.button,
                background: viewMode === "available" ? "#4caf50" : "#81c784",
                fontSize: "14px",
                padding: "10px 16px"
              }}
            >
              🏠 Available
            </button>
            <button
              onClick={() => setViewMode("all")}
              style={{
                ...styles.button,
                background: viewMode === "all" ? "#2196f3" : "#64b5f6",
                fontSize: "14px",
                padding: "10px 16px"
              }}
            >
              📋 All
            </button>
            <button
              onClick={() => setViewMode("mine")}
              style={{
                ...styles.button,
                background: viewMode === "mine" ? "#ff9800" : "#ffb74d",
                fontSize: "14px",
                padding: "10px 16px"
              }}
            >
              ❤️ Mine
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
            🔄 Refresh List
          </button>
          <span style={{ fontSize: '14px', color: '#2e7d32' }}>
            Showing {filteredPets.length} of {pets.length} pets
          </span>
        </div>

        {filteredPets.length === 0 ? (
          <div style={styles.card}>
            <div style={{ textAlign: "center", padding: "40px" }}>
              <span style={{ fontSize: "64px" }}>
                {viewMode === "available" ? "🏠" : 
                 viewMode === "mine" ? "❤️" : "📋"}
              </span>
              <h2 style={{ fontSize: "24px", fontWeight: "bold", color: "#1a3c1a", margin: "16px 0 8px 0" }}>
                {pets.length === 0 ? "No pets registered" : 
                 viewMode === "available" ? "No available pets" :
                 viewMode === "mine" ? "You have no pets" : "No pets found"}
              </h2>
              <p style={{ color: "#2e7d32", marginBottom: "20px" }}>
                {pets.length === 0 
                  ? "Register the first pet on the 'Register Pets' page!" 
                  : viewMode === "available" 
                    ? "All pets have been adopted or have pending requests."
                    : viewMode === "mine"
                      ? "You haven't registered any pets yet."
                      : "Try another view mode."}
              </p>
              {viewMode === "available" && pets.length > 0 && (
                <button
                  onClick={() => setViewMode("all")}
                  style={styles.button}
                >
                  👀 View All Pets
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
                      🐾 No image
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
                    {pet.metadata.description || "No description"}
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
                    <div>👤 Owner: {shortAddr(pet.owner)}</div>
                    {hasRequest && (
                      <div>📨 Requested by: {shortAddr(pet.requester)}</div>
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
                      {isLoading ? "⏳ Requesting..." : "📮 Request Adoption"}
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
                      👑 This is your pet
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
                      ⏳ Adoption in progress
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
// Page 4 — Adoption Requests for DONORS
// ------------------
const Solicitacoes = ({ pets, reloadPets }) => {
  const { address, isConnected } = useAccount();
  const [message, setMessage] = useState("");
  const [aprovandoId, setAprovandoId] = useState(null);
  const [rejeitandoId, setRejeitandoId] = useState(null);

  const aprovarAdocao = async (tokenId) => {
    if (!isConnected) {
      setMessage("❌ Connect wallet first");
      return;
    }
    
    try {
      setAprovandoId(tokenId);
      setMessage("🔐 Approving - sign in wallet...");
      
      const contract = await getSignerContract(PETS_CONTRACT_ABI, PETS_CONTRACT_ADDRESS);
      const tx = await contract.approveAdoption(tokenId);
      
      setMessage(`⏳ Tx sent: ${tx.hash}`);
      await tx.wait();
      
      setMessage("✅ Adoption approved!");
      if (reloadPets) setTimeout(() => reloadPets(), 1500);
    } catch (err) {
      console.error("Error approveAdoption:", err);
      setMessage(`❌ Error: ${err?.message || String(err)}`);
    } finally {
      setAprovandoId(null);
    }
  };

  const rejeitarAdocao = async (tokenId) => {
    if (!isConnected) {
      setMessage("❌ Connect wallet first");
      return;
    }
    
    try {
      setRejeitandoId(tokenId);
      setMessage("🔐 Rejecting - sign in wallet...");
      
      const contract = await getSignerContract(PETS_CONTRACT_ABI, PETS_CONTRACT_ADDRESS);
      const tx = await contract.rejectAdoption(tokenId);
      
      setMessage(`⏳ Tx sent: ${tx.hash}`);
      await tx.wait();
      
      setMessage("✅ Request rejected!");
      if (reloadPets) setTimeout(() => reloadPets(), 1500);
    } catch (err) {
      console.error("Error rejectAdoption:", err);
      setMessage(`❌ Error: ${err?.message || String(err)}`);
    } finally {
      setRejeitandoId(null);
    }
  };

  // Filter user's pets with pending requests
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
            Adoption Requests
          </h1>
          <span style={{
            background: petsComSolicitacoes.length > 0 ? "#ff9800" : "#4caf50",
            color: "white",
            padding: "4px 12px",
            borderRadius: "12px",
            fontSize: "14px",
            fontWeight: "bold"
          }}>
            {petsComSolicitacoes.length} pending
          </span>
        </div>

        <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            onClick={reloadPets}
            style={styles.secondaryButton}
          >
            🔄 Refresh List
          </button>
          <span style={{ fontSize: '14px', color: '#2e7d32' }}>
            Click to refresh after approving or rejecting
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
                No pending requests
              </h2>
              <p style={{ color: "#2e7d32" }}>
                Your pets haven't received any adoption requests yet.
                When they do, they'll appear here.
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
                      {pet.metadata.description || "No description"}
                    </p>
                    
                    <div style={{
                      background: "#fff3cd",
                      border: "2px solid #ffd54f",
                      borderRadius: "8px",
                      padding: "12px",
                      marginBottom: "12px"
                    }}>
                      <div style={{ fontWeight: "600", color: "#856404", marginBottom: "4px" }}>
                        📧 Adoption request from:
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
                      {aprovandoId === pet.id ? "⏳ Approving..." : "✅ Approve"}
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
                      {rejeitandoId === pet.id ? "⏳ Rejecting..." : "❌ Reject"}
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
// Page 5 — My Adoptions
// ------------------
const MinhasAdocoes = ({ pets }) => {
  const { address } = useAccount();
  
  // Filter pets adopted by user
  const meusPets = pets.filter(pet => 
    pet.owner && address && 
    pet.owner.toLowerCase() === address.toLowerCase()
  );

  return (
    <div style={styles.container}>
      <PixelBanner />
      <WalletConnect />
      
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
          <span style={{ fontSize: "32px" }}>🐕</span>
          <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#1a3c1a", margin: 0 }}>
            My Adopted Pets
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
                No adopted pets yet
              </h2>
              <p style={{ color: "#2e7d32" }}>
                You haven't adopted any pets yet. Visit the adoption page to find your new friend!
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
                    🐾 No image
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
                  <div style={{ fontSize: "12px", fontWeight: "600", color: "#1a3c1a" }}>Pet ID:</div>
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
// Main Component
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
        <span>🐾 Total Pets: {pets.length}</span>

        <button 
          onClick={reloadPets}
          style={{
            ...styles.secondaryButton,
            marginLeft: "16px",
            fontSize: "12px",
            padding: "6px 12px"
          }}
        >
          🔄 Refresh
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
          <div>Loading pets...</div>
        </div>
      )}

      {renderCurrentPage()}
    </div>
  );
}

export default PatasConfiaDApp;
