let provider, signer, contract;
const contractAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"; // localhhostu çalıştırdıtan sonra gelen deploy anahtarını buraya yaz

const abi = [
  {
    "inputs": [],
    "name": "getKayitliAdresler",
    "outputs": [{ "internalType": "address[]", "name": "", "type": "address[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "_hastaAdres", "type": "address" }],
    "name": "getHastaVerisi",
    "outputs": [
      { "internalType": "string", "name": "", "type": "string" },
      { "internalType": "string[]", "name": "", "type": "string[]" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "_hastaAdres", "type": "address" },
      { "internalType": "uint256", "name": "indeks", "type": "uint256" }
    ],
    "name": "adminSil",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "_hastaAdres", "type": "address" },
      { "internalType": "uint256", "name": "indeks", "type": "uint256" },
      { "internalType": "string", "name": "yeniHastalik", "type": "string" }
    ],
    "name": "adminGuncelle",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

async function connectContract() {
  provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = provider.getSigner();
  contract = new ethers.Contract(contractAddress, abi, signer);
}

async function tumHastalariGetir() {
  await hastalariListele();
}

async function hastalariListele() {
  await connectContract();
  const tableBody = document.getElementById("hastaTablosu");
  if (!tableBody) {
    console.error("Element 'hastaTablosu' bulunamadı.");
    return;
  }
  tableBody.innerHTML = "";

  try {
    const adresler = await contract.getKayitliAdresler();

    let sayac = 1;
    for (let adres of adresler) {
      const [isim, hastaliklar] = await contract.getHastaVerisi(adres);
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="px-6 py-3 border border-gray-600">${sayac++}</td>
        <td class="px-6 py-3 border border-gray-600">${adres}</td>
        <td class="px-6 py-3 border border-gray-600">${isim}</td>
        <td class="px-6 py-3 border border-gray-600">${hastaliklar.join(", ")}</td>
      `;
      tableBody.appendChild(tr);
    }
  } catch (err) {
    console.error("Listeleme hatası:", err);
  }
}

async function adminSil() {
  await connectContract();
  const adres = document.getElementById("guncelleAdres").value;
  const indeks = parseInt(document.getElementById("guncelleIndeks").value);

  try {
    const tx = await contract.adminSil(adres, indeks);
    await tx.wait();
    document.getElementById("guncelleSonuc").innerText = "Silme işlemi başarılı.";
  } catch (error) {
    console.error("Silme hatası:", error);
    document.getElementById("guncelleSonuc").innerText = `Silme hatası: ${error.message}`;
  }
}

async function adminGuncelle() {
  await connectContract();
  const adres = document.getElementById("guncelleAdres").value;
  const indeks = parseInt(document.getElementById("guncelleIndeks").value);
  const yeniDeger = document.getElementById("yeniDeger").value;

  try {
    const tx = await contract.adminGuncelle(adres, indeks, yeniDeger);
    await tx.wait();
    document.getElementById("guncelleSonuc").innerText = "Güncelleme başarılı.";
  } catch (error) {
    console.error("Güncelleme hatası:", error);
    document.getElementById("guncelleSonuc").innerText = `Güncelleme hatası: ${error.message}`;
  }
}
