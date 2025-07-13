// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {ContractRegistry} from "@flarenetwork/flare-periphery-contracts/coston2/ContractRegistry.sol";
import {RandomNumberV2Interface} from "@flarenetwork/flare-periphery-contracts/coston2/RandomNumberV2Interface.sol";
import {TestFtsoV2Interface} from "@flarenetwork/flare-periphery-contracts/coston2/TestFtsoV2Interface.sol";
import {IJsonApi} from "@flarenetwork/flare-periphery-contracts/coston2/IJsonApi.sol";
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {IEVMTransaction} from "@flarenetwork/flare-periphery-contracts/coston2/IEVMTransaction.sol";
import {IFdcVerification} from "@flarenetwork/flare-periphery-contracts/coston2/IFdcVerification.sol";
import {USDC} from "./USDC.sol";

/**
 * @title AgriShield
 * @author Davyking
 * @notice This contract provides weather-indexed insurance for farmers, protecting against climate risks such as drought and floods, with payments in various tokens including ETH and USDC.
 */
contract AgriShield is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using Strings for uint256;
    RandomNumberV2Interface internal randomV2;
    TestFtsoV2Interface internal ftsoV2;
    using PriceConverter for uint256;

    error AgriShield__IncorrectETHAmount();
    error AgriShield__SendingFailed();
    error AgriShield__TokenNotSupported(address token);
    error AgriShield__TokenAlreadySupported(address token);
    error AgriShield__PriceNotAvailable();
    error AgriShield__RandomNumberNotSecure();
    error AgriShield__PolicyAlreadyExists();
    error AgriShield__PolicyNotFound();
    error AgriShield__TransactionAlreadyProcessed();
    error AgriShield_InsuranceAlreadyRefunded();
    error AgriShield_InsuranceNotExpired();
    error AgriShield__CanOnlyRefundPayer();
    error AgriShield__InvalidJsonProof();
    error AgriShield__InvalidEVMProof();
    error AgriShield__DateisLessThanCurrentTime();
    error AgriShield__WeatherConditionNotMet();
    error AgriShield_InsuranceNotSameAsData();
    error AgriShield__UrlNotSupported();
    error AgriShield__PolicyExpired();
    error AgriShield__AlreadyPayingWithToken(address token);
    error AgriShield__NotSender(address sender);
    error AgriShield__NotCorrectAmount();
    error AgriShield__NotCorrectReceiver(
        address receiver,
        address contractReceiver
    );

    bytes21 public constant FLRUSD =
        bytes21(0x01464c522f55534400000000000000000000000000); // FLR/USD
    bytes21 public constant USDCUSD =
        bytes21(0x01555344432f555344000000000000000000000000);
    uint256 public constant FIAT_priceDecimals = 10 ** 2;
    uint256 public constant SLIPPAGE_TOLERANCE_BPS = 200;
    address public constant NATIVE_TOKEN =
        address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE);
    address public USDC_SEPOLIA_CONTRACT;
    address public USDC_FLARE_CONTRACT;
    string public hostName;

    mapping(address => bytes21) public tokenToFeedId;
    mapping(uint256 => Policy) public policies;
    mapping(uint256 => InsurancePlan) public insurancePlans;
    mapping(bytes32 => bool) processedTransactions;

    // Struct to store insurance plan details
    struct InsurancePlan {
        uint256 id;
        string region;
        uint256 startDate;
        uint256 endDate;
        uint256 amountInUsd;
    }

    // Struct to store user policy details
    struct Policy {
        uint256 policyId;
        uint256 planId;
        string region;
        uint256 startDate;
        uint256 endDate;
        string weatherCondition;
        string refundStatus;
        uint256 amountInUsd;
        uint256 amountSent;
        address payer;
        address token;
        bool isWithdrawn;
    }

    struct DataTransportObject {
        uint256 planId;
        string status;
        string reasonType;
        string description;
    }

    // Event to emit insurance plan creation
    event InsurancePlanCreated(
        uint256 id,
        string region,
        uint256 startDate,
        uint256 endDate,
        uint256 amountInUsd
    );

    // Event to emit policy purchase
    event AgriShieldPurchased(
        uint256 policyId,
        uint256 planId,
        string region,
        uint256 startDate,
        uint256 endDate,
        string weatherCondition,
        string refundStatus,
        uint256 amountInUsd,
        address payer
    );

    // Event to emit policy withdrawal
    event AgriShieldWithdrawn(
        uint256 policyId,
        uint256 planId,
        string region,
        uint256 startDate,
        uint256 endDate,
        uint256 timestamp,
        string weatherCondition,
        string refundStatus,
        uint256 amountInUsd,
        address token,
        address recipient
    );

    // Event to emit token added
    event TokenAdded(address token, bytes21 feedId);
    // Event to emit token removed
    event TokenRemoved(address token);

    constructor() {
        randomV2 = ContractRegistry.getRandomNumberV2();
        ftsoV2 = ContractRegistry.getTestFtsoV2();
        tokenToFeedId[NATIVE_TOKEN] = FLRUSD;
    }

    /// @notice Set the USDC contract address on Flare
    /// @param _usdcFlareContract The address of the USDC contract on Flare
    /// @dev This function sets the USDC contract address and updates the tokenToFeedId mapping
    /// @dev Only the owner can call this function
    function setUSDCFlareContract(address _usdcFlareContract) public onlyOwner {
        USDC_FLARE_CONTRACT = _usdcFlareContract;
        tokenToFeedId[USDC_FLARE_CONTRACT] = USDCUSD;
    }

    function isJsonApiProofValid(
        IJsonApi.Proof calldata _proof
    ) private view returns (bool) {
        return
            ContractRegistry.auxiliaryGetIJsonApiVerification().verifyJsonApi(
                _proof
            );
    }

    function setHostName(string memory _hostname) public onlyOwner {
        hostName = _hostname;
    }

    function setUSDCSepoliaContract(
        address _usdcSepoliaContract
    ) public onlyOwner {
        USDC_SEPOLIA_CONTRACT = _usdcSepoliaContract;
    }

    function addToken(address token, bytes21 feedId) external onlyOwner {
        if (tokenToFeedId[token] != bytes21(0)) {
            revert AgriShield__TokenAlreadySupported(token);
        }
        tokenToFeedId[token] = feedId;
        emit TokenAdded(token, feedId);
    }

    function removeToken(address token) external onlyOwner {
        if (tokenToFeedId[token] == bytes21(0)) {
            revert AgriShield__TokenNotSupported(token);
        }
        delete tokenToFeedId[token];
        emit TokenRemoved(token);
    }

    function getUrlFromPlanId(
        uint256 planId
    ) public view returns (string memory expectedUrl) {
        expectedUrl = string(
            abi.encodePacked(
                hostName,
                "/api/weather/status/",
                planId.toString()
            )
        );
    }

    function refundPolicy(
        uint256 policyId,
        IJsonApi.Proof calldata _proof
    ) external nonReentrant {
        if (!isJsonApiProofValid(_proof)) {
            revert AgriShield__InvalidJsonProof();
        }

        Policy memory policy = policies[policyId];

        if (policy.endDate > block.timestamp) {
            revert AgriShield_InsuranceNotExpired();
        }

        if (policy.payer != msg.sender) {
            revert AgriShield__CanOnlyRefundPayer();
        }

        DataTransportObject memory dto = abi.decode(
            _proof.data.responseBody.abi_encoded_data,
            (DataTransportObject)
        );

        if (
            keccak256(bytes(getUrlFromPlanId(policy.planId))) !=
            keccak256(bytes(_proof.data.requestBody.url))
        ) {
            revert AgriShield__UrlNotSupported();
        }

        if (dto.planId != policy.planId) {
            revert AgriShield_InsuranceNotSameAsData();
        }

        if (keccak256(bytes(dto.status)) == keccak256(bytes("Normal"))) {
            revert AgriShield__WeatherConditionNotMet();
        }

        // Check if the policy has already been refunded
        if (policy.isWithdrawn) {
            revert AgriShield_InsuranceAlreadyRefunded();
        }

        // Mark the policy as refunded
        policies[policyId].isWithdrawn = true;

        // Refund the policy amount
        if (policy.token == NATIVE_TOKEN) {
            (bool success, ) = policy.payer.call{value: policy.amountSent}("");
            if (!success) {
                revert AgriShield__SendingFailed();
            }
        } else {
            IERC20(policy.token).safeTransfer(policy.payer, policy.amountSent);
        }

        // Emit an event for the refund
        emit AgriShieldWithdrawn(
            policyId,
            policy.planId,
            policy.region,
            policy.startDate,
            policy.endDate,
            block.timestamp,
            dto.description,
            "Refunded",
            policy.amountInUsd,
            policy.token,
            policy.payer
        );
    }

    function refundPolicyByPass(
        uint256 policyId,
        IJsonApi.Proof calldata _proof
    ) external nonReentrant onlyOwner {
        if (!isJsonApiProofValid(_proof)) {
            revert AgriShield__InvalidJsonProof();
        }

        Policy memory policy = policies[policyId];

        DataTransportObject memory dto = abi.decode(
            _proof.data.responseBody.abi_encoded_data,
            (DataTransportObject)
        );

        if (
            keccak256(bytes(getUrlFromPlanId(policy.planId))) !=
            keccak256(bytes(_proof.data.requestBody.url))
        ) {
            revert AgriShield__UrlNotSupported();
        }

        if (dto.planId != policy.planId) {
            revert AgriShield_InsuranceNotSameAsData();
        }

        if (keccak256(bytes(dto.status)) == keccak256(bytes("Normal"))) {
            revert AgriShield__WeatherConditionNotMet();
        }

        // Check if the policy has already been refunded
        if (policy.isWithdrawn) {
            revert AgriShield_InsuranceAlreadyRefunded();
        }

        // Mark the policy as refunded
        policies[policyId].isWithdrawn = true;

        // Refund the policy amount
        if (policy.token == NATIVE_TOKEN) {
            (bool success, ) = policy.payer.call{value: policy.amountSent}("");
            if (!success) {
                revert AgriShield__SendingFailed();
            }
        } else {
            IERC20(policy.token).safeTransfer(policy.payer, policy.amountSent);
        }

        // Emit an event for the refund
        emit AgriShieldWithdrawn(
            policyId,
            policy.planId,
            policy.region,
            policy.startDate,
            policy.endDate,
            block.timestamp,
            dto.description,
            "Refunded",
            policy.amountInUsd,
            policy.token,
            policy.payer
        );
    }

    function isEVMTransactionProofValid(
        IEVMTransaction.Proof calldata transaction
    ) public view returns (bool) {
        IFdcVerification fdc = ContractRegistry.getFdcVerification();
        return fdc.verifyEVMTransaction(transaction);
    }

    /**
     * Fetch the latest secure random number and generate a policy ID.
     * The random number is used to ensure the uniqueness of the policy ID.
     */
    function generateUniqueId() internal view returns (uint256) {
        (uint256 randomNumber, bool isSecure, ) = randomV2.getRandomNumber();
        if (!isSecure) {
            revert AgriShield__RandomNumberNotSecure();
        }
        return randomNumber;
    }

    function payForPolicy(
        uint256 planId,
        address token
    ) public payable nonReentrant {
        InsurancePlan memory plan = insurancePlans[planId];
        if (plan.id == 0) {
            revert AgriShield__PolicyNotFound();
        }

        if (plan.endDate < block.timestamp) {
            revert AgriShield__PolicyExpired();
        }

        if (tokenToFeedId[token] == bytes21(0)) {
            revert AgriShield__TokenNotSupported(token);
        }

        uint256 amountSent = getUsdToTokenPrice(token, plan.amountInUsd);
        uint256 minTokenAmount = (amountSent *
            (10000 - SLIPPAGE_TOLERANCE_BPS)) / 10000;
        uint256 maxTokenAmount = (amountSent *
            (10000 + SLIPPAGE_TOLERANCE_BPS)) / 10000;
        if (token == NATIVE_TOKEN) {
            if (msg.value < minTokenAmount || msg.value > maxTokenAmount) {
                revert AgriShield__IncorrectETHAmount();
            }
        } else {
            if (msg.value > 0) {
                revert AgriShield__AlreadyPayingWithToken(token);
            }
            IERC20(token).safeTransferFrom(
                msg.sender,
                address(this),
                amountSent
            );
        }

        // Create a policy
        uint256 policyId = generateUniqueId();
        Policy memory newPolicy = Policy({
            policyId: policyId,
            planId: planId,
            region: insurancePlans[planId].region,
            startDate: insurancePlans[planId].startDate,
            endDate: insurancePlans[planId].endDate,
            weatherCondition: "",
            refundStatus: "",
            amountInUsd: plan.amountInUsd,
            amountSent: amountSent,
            token: token,
            payer: msg.sender,
            isWithdrawn: false
        });

        // Store the policy in the mapping
        policies[policyId] = newPolicy;

        // Emit the AgriShieldPurchased event
        emit AgriShieldPurchased(
            policyId,
            planId,
            insurancePlans[planId].region,
            insurancePlans[planId].startDate,
            insurancePlans[planId].endDate,
            "",
            "",
            plan.amountInUsd,
            msg.sender
        );
    }

    function withdraw(uint256 _policyId) external onlyOwner nonReentrant {
        Policy memory policy = policies[_policyId];

        // Check if the policy has been refunded
        if (policy.isWithdrawn) {
            revert AgriShield_InsuranceAlreadyRefunded();
        }

        // Check if the policy has expired
        if (policy.endDate > block.timestamp) {
            revert AgriShield_InsuranceNotExpired();
        }

        // Mark the policy as withdrawn
        policies[_policyId].isWithdrawn = true;

        if (policy.token == NATIVE_TOKEN) {
            (bool success, ) = msg.sender.call{value: policy.amountSent}("");
            if (!success) {
                revert AgriShield__SendingFailed();
            }
        } else {
            IERC20(policy.token).safeTransfer(msg.sender, policy.amountSent);
        }

        // Emit an event for the withdrawal
        emit AgriShieldWithdrawn(
            _policyId,
            policy.planId,
            policy.region,
            policy.startDate,
            policy.endDate,
            block.timestamp,
            policy.weatherCondition,
            policy.refundStatus,
            policy.amountInUsd,
            policy.token,
            msg.sender
        );
    }

    /**
     * @dev Get token decimals
     * @param token The address of the token.
     */
    function getTokenDecimals(address token) internal view returns (uint8) {
        if (token == NATIVE_TOKEN) {
            return 18;
        }

        (bool success, bytes memory data) = token.staticcall(
            abi.encodeWithSignature("decimals()")
        );
        return success ? abi.decode(data, (uint8)) : 18;
    }

    function getUsdToTokenPrice(
        address token,
        uint256 amountInUsd
    ) public view returns (uint256) {
        bytes21 priceId = tokenToFeedId[token];
        if (priceId == bytes21(0)) {
            revert AgriShield__TokenNotSupported(token);
        }
        (uint256 priceOfTokenInUsd, int8 _priceDecimals, ) = ftsoV2.getFeedById(
            priceId
        );
        if (priceOfTokenInUsd == 0) {
            revert AgriShield__PriceNotAvailable();
        }
        uint8 priceDecimals = uint8(
            _priceDecimals < 0 ? -_priceDecimals : _priceDecimals
        );
        uint8 tokenDecimals = getTokenDecimals(token);

        uint256 amountToSendNumerator = amountInUsd *
            (10 ** tokenDecimals) *
            (10 ** priceDecimals);
        uint256 amountToSendDenominator = priceOfTokenInUsd;

        uint256 amountToSend = amountToSendNumerator / amountToSendDenominator;

        return amountToSend / FIAT_priceDecimals;
    }

    /**
     * Function to create an insurance plan.
     * Accepts payment in ETH, USDC, or other supported tokens.
     */
    function createInsurancePlan(
        string memory _region,
        uint256 _startDate,
        uint256 _endDate,
        uint256 _amountInUsd
    ) external onlyOwner {
        if (_startDate < block.timestamp) {
            revert AgriShield__DateisLessThanCurrentTime();
        }

        uint256 planId = generateUniqueId();
        InsurancePlan memory newPlan = InsurancePlan({
            id: planId,
            region: _region,
            startDate: _startDate,
            endDate: _endDate,
            amountInUsd: _amountInUsd
        });

        // Store the insurance plan in the mapping
        insurancePlans[planId] = newPlan;

        // Emit event
        emit InsurancePlanCreated(
            planId,
            _region,
            _startDate,
            _endDate,
            _amountInUsd
        );
    }

    /**
     * Function to get insurance plan details by ID.
     */
    function getInsurancePlanDetails(
        uint256 _planId
    )
        external
        view
        returns (
            uint256 planId,
            string memory region,
            uint256 startDate,
            uint256 endDate,
            uint256 amountInUsd
        )
    {
        InsurancePlan memory plan = insurancePlans[_planId];
        return (
            plan.id,
            plan.region,
            plan.startDate,
            plan.endDate,
            plan.amountInUsd
        );
    }
}
