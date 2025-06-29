// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MedikalKayitSistemi {

    struct Hasta {
        string isim;
        string[] hastaliklar;
    }

    mapping(address => Hasta) private hastalar;
    address[] private kayitliAdresler;
    mapping(address => bool) private adresKayitlimi;

    // Sadece kendi adresine kayıt yapılabilsin
    function setHastaIsmi(string memory _isim) public {
        if (!adresKayitlimi[msg.sender]) {
            kayitliAdresler.push(msg.sender);
            adresKayitlimi[msg.sender] = true;
        }
        hastalar[msg.sender].isim = _isim;
    }

    function setHastaHastaliklari(string memory _hastalik) public {
        if (!adresKayitlimi[msg.sender]) {
            kayitliAdresler.push(msg.sender);
            adresKayitlimi[msg.sender] = true;
        }
        hastalar[msg.sender].hastaliklar.push(_hastalik);
    }

    function getHastaVerisi(address _hastaAdres) public view returns (string memory, string[] memory) {
        return (hastalar[_hastaAdres].isim, hastalar[_hastaAdres].hastaliklar);
    }

    function getKayitliAdresler() public view returns (address[] memory) {
        return kayitliAdresler;
    }

    
    function adminSil(address _hastaAdres, uint indeks) public {
        require(indeks < hastalar[_hastaAdres].hastaliklar.length, "Gecersiz indeks");
        for (uint i = indeks; i < hastalar[_hastaAdres].hastaliklar.length - 1; i++) {
            hastalar[_hastaAdres].hastaliklar[i] = hastalar[_hastaAdres].hastaliklar[i + 1];
        }
        hastalar[_hastaAdres].hastaliklar.pop();
    }

    function adminGuncelle(address _hastaAdres, uint indeks, string memory yeniHastalik) public {
        require(indeks < hastalar[_hastaAdres].hastaliklar.length, "Gecersiz indeks");
        hastalar[_hastaAdres].hastaliklar[indeks] = yeniHastalik;
    }
}
