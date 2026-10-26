// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title NameTag
 * @dev Decentralized username and identity registry on BOT Chain (Chain ID: 968).
 * Enables wallets to register unique usernames, resolve wallet addresses,
 * set metadata (display name, bio, avatar), and transfer or release names.
 */
contract NameTag {
    struct Profile {
        address owner;
        uint64 registeredAt;
        string displayName;
        string bio;
        string avatarURI; // IPFS, HTTP URL, or data URI
    }

    // Name => Profile mapping (normalized lowercase username without '@')
    mapping(string => Profile) private _names;

    // Address => Primary username
    mapping(address => string) private _primaryName;

    // Address => Array of owned usernames
    mapping(address => string[]) private _ownedNames;

    // Fast index lookup for owned names removal: name => index in _ownedNames[owner]
    mapping(string => uint256) private _ownedNameIndex;

    // Total registered names counter
    uint256 public totalRegistered;

    // Events
    event NameRegistered(string indexed nameIndexed, string name, address indexed owner, uint64 registeredAt);
    event ProfileUpdated(string indexed nameIndexed, string name, string displayName, string bio, string avatarURI);
    event NameTransferred(string indexed nameIndexed, string name, address indexed oldOwner, address indexed newOwner);
    event NameReleased(string indexed nameIndexed, string name, address indexed previousOwner);
    event PrimaryNameSet(address indexed owner, string name);

    // Custom Errors
    error EmptyName();
    error NameTooShort();
    error NameTooLong();
    error InvalidCharacter(bytes1 char);
    error AlreadyRegistered(string name);
    error NotRegistered(string name);
    error NotNameOwner(string name, address caller);
    error InvalidRecipient();
    error RecipientIsSelf();

    /**
     * @notice Clean and normalize a username (strip leading '@', check characters and length).
     * Only allows 'a'-'z', '0'-'9', and '_'.
     * Auto-converts uppercase 'A'-'Z' to lowercase.
     */
    function normalize(string memory rawName) public pure returns (string memory) {
        bytes memory rawBytes = bytes(rawName);
        uint256 len = rawBytes.length;

        // Skip leading '@' if provided
        uint256 startIndex = 0;
        if (len > 0 && rawBytes[0] == "@") {
            startIndex = 1;
        }

        uint256 effectiveLength = len - startIndex;
        if (effectiveLength == 0) revert EmptyName();
        if (effectiveLength < 3) revert NameTooShort();
        if (effectiveLength > 30) revert NameTooLong();

        bytes memory normalized = new bytes(effectiveLength);
        for (uint256 i = 0; i < effectiveLength; i++) {
            bytes1 b = rawBytes[startIndex + i];
            // Uppercase A-Z -> convert to a-z
            if (b >= 0x41 && b <= 0x5A) {
                normalized[i] = bytes1(uint8(b) + 32);
            }
            // Lowercase a-z, digits 0-9, or underscore '_'
            else if (
                (b >= 0x61 && b <= 0x7A) ||
                (b >= 0x30 && b <= 0x39) ||
                (b == 0x5F)
            ) {
                normalized[i] = b;
            } else {
                revert InvalidCharacter(b);
            }
        }

        return string(normalized);
    }

    /**
     * @notice Check if a username is available.
     */
    function isAvailable(string memory rawName) public view returns (bool) {
        bytes memory rawBytes = bytes(rawName);
        if (rawBytes.length == 0) return false;
        
        // Attempt safe normalization check
        try this.normalize(rawName) returns (string memory clean) {
            return _names[clean].owner == address(0);
        } catch {
            return false;
        }
    }

    /**
     * @notice Register a username for the sender. Free (gas only). Lifetime ownership.
     */
    function registerName(string calldata rawName) external {
        string memory cleanName = normalize(rawName);

        if (_names[cleanName].owner != address(0)) {
            revert AlreadyRegistered(cleanName);
        }

        uint64 timestamp = uint64(block.timestamp);

        _names[cleanName] = Profile({
            owner: msg.sender,
            registeredAt: timestamp,
            displayName: "",
            bio: "",
            avatarURI: ""
        });

        // Track ownership
        _ownedNameIndex[cleanName] = _ownedNames[msg.sender].length;
        _ownedNames[msg.sender].push(cleanName);

        // If user has no primary name yet, automatically set this one
        if (bytes(_primaryName[msg.sender]).length == 0) {
            _primaryName[msg.sender] = cleanName;
            emit PrimaryNameSet(msg.sender, cleanName);
        }

        totalRegistered++;

        emit NameRegistered(cleanName, cleanName, msg.sender, timestamp);
    }

    /**
     * @notice Resolve a username to its owner address and full profile.
     */
    function resolveName(string calldata rawName) external view returns (
        address owner,
        uint64 registeredAt,
        string memory displayName,
        string memory bio,
        string memory avatarURI
    ) {
        string memory cleanName = normalize(rawName);
        Profile memory p = _names[cleanName];
        return (p.owner, p.registeredAt, p.displayName, p.bio, p.avatarURI);
    }

    /**
     * @notice Get owner address only for a given name.
     */
    function getOwner(string calldata rawName) external view returns (address) {
        string memory cleanName = normalize(rawName);
        return _names[cleanName].owner;
    }

    /**
     * @notice Reverse lookup: resolve wallet address to its primary username.
     */
    function resolveAddress(address wallet) external view returns (string memory) {
        return _primaryName[wallet];
    }

    /**
     * @notice Set primary username for the caller.
     */
    function setPrimaryName(string calldata rawName) external {
        string memory cleanName = normalize(rawName);
        if (_names[cleanName].owner != msg.sender) {
            revert NotNameOwner(cleanName, msg.sender);
        }
        _primaryName[msg.sender] = cleanName;
        emit PrimaryNameSet(msg.sender, cleanName);
    }

    /**
     * @notice Update metadata profile for a registered name.
     */
    function updateProfile(
        string calldata rawName,
        string calldata displayName,
        string calldata bio,
        string calldata avatarURI
    ) external {
        string memory cleanName = normalize(rawName);
        if (_names[cleanName].owner != msg.sender) {
            revert NotNameOwner(cleanName, msg.sender);
        }

        Profile storage p = _names[cleanName];
        p.displayName = displayName;
        p.bio = bio;
        p.avatarURI = avatarURI;

        emit ProfileUpdated(cleanName, cleanName, displayName, bio, avatarURI);
    }

    /**
     * @notice Transfer a username to a new wallet address.
     */
    function transferName(string calldata rawName, address newOwner) external {
        if (newOwner == address(0)) revert InvalidRecipient();
        if (newOwner == msg.sender) revert RecipientIsSelf();

        string memory cleanName = normalize(rawName);
        if (_names[cleanName].owner != msg.sender) {
            revert NotNameOwner(cleanName, msg.sender);
        }

        // Remove from sender's owned list
        _removeOwnedName(msg.sender, cleanName);

        // Add to recipient's owned list
        _ownedNameIndex[cleanName] = _ownedNames[newOwner].length;
        _ownedNames[newOwner].push(cleanName);

        // Update record
        _names[cleanName].owner = newOwner;

        // If this was sender's primary name, reset or pick another
        if (keccak256(bytes(_primaryName[msg.sender])) == keccak256(bytes(cleanName))) {
            if (_ownedNames[msg.sender].length > 0) {
                _primaryName[msg.sender] = _ownedNames[msg.sender][0];
                emit PrimaryNameSet(msg.sender, _primaryName[msg.sender]);
            } else {
                delete _primaryName[msg.sender];
                emit PrimaryNameSet(msg.sender, "");
            }
        }

        // If recipient has no primary name, set this as primary
        if (bytes(_primaryName[newOwner]).length == 0) {
            _primaryName[newOwner] = cleanName;
            emit PrimaryNameSet(newOwner, cleanName);
        }

        emit NameTransferred(cleanName, cleanName, msg.sender, newOwner);
    }

    /**
     * @notice Release a username so anyone can register it again.
     */
    function releaseName(string calldata rawName) external {
        string memory cleanName = normalize(rawName);
        if (_names[cleanName].owner != msg.sender) {
            revert NotNameOwner(cleanName, msg.sender);
        }

        // Remove from sender's owned list
        _removeOwnedName(msg.sender, cleanName);

        // Delete record
        delete _names[cleanName];
        delete _ownedNameIndex[cleanName];

        // If this was sender's primary name, clear or pick next
        if (keccak256(bytes(_primaryName[msg.sender])) == keccak256(bytes(cleanName))) {
            if (_ownedNames[msg.sender].length > 0) {
                _primaryName[msg.sender] = _ownedNames[msg.sender][0];
                emit PrimaryNameSet(msg.sender, _primaryName[msg.sender]);
            } else {
                delete _primaryName[msg.sender];
                emit PrimaryNameSet(msg.sender, "");
            }
        }

        if (totalRegistered > 0) {
            totalRegistered--;
        }

        emit NameReleased(cleanName, cleanName, msg.sender);
    }

    /**
     * @notice Get all usernames owned by an address.
     */
    function getOwnedNames(address user) external view returns (string[] memory) {
        return _ownedNames[user];
    }

    /**
     * @dev Internal helper to remove a name from an address's owned list in O(1).
     */
    function _removeOwnedName(address owner, string memory nameToRemove) internal {
        uint256 index = _ownedNameIndex[nameToRemove];
        uint256 lastIndex = _ownedNames[owner].length - 1;

        if (index != lastIndex) {
            string memory lastItem = _ownedNames[owner][lastIndex];
            _ownedNames[owner][index] = lastItem;
            _ownedNameIndex[lastItem] = index;
        }

        _ownedNames[owner].pop();
        delete _ownedNameIndex[nameToRemove];
    }
}
