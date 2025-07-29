import assert from "assert";
import {
  InsurancePlanCreatedLog,
  AgriShieldPurchasedLog,
  AgriShieldWithdrawnLog,
} from "../types/abi-interfaces/Agrishield";

import {
  AgriShieldPurchased as AgriShieldPurchasedModel,
  AgriShieldWithdrawn,
  InsurancePlanCreated,
} from "../types";

export async function handleInsurancePlanCreatedLog(
  log: InsurancePlanCreatedLog
) {
  logger.info(`New Insurance transaction log at block ${log.blockNumber}`);
  assert(log.args, "No log.args");

  const insurancePlanCreated = InsurancePlanCreated.create({
    id: log.transactionHash,
    latitude: log.args.latitude.toBigInt(),
    longitude: log.args.longitude.toBigInt(),
    startDate: log.args.startDate.toBigInt(),
    endDate: log.args.endDate.toBigInt(),
    amountInUsd: log.args.amountInUsd.toBigInt(),
  });

  await insurancePlanCreated.save();
}

export async function handleAgriShieldPurchasedLog(log: AgriShieldPurchasedLog) {
  logger.info(
    `New AgriShieldPurchasedLog transaction log at block ${log.blockNumber}`
  );
  assert(log.args, "No log.args");

  const agriShieldPurchased = AgriShieldPurchasedModel.create({
    id: log.transactionHash,
    policyId: log.args.policyId.toBigInt(),
    planId: log.args.planId.toBigInt(),
    latitude: log.args.latitude.toBigInt(),
    longitude: log.args.longitude.toBigInt(),
    startDate: log.args.startDate.toBigInt(),
    endDate: log.args.endDate.toBigInt(),
    weatherCondition: log.args.weatherCondition,
    refundStatus: log.args.refundStatus,
    amountInUsd: log.args.amountInUsd.toBigInt(),
    payer: log.args.payer,
  });
  await agriShieldPurchased.save();
}

export async function handleAgriShieldWithdrawnLog(
  log: AgriShieldWithdrawnLog
) {
  logger.info(
    `New AgriShieldWithdrawnLog transaction log at block ${log.blockNumber}`
  );
  assert(log.args, "No log.args");

  const agriShieldWithdrawn = AgriShieldWithdrawn.create({
    id: log.transactionHash,
    policyId: log.args.policyId.toBigInt(),
    planId: log.args.planId.toBigInt(),
    latitude: log.args.latitude.toBigInt(),
    longitude: log.args.longitude.toBigInt(),
    startDate: log.args.startDate.toBigInt(),
    endDate: log.args.endDate.toBigInt(),
    timestamp: log.args.timestamp.toBigInt(),
    weatherCondition: log.args.weatherCondition,
    refundStatus: log.args.refundStatus,
    amountInUsd: log.args.amountInUsd.toBigInt(),
    token: log.args.token,
    recipient: log.args.recipient,
  });
  await agriShieldWithdrawn.save();
}
