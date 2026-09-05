import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { network } from "hardhat";
import { keccak256, sha256, stringToBytes } from "viem";

const { viem, networkHelpers } = await network.create();

const dataHash = sha256(stringToBytes("salted-record-payload"));
const recordTypeHash = keccak256(stringToBytes("laboratory"));

async function deployRegistryFixture() {
  const [patient, provider, outsider] = await viem.getWalletClients();
  const registry = await viem.deployContract("MedicalRecordRegistry");

  return { registry, patient, provider, outsider };
}

describe("MedicalRecordRegistry", function () {
  it("lets a patient anchor their own record hash", async function () {
    const { registry, patient } = await networkHelpers.loadFixture(deployRegistryFixture);

    await registry.write.addRecord(
      [patient.account.address, dataHash, recordTypeHash],
      { account: patient.account },
    );

    assert.equal(
      await registry.read.getRecordCount([patient.account.address]),
      1n,
    );

    const record = await registry.read.getRecord([patient.account.address, 0n]);
    assert.equal(record.dataHash, dataHash);
    assert.equal(record.author.toLowerCase(), patient.account.address.toLowerCase());
    assert.equal(record.revoked, false);
  });

  it("rejects an unauthorized provider", async function () {
    const { registry, patient, provider } = await networkHelpers.loadFixture(deployRegistryFixture);

    await assert.rejects(() =>
      registry.write.addRecord(
        [patient.account.address, dataHash, recordTypeHash],
        { account: provider.account },
      ),
    );
  });

  it("lets a patient grant and revoke provider write authorization", async function () {
    const { registry, patient, provider } = await networkHelpers.loadFixture(deployRegistryFixture);

    await registry.write.setProviderAuthorization(
      [provider.account.address, true],
      { account: patient.account },
    );

    assert.equal(
      await registry.read.isProviderAuthorized([
        patient.account.address,
        provider.account.address,
      ]),
      true,
    );

    await registry.write.addRecord(
      [patient.account.address, dataHash, recordTypeHash],
      { account: provider.account },
    );

    await registry.write.setProviderAuthorization(
      [provider.account.address, false],
      { account: patient.account },
    );

    const secondHash = sha256(stringToBytes("second-record"));
    await assert.rejects(() =>
      registry.write.addRecord(
        [patient.account.address, secondHash, recordTypeHash],
        { account: provider.account },
      ),
    );
  });

  it("prevents duplicate record hashes for the same patient", async function () {
    const { registry, patient } = await networkHelpers.loadFixture(deployRegistryFixture);

    await registry.write.addRecord(
      [patient.account.address, dataHash, recordTypeHash],
      { account: patient.account },
    );

    await assert.rejects(() =>
      registry.write.addRecord(
        [patient.account.address, dataHash, recordTypeHash],
        { account: patient.account },
      ),
    );
  });

  it("allows only the patient to revoke a record", async function () {
    const { registry, patient, outsider } = await networkHelpers.loadFixture(deployRegistryFixture);

    await registry.write.addRecord(
      [patient.account.address, dataHash, recordTypeHash],
      { account: patient.account },
    );

    await assert.rejects(() =>
      registry.write.revokeRecord(
        [patient.account.address, 0n],
        { account: outsider.account },
      ),
    );

    await registry.write.revokeRecord(
      [patient.account.address, 0n],
      { account: patient.account },
    );

    const record = await registry.read.getRecord([patient.account.address, 0n]);
    assert.equal(record.revoked, true);
  });
});
