import hre from "hardhat";
import { verify } from "../utils/verify";
import dotenv from "dotenv";
import { network } from "hardhat";
import { cleanDeployments } from "../utils/clean";
import { updateEnv } from "./update.env";
import AgriShieldModule from "../ignition/modules/AgricShield";
import { copyABI } from "./copy.abi";
import HelpersModule from "../ignition/modules/Helpers";
import USDCModule from "../ignition/modules/USDC";

dotenv.config();

async function main() {
  const chainId = network.config.chainId!;
  const rpcUrl = (network.config as any).url;
  cleanDeployments(chainId!);
  const blockNumber = await hre.ethers.provider.getBlockNumber();
  const { agriShield } = await hre.ignition.deploy(AgriShieldModule);
  const { helpers } = await hre.ignition.deploy(HelpersModule);
  const { usdc } = await hre.ignition.deploy(USDCModule);
  await agriShield.waitForDeployment();
  await helpers.waitForDeployment();
  await usdc.waitForDeployment();
  const agriShieldAddress = await agriShield.getAddress();
  const helpersAddress = await helpers.getAddress();
  const usdcAddress = await usdc.getAddress();

  console.log("AgriShield deployed to:", agriShieldAddress);
  console.log("Helpers deployed to:", helpersAddress);
  console.log("USDC deployed to:", usdcAddress);

  // set url
  const flightContract = await hre.ethers.getContractAt(
    "FlightTicket",
    agriShieldAddress
  );

  const tx = await flightContract.setHostName(process.env.BACKEND_URL!);
  await tx.wait(1);

  const usdcSet = await flightContract.setUSDCFlareContract(usdcAddress);
  await usdcSet.wait(1);

  // sepolia
  await hre.changeNetwork("sepolia");
  const [wallet] = await hre.ethers.getSigners();
  const usdcSepoliaFactory = await hre.ethers.getContractFactory(
    "USDC",
    wallet
  );
  const usdcSepolia = await usdcSepoliaFactory.deploy();
  await usdcSepolia.waitForDeployment();
  const usdcSepoliaAddress = await usdcSepolia.getAddress();
  console.log("USDC Sepolia deployed to:", usdcSepoliaAddress);
  await hre.changeNetwork("coston2");

  const setUSDCSepolia = await flightContract.setUSDCSepoliaContract(
    usdcSepoliaAddress
  );
  await setUSDCSepolia.wait(1);

  await verify(agriShieldAddress, []);
  await verify(helpersAddress, []);
  await verify(usdcAddress, []);

  updateEnv(
    agriShieldAddress,
    "frontend",
    "VITE_AGRIC_SHIELD_CONTRACT_ADDRESS"
  );
  updateEnv(agriShieldAddress, "backend", "AGRIC_SHIELD_CONTRACT_ADDRESS");
  updateEnv(agriShieldAddress, "indexer", "AGRIC_SHIELD_CONTRACT_ADDRESS");
  updateEnv(helpersAddress, "frontend", "VITE_FDC_HELPER_ADDRESS");
  updateEnv(blockNumber.toString(), "indexer", "BLOCK_NUMBER");
  updateEnv(chainId!.toString()!, "indexer", "CHAIN_ID");
  updateEnv(rpcUrl, "indexer", "RPC_URL");
  updateEnv(rpcUrl, "backend", "RPC_URL");
  copyABI("AgriShield", "indexer/abis", "agrishield");
  copyABI("AgriShield", "frontend/src/assets/json", "agrishield");
  copyABI("Helpers", "frontend/src/assets/json", "helpers-fdc");
  copyABI("USDC", "frontend/src/assets/json", "erc20");
}

main().catch(console.error);
