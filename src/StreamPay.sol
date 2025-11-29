// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title StreamPay
 * @notice A money streaming protocol for MonadStream
 * @dev Implements x402-compatible streaming logic.
 * 
 * Core Concept: "Money Streaming"
 * Instead of per-transaction payments, money flows over time.
 * Balance = Deposit - (TimeElapsed * FlowRate)
 * 
 * Security: Follows Checks-Effects-Interactions (CEI) pattern.
 */
contract StreamPay {
    // --- Structs ---

    struct Stream {
        address sender;
        address recipient;
        uint256 flowRate;       // Amount per second (in wei)
        uint256 balance;        // Remaining balance in the stream (Deposit)
        uint256 lastSettledTime; // Last time the stream was settled/created
        bool isActive;
    }

    // --- State Variables ---

    mapping(uint256 => Stream) public streams;
    uint256 public nextStreamId;

    // --- Events ---

    event StreamStarted(uint256 indexed streamId, address indexed sender, address indexed recipient, uint256 flowRate, uint256 deposit);
    event StreamSettled(uint256 indexed streamId, address indexed recipient, uint256 amount);
    event StreamClosed(uint256 indexed streamId, address indexed sender, address indexed recipient, uint256 recipientAmount, uint256 senderRefund);

    // --- Custom Errors ---
    error InvalidFlowRate();
    error InvalidDeposit();
    error StreamNotActive();
    error Unauthorized();
    error TransferFailed();

    // --- Functions ---

    /**
     * @notice Creates a new money stream
     * @param recipient The address receiving the stream
     * @param flowRate The amount of wei to stream per second
     * @return streamId The ID of the created stream
     */
    function createStream(address recipient, uint256 flowRate) external payable returns (uint256 streamId) {
        if (flowRate == 0) revert InvalidFlowRate();
        if (msg.value == 0) revert InvalidDeposit();
        if (recipient == address(0) || recipient == msg.sender) revert Unauthorized();

        streamId = nextStreamId++;

        streams[streamId] = Stream({
            sender: msg.sender,
            recipient: recipient,
            flowRate: flowRate,
            balance: msg.value,
            lastSettledTime: block.timestamp,
            isActive: true
        });

        emit StreamStarted(streamId, msg.sender, recipient, flowRate, msg.value);
    }

    /**
     * @notice Closes an active stream and settles balances
     * @dev Implements Checks-Effects-Interactions for reentrancy protection.
     * @param streamId The ID of the stream to close
     */
    function closeStream(uint256 streamId) external {
        Stream storage stream = streams[streamId];

        if (!stream.isActive) revert StreamNotActive();
        // Only sender or recipient can close the stream
        if (msg.sender != stream.sender && msg.sender != stream.recipient) revert Unauthorized();

        // 1. Calculate amount due to recipient
        // Logic: Money flows linearly over time.
        uint256 timeElapsed = block.timestamp - stream.lastSettledTime;
        uint256 amountDue = timeElapsed * stream.flowRate;
        
        uint256 recipientAmount;
        uint256 senderRefund;

        // 2. Cap amount due at available balance (prevent underflow)
        if (amountDue >= stream.balance) {
            recipientAmount = stream.balance; // Recipient takes all
            senderRefund = 0;                 // Sender gets nothing back
        } else {
            recipientAmount = amountDue;
            senderRefund = stream.balance - amountDue; // Refund unused deposit
        }

        // 3. Update state (Effects) - BEFORE Transfer
        stream.balance = 0;
        stream.isActive = false;
        stream.lastSettledTime = block.timestamp;

        emit StreamSettled(streamId, stream.recipient, recipientAmount);
        emit StreamClosed(streamId, stream.sender, stream.recipient, recipientAmount, senderRefund);

        // 4. Transfer funds (Interactions)
        if (recipientAmount > 0) {
            (bool success, ) = stream.recipient.call{value: recipientAmount}("");
            if (!success) revert TransferFailed();
        }

        if (senderRefund > 0) {
            (bool success, ) = stream.sender.call{value: senderRefund}("");
            if (!success) revert TransferFailed();
        }
    }

    /**
     * @notice Returns stream details
     * @param streamId The ID of the stream to query
     */
    function getStream(uint256 streamId) external view returns (Stream memory) {
        return streams[streamId];
    }
}
