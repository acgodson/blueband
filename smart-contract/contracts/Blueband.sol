pragma solidity ^0.8.19;

contract BlueBand {
    struct Index {
        uint256 version;
        uint256 count;
        address owner;
        mapping(string => string) uriToId;
        mapping(string => string) idToUri;
    }

    mapping(string => Index) public indexes;
    mapping(address => string[]) public owners;

    // Function to create a new index catalog
    function createIndex(string memory indexName) external {
        indexes[indexName].owner = msg.sender;
        indexes[indexName].version = 1;
        owners[msg.sender].push(indexName);
    }

    // Function to add a new document CID to an existing index
    function addDocument(
        string memory indexName,
        string memory uri,
        string memory documentCID
    ) external {
        require(
            indexes[indexName].owner == msg.sender,
            "Only index owner can add documents"
        );
        indexes[indexName].count++;
        indexes[indexName].uriToId[uri] = documentCID;
        indexes[indexName].idToUri[documentCID] = uri;
    }

    // Function to retrieve document CID by URI
    function getURIByDocumentCID(string memory indexId, string memory cid)
        public
        view
        returns (string memory)
    {
        return indexes[indexId].idToUri[cid];
    }

    function getDocumentCIDByURI(string memory indexId, string memory uri)
        public
        view
        returns (string memory)
    {
        return indexes[indexId].uriToId[uri];
    }

    function getOwnersIndexes(address owner)
        public
        view
        returns (string[] memory)
    {
        return owners[owner];
    }
}
