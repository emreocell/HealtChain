console.log("✅ app.js başarıyla yüklendi");

let provider, signer, contract;

const contractAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"; // <- kendi adresinle değiştir

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
    "inputs": [{ "internalType": "string", "name": "_isim", "type": "string" }],
    "name": "setHastaIsmi",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "string", "name": "_hastalik", "type": "string" }],
    "name": "setHastaHastaliklari",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

async function connectContract() {
  if (typeof window.ethereum === "undefined") {
    alert("❌ MetaMask yüklü değil!");
    throw new Error("MetaMask bulunamadı");
  }

  provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = provider.getSigner();
  contract = new ethers.Contract(contractAddress, abi, signer);
  console.log("✅ MetaMask bağlantısı kuruldu");
}

async function kayitEt() {
  try {
    await connectContract();
    console.log("🔹 connectContract tamam");

    const isim = document.getElementById("hastaIsmi").value;
    const hastalik = document.getElementById("hastalik").value;

    console.log("📨 Girdi:", { isim, hastalik });

    const tx1 = await contract.setHastaIsmi(isim);
    console.log("⏳ setHastaIsmi gönderildi", tx1.hash);
    await tx1.wait();
    console.log("✅ setHastaIsmi tamam");

    const tx2 = await contract.setHastaHastaliklari(hastalik);
    console.log("⏳ setHastaHastaliklari gönderildi", tx2.hash);
    await tx2.wait();
    console.log("✅ setHastaHastaliklari tamam");

    document.getElementById("sonuc").innerText = "✅ Kayıt başarıyla yapıldı.";
  } catch (err) {
    console.error("❌ Kayıt hatası:", err);
    document.getElementById("sonuc").innerText = "❌ Kayıt sırasında hata oluştu.";
  }
}

async function veriGetir() {
  try {
    await connectContract();
    const adres = await signer.getAddress();
    const [isim, hastaliklar] = await contract.getHastaVerisi(adres);

    document.getElementById("sonuc").innerText = `👤 İsim: ${isim}\n🩺 Hastalıklar: ${hastaliklar.join(", ")}`;

    const ai = await aiOnerChatGPT(hastaliklar);
    document.getElementById("aiOneri").innerText = `🤖 AI Öneri:\n${ai}`;
  } catch (err) {
    console.error("❌ Veri çekme hatası:", err);
    document.getElementById("sonuc").innerText = "❌ Veri çekilirken hata oluştu.";
  }
}

async function aiOnerChatGPT(hastaliklar) {
  try {
    const response = await fetch("http://localhost:5000/ai-oneri", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hastaliklar })
    });
    const data = await response.json();
    return data.oneri || "AI önerisi alınamadı.";
  } catch (err) {
    console.error("❌ AI fetch hatası:", err);
    return "AI servisine bağlanılamadı.";
  }
}

// Fonksiyonları global alana tanıt
window.kayitEt = kayitEt;
window.veriGetir = veriGetir;
