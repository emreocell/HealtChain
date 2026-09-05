import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { network } from "hardhat";

const { viem, networkName } = await network.create();
const publicClient = await viem.getPublicClient();

console.log(`Deploying MedicalRecordRegistry to ${networkName}...`);
const registry = await viem.deployContract("MedicalRecordRegistry");
const chainId = await publicClient.getChainId();

const deployment = {
  address: registry.address,
  chainId,
  network: networkName,
  deployedAt: new Date().toISOString(),
};

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.resolve(
  currentDir,
  "..",
  "apps",
  "web",
  "assets",
  "deployment.json",
);

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(deployment, null, 2)}\n`, "utf8");

console.log(`MedicalRecordRegistry deployed to ${registry.address}`);
console.log(`Frontend deployment config updated: ${outputPath}`);
