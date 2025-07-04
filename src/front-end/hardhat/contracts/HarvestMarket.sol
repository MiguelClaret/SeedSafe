// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./HarvestManager.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract HarvestMarket is Ownable, ReentrancyGuard {
    HarvestManager public harvestManager;

    event HarvestPurchased(
        uint256 indexed harvestId,
        address indexed buyer,
        uint256 amount,
        uint256 totalPaid
    );

    mapping(uint256 => mapping(address => uint256)) public purchases;

    constructor(address _harvestManager) {
        harvestManager = HarvestManager(_harvestManager);
    }

    function buy(uint256 harvestId, uint256 amount) external payable nonReentrant {
        (
            ,
            uint256 totalAvailable,
            uint256 pricePerUnit,
            ,
            address producer,
            HarvestManager.HarvestStatus status,
            ,
            
        ) = harvestManager.harvests(harvestId);

        require(status == HarvestManager.HarvestStatus.VALIDATED, "Harvest not validated");
        require(amount > 0 && amount <= totalAvailable, "Invalid amount");
        require(
            harvestManager.balanceOf(producer, harvestId) >= amount,
            "Insufficient producer balance"
        );

        uint256 totalPrice = pricePerUnit * amount;
        require(msg.value >= totalPrice, "Insufficient payment");

        // Transfere o token para o comprador
        harvestManager.safeTransferFrom(producer, msg.sender, harvestId, amount, "");

        // Registra a compra
        purchases[harvestId][msg.sender] += amount;

        // Repassa o pagamento ao produtor
        (bool sent, ) = producer.call{value: totalPrice}("");
        require(sent, "Transfer to producer failed");

        // Troco, se for o caso
        if (msg.value > totalPrice) {
            (bool refund, ) = msg.sender.call{value: msg.value - totalPrice}("");
            require(refund, "Refund failed");
        }

        emit HarvestPurchased(harvestId, msg.sender, amount, totalPrice);
    }
}
