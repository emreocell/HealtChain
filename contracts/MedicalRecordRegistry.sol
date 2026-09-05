// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title MedicalRecordRegistry
/// @notice Research-oriented integrity registry for off-chain medical records.
/// @dev Never store plaintext medical data, record categories, or personally identifiable information on-chain.
contract MedicalRecordRegistry {
    error ZeroAddress();
    error EmptyHash();
    error UnauthorizedWriter();
    error DuplicateRecord();
    error RecordNotFound();
    error RecordAlreadyRevoked();
    error OnlyPatient();

    struct Record {
        bytes32 dataHash;
        address author;
        uint64 createdAt;
        bool revoked;
    }

    mapping(address patient => mapping(address provider => bool authorized)) private providerAuthorizations;
    mapping(address patient => Record[] records) private patientRecords;
    mapping(address patient => mapping(bytes32 dataHash => bool exists)) private knownRecordHashes;

    event ProviderAuthorizationChanged(
        address indexed patient,
        address indexed provider,
        bool authorized
    );

    event RecordAdded(
        address indexed patient,
        uint256 indexed recordIndex,
        bytes32 indexed dataHash,
        address author,
        uint64 createdAt
    );

    event RecordRevoked(
        address indexed patient,
        uint256 indexed recordIndex,
        bytes32 indexed dataHash
    );

    function setProviderAuthorization(address provider, bool authorized) external {
        if (provider == address(0)) revert ZeroAddress();

        providerAuthorizations[msg.sender][provider] = authorized;
        emit ProviderAuthorizationChanged(msg.sender, provider, authorized);
    }

    function isProviderAuthorized(address patient, address provider) external view returns (bool) {
        return providerAuthorizations[patient][provider];
    }

    function addRecord(address patient, bytes32 dataHash) external returns (uint256 recordIndex) {
        if (patient == address(0)) revert ZeroAddress();
        if (dataHash == bytes32(0)) revert EmptyHash();
        if (msg.sender != patient && !providerAuthorizations[patient][msg.sender]) {
            revert UnauthorizedWriter();
        }
        if (knownRecordHashes[patient][dataHash]) revert DuplicateRecord();

        uint64 createdAt = uint64(block.timestamp);
        recordIndex = patientRecords[patient].length;
        patientRecords[patient].push(
            Record({
                dataHash: dataHash,
                author: msg.sender,
                createdAt: createdAt,
                revoked: false
            })
        );
        knownRecordHashes[patient][dataHash] = true;

        emit RecordAdded(patient, recordIndex, dataHash, msg.sender, createdAt);
    }

    function revokeRecord(address patient, uint256 recordIndex) external {
        if (msg.sender != patient) revert OnlyPatient();
        if (recordIndex >= patientRecords[patient].length) revert RecordNotFound();

        Record storage record = patientRecords[patient][recordIndex];
        if (record.revoked) revert RecordAlreadyRevoked();

        record.revoked = true;
        emit RecordRevoked(patient, recordIndex, record.dataHash);
    }

    function getRecordCount(address patient) external view returns (uint256) {
        return patientRecords[patient].length;
    }

    function getRecord(address patient, uint256 recordIndex) external view returns (Record memory) {
        if (recordIndex >= patientRecords[patient].length) revert RecordNotFound();
        return patientRecords[patient][recordIndex];
    }
}
