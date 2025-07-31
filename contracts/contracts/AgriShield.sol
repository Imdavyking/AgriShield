// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {ContractRegistry} from "@flarenetwork/flare-periphery-contracts/coston2/ContractRegistry.sol";
import {RandomNumberV2Interface} from "@flarenetwork/flare-periphery-contracts/coston2/RandomNumberV2Interface.sol";
import {TestFtsoV2Interface} from "@flarenetwork/flare-periphery-contracts/coston2/TestFtsoV2Interface.sol";
import {IJsonApi} from "@flarenetwork/flare-periphery-contracts/coston2/IJsonApi.sol";
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

contract AgriShield is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using Strings for uint256;

    RandomNumberV2Interface internal randomV2;
    TestFtsoV2Interface internal ftsoV2;

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
    error AgriShield_InsuranceExpired();
    error AgriShield__UrlNotSupported();
    error AgriShield__WeatherConditionNotMet();
    error AgriShield_InsuranceNotSameAsData();
    error AgriShield__PolicyExpired();
    error AgriShield__AlreadyPayingWithToken(address token);
    error AgriShield__DateisLessThanCurrentTime();
    error AgriShield__AmountMustBeGreaterThanOneDollar();

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
    string public hostName = "https://api.open-meteo.com/";

    mapping(address => bytes21) public tokenToFeedId;
    mapping(uint256 => Policy) public policies;
    mapping(uint256 => InsurancePlan) public insurancePlans;
    mapping(address => Policy[]) public userPolicies;
    mapping(uint256 => mapping(address => bool)) public userPlanProcessed;

    // use array also incase my indexer fails
    InsurancePlan[] public insurancePlanList;

    struct InsurancePlan {
        uint256 id;
        uint256 latitude;
        uint256 longitude;
        uint256 startDate;
        uint256 endDate;
        uint256 amountInUsd;
    }

    struct Policy {
        uint256 policyId;
        uint256 planId;
        uint256 latitude;
        uint256 longitude;
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
        string time;
        uint256 interval;
        uint256 temperature;
        uint256 windspeed;
        uint256 winddirection;
        uint8 isDay;
        uint256 weathercode;
    }

    event InsurancePlanCreated(
        uint256 id,
        uint256 latitude,
        uint256 longitude,
        uint256 startDate,
        uint256 endDate,
        uint256 amountInUsd
    );

    event AgriShieldPurchased(
        uint256 policyId,
        uint256 planId,
        uint256 latitude,
        uint256 longitude,
        uint256 startDate,
        uint256 endDate,
        string weatherCondition,
        string refundStatus,
        uint256 amountInUsd,
        address payer
    );

    event AgriShieldWithdrawn(
        uint256 policyId,
        uint256 planId,
        uint256 latitude,
        uint256 longitude,
        uint256 startDate,
        uint256 endDate,
        uint256 timestamp,
        int256 temperature,
        string refundStatus,
        uint256 amountInUsd,
        address token,
        address recipient
    );

    event TokenAdded(address token, bytes21 feedId);
    event TokenRemoved(address token);

    constructor() Ownable(msg.sender) {
        randomV2 = ContractRegistry.getRandomNumberV2();
        ftsoV2 = ContractRegistry.getTestFtsoV2();
        tokenToFeedId[NATIVE_TOKEN] = FLRUSD;
    }

    function setUSDCFlareContract(address _usdcFlareContract) public onlyOwner {
        USDC_FLARE_CONTRACT = _usdcFlareContract;
        tokenToFeedId[_usdcFlareContract] = USDCUSD;
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

    function setHostName(string memory _hostname) public onlyOwner {
        hostName = _hostname;
    }

    function isJsonApiProofValid(
        IJsonApi.Proof calldata _proof
    ) private view returns (bool) {
        return
            ContractRegistry.auxiliaryGetIJsonApiVerification().verifyJsonApi(
                _proof
            );
    }

    // function getUrlFromPlanId(
    //     uint256 planId
    // ) public view returns (string memory) {
    //     InsurancePlan memory plan = insurancePlans[planId];
    //     return getUrlFromLatAndLong(plan.latitude, plan.longitude);
    // }

    function createInsurancePlan(
        uint256 _latitude,
        uint256 _longitude,
        uint256 _startDate,
        uint256 _endDate,
        uint256 _amountInUsd
    ) external onlyOwner {
        if (_startDate < block.timestamp) {
            revert AgriShield__DateisLessThanCurrentTime();
        }

        if (_amountInUsd < FIAT_priceDecimals) {
            revert AgriShield__AmountMustBeGreaterThanOneDollar();
        }

        uint256 planId = generateUniqueId();
        if (insurancePlans[planId].id != 0) {
            revert AgriShield__PolicyAlreadyExists();
        }

        insurancePlans[planId] = InsurancePlan({
            id: planId,
            latitude: _latitude,
            longitude: _longitude,
            startDate: _startDate,
            endDate: _endDate,
            amountInUsd: _amountInUsd
        });

        insurancePlanList.push(insurancePlans[planId]);

        emit InsurancePlanCreated(
            planId,
            _latitude,
            _longitude,
            _startDate,
            _endDate,
            _amountInUsd
        );
    }

    function getInsurancePlanList()
        external
        view
        returns (InsurancePlan[] memory)
    {
        return insurancePlanList;
    }

    function payForPolicy(
        uint256 planId,
        address token
    ) public payable nonReentrant {
        if (userPlanProcessed[planId][msg.sender]) {
            revert AgriShield__TransactionAlreadyProcessed();
        }
        InsurancePlan memory plan = insurancePlans[planId];
        if (plan.id == 0) revert AgriShield__PolicyNotFound();
        if (plan.endDate < block.timestamp) revert AgriShield__PolicyExpired();
        if (tokenToFeedId[token] == bytes21(0))
            revert AgriShield__TokenNotSupported(token);

        uint256 amountSent = getUsdToTokenPrice(token, plan.amountInUsd);
        uint256 minToken = (amountSent * (10000 - SLIPPAGE_TOLERANCE_BPS)) /
            10000;
        uint256 maxToken = (amountSent * (10000 + SLIPPAGE_TOLERANCE_BPS)) /
            10000;

        if (token == NATIVE_TOKEN) {
            if (msg.value < minToken || msg.value > maxToken)
                revert AgriShield__IncorrectETHAmount();
        } else {
            if (msg.value > 0) revert AgriShield__AlreadyPayingWithToken(token);
            IERC20(token).safeTransferFrom(
                msg.sender,
                address(this),
                amountSent
            );
        }

        uint256 policyId = generateUniqueId();

        if (policies[policyId].policyId != 0)
            revert AgriShield__PolicyAlreadyExists();

        policies[policyId] = Policy({
            policyId: policyId,
            planId: planId,
            latitude: plan.latitude,
            longitude: plan.longitude,
            startDate: plan.startDate,
            endDate: plan.endDate,
            weatherCondition: "",
            refundStatus: "",
            amountInUsd: plan.amountInUsd,
            amountSent: amountSent,
            token: token,
            payer: msg.sender,
            isWithdrawn: false
        });

        userPolicies[msg.sender].push(policies[policyId]);
        userPlanProcessed[planId][msg.sender] = true;

        emit AgriShieldPurchased(
            policyId,
            planId,
            plan.latitude,
            plan.longitude,
            plan.startDate,
            plan.endDate,
            "",
            "",
            plan.amountInUsd,
            msg.sender
        );
    }

    function getUserPolicies(
        address user
    )
        external
        view
        returns (
            uint256[] memory policyIds,
            uint256[] memory planIds,
            uint256[] memory startDates,
            uint256[] memory endDates,
            uint256[] memory amounts,
            bool[] memory withdrawnFlags,
            uint256[] memory latitude,
            uint256[] memory longitude
        )
    {
        uint256 length = userPolicies[user].length;

        policyIds = new uint256[](length);
        planIds = new uint256[](length);
        startDates = new uint256[](length);
        endDates = new uint256[](length);
        amounts = new uint256[](length);
        withdrawnFlags = new bool[](length);
        latitude = new uint256[](length);
        longitude = new uint256[](length);

        for (uint256 i = 0; i < length; i++) {
            Policy memory p = userPolicies[user][i];
            policyIds[i] = p.policyId;
            planIds[i] = p.planId;
            startDates[i] = p.startDate;
            endDates[i] = p.endDate;
            amounts[i] = p.amountInUsd;
            latitude[i] = p.latitude;
            longitude[i] = p.longitude;
            withdrawnFlags[i] = p.isWithdrawn;
        }
    }

    function refundPolicy(
        uint256 policyId,
        IJsonApi.Proof calldata _proof
    ) external nonReentrant {
        if (!isJsonApiProofValid(_proof)) revert AgriShield__InvalidJsonProof();

        Policy memory policy = policies[policyId];
        if (policy.endDate > block.timestamp)
            revert AgriShield_InsuranceExpired();
        if (policy.payer != msg.sender) revert AgriShield__CanOnlyRefundPayer();
        if (policy.isWithdrawn) revert AgriShield_InsuranceAlreadyRefunded();

        DataTransportObject memory dto = abi.decode(
            _proof.data.responseBody.abi_encoded_data,
            (DataTransportObject)
        );

        _validateUrlPrefix(_proof.data.requestBody.url);

        if (dto.temperature < 20) {
            revert AgriShield__WeatherConditionNotMet();
        }

        policies[policyId].isWithdrawn = true;

        if (policy.token == NATIVE_TOKEN) {
            (bool success, ) = policy.payer.call{value: policy.amountSent}("");
            if (!success) revert AgriShield__SendingFailed();
        } else {
            IERC20(policy.token).safeTransfer(policy.payer, policy.amountSent);
        }

        // update mapping to policy[]
        for (uint256 i = 0; i < userPolicies[policy.payer].length; i++) {
            if (userPolicies[policy.payer][i].policyId == policyId) {
                userPolicies[policy.payer][i].isWithdrawn = true;
                break;
            }
        }

        userPlanProcessed[policy.planId][policy.payer] = true;

        emit AgriShieldWithdrawn(
            policyId,
            policy.planId,
            policy.latitude,
            policy.longitude,
            policy.startDate,
            policy.endDate,
            block.timestamp,
            dto.temperature,
            "Refunded",
            policy.amountInUsd,
            policy.token,
            policy.payer
        );
    }

    function _validateUrlPrefix(string memory url) internal view {
        bytes memory urlBytes = bytes(url);
        bytes memory hostBytes = bytes(hostName);

        if (urlBytes.length < hostBytes.length) {
            revert AgriShield__UrlNotSupported();
        }

        for (uint256 i = 0; i < hostBytes.length; i++) {
            if (urlBytes[i] != hostBytes[i]) {
                revert AgriShield__UrlNotSupported();
            }
        }
    }

    function refundPolicyByPass(
        uint256 policyId,
        IJsonApi.Proof calldata _proof
    ) external onlyOwner nonReentrant {
        if (!isJsonApiProofValid(_proof)) revert AgriShield__InvalidJsonProof();

        Policy memory policy = policies[policyId];
        if (policy.isWithdrawn) revert AgriShield_InsuranceAlreadyRefunded();

        DataTransportObject memory dto = abi.decode(
            _proof.data.responseBody.abi_encoded_data,
            (DataTransportObject)
        );

        _validateUrlPrefix(_proof.data.requestBody.url);

        policies[policyId].isWithdrawn = true;

        if (policy.token == NATIVE_TOKEN) {
            (bool success, ) = policy.payer.call{value: policy.amountSent}("");
            if (!success) revert AgriShield__SendingFailed();
        } else {
            IERC20(policy.token).safeTransfer(policy.payer, policy.amountSent);
        }

        emit AgriShieldWithdrawn(
            policyId,
            policy.planId,
            policy.latitude,
            policy.longitude,
            policy.startDate,
            policy.endDate,
            block.timestamp,
            dto.temperature,
            "Refunded",
            policy.amountInUsd,
            policy.token,
            policy.payer
        );
    }

    function withdrawTest() external onlyOwner nonReentrant {
        //NOTE: this function is for testing purposes only a bypass to withdraw funds
        // withdraw all native tokens from the contract
        uint256 balance = address(this).balance;
        if (balance == 0) revert AgriShield__SendingFailed();
        (bool success, ) = msg.sender.call{value: balance}("");
        if (!success) revert AgriShield__SendingFailed();
    }

    function withdraw(uint256 _policyId) external onlyOwner nonReentrant {
        Policy memory policy = policies[_policyId];

        if (policy.isWithdrawn) revert AgriShield_InsuranceAlreadyRefunded();
        if (policy.endDate > block.timestamp)
            revert AgriShield_InsuranceNotExpired();

        policies[_policyId].isWithdrawn = true;

        if (policy.token == NATIVE_TOKEN) {
            (bool success, ) = msg.sender.call{value: policy.amountSent}("");
            if (!success) revert AgriShield__SendingFailed();
        } else {
            IERC20(policy.token).safeTransfer(msg.sender, policy.amountSent);
        }

        emit AgriShieldWithdrawn(
            _policyId,
            policy.planId,
            policy.latitude,
            policy.longitude,
            policy.startDate,
            policy.endDate,
            block.timestamp,
            0,
            policy.refundStatus,
            policy.amountInUsd,
            policy.token,
            msg.sender
        );
    }

    function generateUniqueId() internal view returns (uint256) {
        (uint256 randomNumber, bool isSecure, ) = randomV2.getRandomNumber();
        if (!isSecure) revert AgriShield__RandomNumberNotSecure();
        return randomNumber;
    }

    function getTokenDecimals(address token) internal view returns (uint8) {
        if (token == NATIVE_TOKEN) return 18;

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
        if (priceId == bytes21(0)) revert AgriShield__TokenNotSupported(token);

        (uint256 price, int8 _priceDecimals, ) = ftsoV2.getFeedById(priceId);
        if (price == 0) revert AgriShield__PriceNotAvailable();

        uint8 priceDecimals = uint8(
            _priceDecimals < 0 ? -_priceDecimals : _priceDecimals
        );
        uint8 tokenDecimals = getTokenDecimals(token);

        uint256 numerator = amountInUsd *
            (10 ** tokenDecimals) *
            (10 ** priceDecimals);
        uint256 denominator = price;

        return numerator / denominator / FIAT_priceDecimals;
    }

    function getInsurancePlanDetails(
        uint256 _planId
    )
        external
        view
        returns (
            uint256 id,
            uint256 latitude,
            uint256 longitude,
            uint256 startDate,
            uint256 endDate,
            uint256 amountInUsd
        )
    {
        InsurancePlan memory plan = insurancePlans[_planId];
        return (
            plan.id,
            plan.latitude,
            plan.longitude,
            plan.startDate,
            plan.endDate,
            plan.amountInUsd
        );
    }

    receive() external payable {}
}
