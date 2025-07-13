// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const AgriShieldModule = buildModule("AgriShieldModule", (m) => {
  const agriShield = m.contract("AgriShield", []);
  return { agriShield };
});

export default AgriShieldModule;
