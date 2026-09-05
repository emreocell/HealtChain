const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

async function main() {
  const Registry = await hre.ethers.getContractFactory("MedicalRecordRegistry");
  const registry = await Registry.deploy();
  await registry.waitForDeployment();

  const address = await registry.getAddress();
  const chain = await hre.ethers.provider.getNetwork();
  const deployment = {
    address,
    chainId: Number(chain.chainId),
    network: hre.network.name,
    deployedAt: new Date().toISOString(),
  };

  const outputPath = path.join(__dirname, "..", "apps", "web", "assets", "deployment.json");
  fs.writeFileSync(outputPath, `${JSON.stringify(deployment, null, 2)}\n`, "utf8");

  console.log(`MedicalRecordRegistry deployed to ${address}`);
  console.log(`Frontend deployment config updated: ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
