pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract KiwiSign is ERC721URIStorage {
	
	using ECDSA for bytes32;
	using Counters for Counters.Counter;
	Counters.Counter public contract_id;
	Counters.Counter private poa_id;

	uint private constant IPFS_CID_LEN = 46;

	event ContractRegistered (uint contract_id, string metadata);
	event ContractSigned (uint contract_id, string input, address signer);

	mapping (uint256 => string) private contract_metadata;
	mapping (uint256 => address) private contract_key;

	constructor() ERC721("KiwiSignPoAV0", "KSPoAV0") {}
	
	function getCurrentContractId() external view returns(uint) {
		return contract_id.current();
	}

	function createContract(string calldata metadata, address public_key) external returns(uint256) {
		require(bytes(metadata).length == IPFS_CID_LEN, 'invalid metadata CID');

		contract_id.increment();
		contract_metadata[contract_id.current()] = metadata;
		contract_key[contract_id.current()] = public_key;

		emit ContractRegistered(contract_id.current(), metadata);
		return contract_id.current();
	}

	function verifySignature(bytes calldata signature, uint256 id, string calldata input_cid) external returns(bool) {
		require(bytes(input_cid).length == IPFS_CID_LEN, 'invalid input CID');

		// the signature verification implicitly assures the contract_id (id) is valid
		address pub_address = this.getSigner(this.createSignatureHash(msg.sender, id), signature);
		require(pub_address == contract_key[id], "signature verification failed");

		poa_id.increment();
		uint256 new_poa_id = uint256(keccak256(abi.encodePacked(
			msg.sender, poa_id.current(), block.timestamp
		)));

		_mint(msg.sender, new_poa_id);
		_setTokenURI(new_poa_id, this.bytes32ToString(keccak256(abi.encode(id))));

		emit ContractSigned(id, input_cid, msg.sender);
		return true;
	}

	function getMetadataFromContractId(uint256 id) external view returns(string memory) {
		return contract_metadata[id];
	}
	
	function createSignatureHash(address signer, uint256 id) external pure returns(bytes32) {
		return keccak256(abi.encodePacked(signer, id));
	}

	function bytes32ToString(bytes32 _bytes32) public pure returns (string memory) {
			uint8 i = 0;
			while(i < 32 && _bytes32[i] != 0) {
					i++;
			}
			bytes memory bytesArray = new bytes(i);
			for (i = 0; i < 32 && _bytes32[i] != 0; i++) {
					bytesArray[i] = _bytes32[i];
			}
			return string(bytesArray);
	}

	function getSigner(bytes32 _hash, bytes memory _signature) public pure returns (address){
		bytes32 r;
		bytes32 s;
		uint8 v;

		if (_signature.length != 65) {
			return address(0);
		}

		assembly {
			r := mload(add(_signature, 32))
			s := mload(add(_signature, 64))
			v := byte(0, mload(add(_signature, 96)))
		}
		if (v < 27) {
			v += 27;
		}
		if (v != 27 && v != 28) {
			return address(0);
		} else {
			return ecrecover(keccak256(
				abi.encodePacked("\x19Ethereum Signed Message:\n32", _hash)
			), v, r, s);
		}
  }
} 
