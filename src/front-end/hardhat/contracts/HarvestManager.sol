// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract HarvestManagerV2 is ERC1155, AccessControl {
    uint256 public currentHarvestId = 0;

    enum HarvestStatus { PENDING, VALIDATED, DELIVERED, PARTIAL_LOSS, TOTAL_LOSS, REJECTED }

    struct Harvest {
        string crop;
        uint256 quantity;
        uint256 pricePerUnit;
        uint256 deliveryDate;
        address producer;
        HarvestStatus status;
        uint256 harvestedAmount;
        string documentation;
    }

    mapping(uint256 => Harvest) public harvests;
    mapping(uint256 => address[]) public buyers;

    event HarvestRejected(uint256 indexed harvestId, address indexed auditor);

    constructor() ERC1155("https://gateway.pinata.cloud/ipfs/{id}.json") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(getRole("PRODUCER_ROLE"), msg.sender);
    }

    function createHarvest(
        string memory crop,
        uint256 quantity,
        uint256 price,
        uint256 deliveryDate,
        string memory doc
    ) external onlyRole(getRole("PRODUCER_ROLE")) {
        harvests[currentHarvestId] = Harvest({
            crop: crop,
            quantity: quantity,
            pricePerUnit: price,
            deliveryDate: deliveryDate,
            producer: msg.sender,
            status: HarvestStatus.PENDING,
            harvestedAmount: 0,
            documentation: doc
        });
        currentHarvestId++;
    }

    function mintHarvest(address to, uint256 harvestId)
        external
        onlyRole(getRole("AUDITOR_ROLE"))
    {
        Harvest storage h = harvests[harvestId];
        require(h.status == HarvestStatus.PENDING, "Harvest not pending or already processed");

        _mint(to, harvestId, h.quantity, "");
        h.status = HarvestStatus.VALIDATED;
    }

    function rejectHarvest(uint256 harvestId)
        external
        onlyRole(getRole("AUDITOR_ROLE"))
    {
        Harvest storage h = harvests[harvestId];
        require(h.status == HarvestStatus.PENDING, "Harvest not pending or already processed");
        h.status = HarvestStatus.REJECTED;
        emit HarvestRejected(harvestId, msg.sender);
    }

    function getPendingHarvestIds() external view returns (uint256[] memory) {
        uint256 pendingCount = 0;
        for (uint256 i = 0; i < currentHarvestId; i++) {
            if (harvests[i].status == HarvestStatus.PENDING) {
                pendingCount++;
            }
        }

        uint256[] memory pendingIds = new uint256[](pendingCount);
        uint256 index = 0;
        for (uint256 i = 0; i < currentHarvestId; i++) {
            if (harvests[i].status == HarvestStatus.PENDING) {
                pendingIds[index] = i;
                index++;
            }
        }
        return pendingIds;
    }

    function getRole(string memory roleName) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(roleName));
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC1155, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
