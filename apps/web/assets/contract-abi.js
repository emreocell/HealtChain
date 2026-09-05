window.MEDICAL_RECORD_REGISTRY_ABI = [
  "function setProviderAuthorization(address provider, bool authorized)",
  "function isProviderAuthorized(address patient, address provider) view returns (bool)",
  "function addRecord(address patient, bytes32 dataHash) returns (uint256 recordIndex)",
  "function revokeRecord(address patient, uint256 recordIndex)",
  "function getRecordCount(address patient) view returns (uint256)",
  "function getRecord(address patient, uint256 recordIndex) view returns (bytes32 dataHash, address author, uint64 createdAt, bool revoked)",
  "event ProviderAuthorizationChanged(address indexed patient, address indexed provider, bool authorized)",
  "event RecordAdded(address indexed patient, uint256 indexed recordIndex, bytes32 indexed dataHash, address author, uint64 createdAt)",
  "event RecordRevoked(address indexed patient, uint256 indexed recordIndex, bytes32 indexed dataHash)"
];
