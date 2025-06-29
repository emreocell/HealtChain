const hre = require("hardhat");

async function main() {
  const MedikalKayitSistemi = await hre.ethers.getContractFactory("MedikalKayitSistemi");
  const kontrat = await MedikalKayitSistemi.deploy();

  await kontrat.waitForDeployment(); //  ethers v6 ise bu 

  console.log("Kontrat başarıyla deploy edildi!");
  console.log("Adres:", kontrat.target); //  ethers v6 → .target / ethers v5 → .address
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
