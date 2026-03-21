// SPDX-License-Identifier: MIT
// Aluna: Jamilly Ferreira Rodrigues - 241024571 

pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract PatasConfiaUsers {
    using Counters for Counters.Counter;

    enum TipoDaConta {
        None,     // nenhuma selecionada
        doador,   // selecionada tipo 1
        adotante  // selecionada tipo 2
    }

    struct User {
        address wallet;    // endereço da carteira 
        TipoDaConta tipo;  // o tipo da conta
        uint data;         // data de criação da conta  
    }

    mapping(address => User) public users;   // armazena usuarios 
    Counters.Counter private _userCount;

    event UserCreated(address indexed wallet, TipoDaConta tipo, uint data);

    function isUserRegistered(address _wallet) public view returns (bool) {
        return users[_wallet].tipo != TipoDaConta.None;
    }

    function RegisterUser(TipoDaConta _tipo) public {
        require(_tipo != TipoDaConta.None, "Tipo da conta invalido");
        require(users[msg.sender].tipo == TipoDaConta.None, "Usuario ja cadastrado");

        users[msg.sender] = User(msg.sender, _tipo, block.timestamp);
        _userCount.increment();
        
        emit UserCreated(msg.sender, _tipo, block.timestamp);
    }

    function getUser(address _wallet) public view returns (User memory) {
        return users[_wallet];
    }

    function getTotalUsers() public view returns (uint256) {
        return _userCount.current();
    }
}

contract PetsNFT is ERC721URIStorage {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIds;
    PatasConfiaUsers public usersContract;

    // Eventos
    event PetMinted(uint256 tokenId, address indexed owner, string tokenURI);
    event PetAdopted(uint256 tokenId, address from, address to);
    event AdoptionRequested(uint256 tokenId, address requester);
    event AdoptionApproved(uint256 tokenId, address from, address to);
    event AdoptionRejected(uint256 tokenId, address requester);

    // Mapeamentos
    mapping(uint256 => address) public adoptionRequests;

    constructor(address _usersContractAddress) ERC721("PatasConfiaPet", "PCPET") {
        usersContract = PatasConfiaUsers(_usersContractAddress);
    }

    // VERIFICAÇÃO: Apenas doadores registrados podem criar pets
    function mintPet(address _to, string memory _tokenURI) public {
        PatasConfiaUsers.User memory user = usersContract.getUser(msg.sender);
        require(user.tipo == PatasConfiaUsers.TipoDaConta.doador, "Apenas doadores registrados podem criar NFTs");
        require(_to != address(0), "Endereco de destino invalido");

        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        
        _safeMint(_to, newTokenId);
        _setTokenURI(newTokenId, _tokenURI);

        emit PetMinted(newTokenId, _to, _tokenURI);
    }

    // VERIFICAÇÃO: Apenas adotantes registrados podem solicitar adoção
    function requestAdoption(uint256 tokenId) public {
        require(_ownerOf(tokenId) != address(0), "Pet inexistente");
        require(adoptionRequests[tokenId] == address(0), "Ja existe uma solicitacao para este pet");
        
        PatasConfiaUsers.User memory user = usersContract.getUser(msg.sender);
        require(user.tipo == PatasConfiaUsers.TipoDaConta.adotante, "Apenas adotantes registrados podem solicitar adocao");
        require(ownerOf(tokenId) != msg.sender, "Voce nao pode solicitar adocao do seu proprio pet");

        adoptionRequests[tokenId] = msg.sender;
        emit AdoptionRequested(tokenId, msg.sender);
    }

    // VERIFICAÇÃO: Apenas doadores registrados podem aprovar adoção
    function approveAdoption(uint256 tokenId) public {
        address requester = adoptionRequests[tokenId];
        require(requester != address(0), "Nao ha solicitacao de adocao para este pet");
        
        address owner = ownerOf(tokenId);
        require(msg.sender == owner, "Apenas o dono do pet pode aprovar a adocao");
        
        PatasConfiaUsers.User memory ownerUser = usersContract.getUser(msg.sender);
        require(ownerUser.tipo == PatasConfiaUsers.TipoDaConta.doador, "Apenas doadores registrados podem aprovar adocoes");

        // Transferir o pet para o adotante
        _safeTransfer(owner, requester, tokenId, "");
        
        // Limpar a solicitação
        adoptionRequests[tokenId] = address(0);
        
        emit AdoptionApproved(tokenId, owner, requester);
        emit PetAdopted(tokenId, owner, requester);
    }

    //  VERIFICAÇÃO: Apenas doadores registrados podem rejeitar adoção
    function rejectAdoption(uint256 tokenId) public {
        require(_ownerOf(tokenId) != address(0), "Pet inexistente");
        require(ownerOf(tokenId) == msg.sender, "Apenas o dono do pet pode rejeitar a adocao");
        require(adoptionRequests[tokenId] != address(0), "Nenhuma solicitacao pendente para este pet");
        
        PatasConfiaUsers.User memory ownerUser = usersContract.getUser(msg.sender);
        require(ownerUser.tipo == PatasConfiaUsers.TipoDaConta.doador, "Apenas doadores registrados podem rejeitar adocoes");

        address requester = adoptionRequests[tokenId];
        
        // Limpar a solicitação
        adoptionRequests[tokenId] = address(0);

        emit AdoptionRejected(tokenId, requester);
    }

    // Funções de visualização
    function totalsupply() public view returns (uint256) {
        return _tokenIds.current();
    }
   
    


    function getAdoptionRequester(uint256 tokenId) public view returns (address) {
        return adoptionRequests[tokenId];
    }

    function hasPendingAdoption(uint256 tokenId) public view returns (bool) {
        return adoptionRequests[tokenId] != address(0);
    }

  

    // Função de teste para leitura de usuário
    function testReadUser(address _wallet) public view returns (address, uint8, uint256) {
        PatasConfiaUsers.User memory u = usersContract.getUser(_wallet);
        return (u.wallet, uint8(u.tipo), u.data);
    }
}