const { expect } = require("chai");
const { ethers } = require("hardhat");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

describe("MedicalRecordRegistry", function () {
  async function deployFixture() {
    const [patient, provider, outsider] = await ethers.getSigners();
    const Registry = await ethers.getContractFactory("MedicalRecordRegistry");
    const registry = await Registry.deploy();
    await registry.waitForDeployment();
    return { registry, patient, provider, outsider };
  }

  const dataHash = ethers.sha256(ethers.toUtf8Bytes("salted-record-payload"));
  const recordTypeHash = ethers.keccak256(ethers.toUtf8Bytes("laboratory"));

  it("lets a patient anchor their own record hash", async function () {
    const { registry, patient } = await deployFixture();

    await expect(registry.connect(patient).addRecord(patient.address, dataHash, recordTypeHash))
      .to.emit(registry, "RecordAdded")
      .withArgs(patient.address, 0, dataHash, recordTypeHash, patient.address, anyValue);

    expect(await registry.getRecordCount(patient.address)).to.equal(1);
    const record = await registry.getRecord(patient.address, 0);
    expect(record.dataHash).to.equal(dataHash);
    expect(record.author).to.equal(patient.address);
    expect(record.revoked).to.equal(false);
  });

  it("rejects an unauthorized provider", async function () {
    const { registry, patient, provider } = await deployFixture();

    await expect(
      registry.connect(provider).addRecord(patient.address, dataHash, recordTypeHash)
    ).to.be.revertedWithCustomError(registry, "UnauthorizedWriter");
  });

  it("lets a patient grant and revoke provider write authorization", async function () {
    const { registry, patient, provider } = await deployFixture();

    await expect(registry.connect(patient).setProviderAuthorization(provider.address, true))
      .to.emit(registry, "ProviderAuthorizationChanged")
      .withArgs(patient.address, provider.address, true);

    await registry.connect(provider).addRecord(patient.address, dataHash, recordTypeHash);
    expect(await registry.getRecordCount(patient.address)).to.equal(1);

    await registry.connect(patient).setProviderAuthorization(provider.address, false);
    const secondHash = ethers.sha256(ethers.toUtf8Bytes("second-record"));

    await expect(
      registry.connect(provider).addRecord(patient.address, secondHash, recordTypeHash)
    ).to.be.revertedWithCustomError(registry, "UnauthorizedWriter");
  });

  it("prevents duplicate record hashes for the same patient", async function () {
    const { registry, patient } = await deployFixture();

    await registry.connect(patient).addRecord(patient.address, dataHash, recordTypeHash);
    await expect(
      registry.connect(patient).addRecord(patient.address, dataHash, recordTypeHash)
    ).to.be.revertedWithCustomError(registry, "DuplicateRecord");
  });

  it("allows only the patient to revoke a record", async function () {
    const { registry, patient, outsider } = await deployFixture();

    await registry.connect(patient).addRecord(patient.address, dataHash, recordTypeHash);

    await expect(
      registry.connect(outsider).revokeRecord(patient.address, 0)
    ).to.be.revertedWithCustomError(registry, "OnlyPatient");

    await expect(registry.connect(patient).revokeRecord(patient.address, 0))
      .to.emit(registry, "RecordRevoked")
      .withArgs(patient.address, 0, dataHash);

    const record = await registry.getRecord(patient.address, 0);
    expect(record.revoked).to.equal(true);
  });
});
