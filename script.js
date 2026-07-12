const KELIME_UZUNLUGU = 5;
const MAKS_DENEME = 6;

const TURKCE_KLAVYE = [
  ["E", "R", "T", "Y", "U", "I", "O", "P", "Ğ", "Ü"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Ş", "İ"],
  ["GIR", "Z", "C", "V", "B", "N", "M", "Ö", "Ç", "SIL"]
];

const tahtaEl = document.getElementById("tahta");
const klavyeEl = document.getElementById("klavye");
const mesajEl = document.getElementById("mesaj");
const bitisPanelEl = document.getElementById("bitis-panel");
const bitisMetinEl = document.getElementById("bitis-metin");
const tekrarOynaBtn = document.getElementById("tekrar-oyna");
const uygulamaEl = document.querySelector(".uygulama");

let gizliKelime = "";
let mevcutSatir = 0;
let mevcutSutun = 0;
let oyunBitti = false;
let kutular = [];
let tusDurumlari = {};

function buyukHarfYap(metin) {
  return metin.toLocaleUpperCase("tr-TR");
}

function gizliKelimeSec() {
  return GECERLI_KELIMELER[Math.floor(Math.random() * GECERLI_KELIMELER.length)];
}

function kelimeGecerliMi(kelime) {
  return GECERLI_KELIMELER.includes(buyukHarfYap(kelime));
}

function tahtaOlustur() {
  tahtaEl.innerHTML = "";
  kutular = [];

  for (let satir = 0; satir < MAKS_DENEME; satir++) {
    const satirEl = document.createElement("div");
    satirEl.className = "satir";
    const satirKutulari = [];

    for (let sutun = 0; sutun < KELIME_UZUNLUGU; sutun++) {
      const kutu = document.createElement("div");
      kutu.className = "kutu";
      satirEl.appendChild(kutu);
      satirKutulari.push(kutu);
    }

    tahtaEl.appendChild(satirEl);
    kutular.push(satirKutulari);
  }
}

function klavyeOlustur() {
  klavyeEl.innerHTML = "";

  TURKCE_KLAVYE.forEach(satir => {
    const satirEl = document.createElement("div");
    satirEl.className = "klavye-satir";

    satir.forEach(tus => {
      const dugme = document.createElement("button");
      dugme.type = "button";
      dugme.className = "tus";
      dugme.dataset.tus = tus;
      dugme.textContent = tus === "GIR" ? "GİR" : tus === "SIL" ? "SİL" : tus;

      if (tus === "GIR" || tus === "SIL") {
        dugme.classList.add("genis");
      }

      dugme.addEventListener("mousedown", e => e.preventDefault());
      dugme.addEventListener("click", () => {
        tusuIsle(tus);
        oyunaOdaklan();
      });

      satirEl.appendChild(dugme);
    });

    klavyeEl.appendChild(satirEl);
  });
}

function mesajGoster(metin, hataMi = false, sure = 2000) {
  mesajEl.textContent = metin;
  mesajEl.className = "mesaj goster" + (hataMi ? " hata" : "");
  clearTimeout(mesajGoster._zamanlayici);
  mesajGoster._zamanlayici = setTimeout(() => {
    mesajEl.className = "mesaj";
  }, sure);
}

function tahminiDegerlendir(tahmin) {
  const gizli = [...gizliKelime];
  const sonuc = Array(KELIME_UZUNLUGU).fill("yok");
  const kalan = [...gizli];

  for (let i = 0; i < KELIME_UZUNLUGU; i++) {
    if (tahmin[i] === gizli[i]) {
      sonuc[i] = "dogru";
      kalan[i] = null;
    }
  }

  for (let i = 0; i < KELIME_UZUNLUGU; i++) {
    if (sonuc[i] === "dogru") continue;
    const indeks = kalan.indexOf(tahmin[i]);
    if (indeks !== -1) {
      sonuc[i] = "yanlis-yerde";
      kalan[indeks] = null;
    }
  }

  return sonuc;
}

function tusDurumlariniGuncelle(tahmin, sonuc) {
  for (let i = 0; i < KELIME_UZUNLUGU; i++) {
    const harf = tahmin[i];
    const durum = sonuc[i];
    const onceki = tusDurumlari[harf];

    if (onceki === "dogru") continue;
    if (onceki === "yanlis-yerde" && durum === "yok") continue;

    tusDurumlari[harf] = durum;
    const tusDugmesi = klavyeEl.querySelector(`[data-tus="${harf}"]`);
    if (tusDugmesi) {
      tusDugmesi.classList.remove("dogru", "yanlis-yerde", "yok");
      tusDugmesi.classList.add(durum);
    }
  }
}

function satiriAc(satirIndeksi, tahmin, sonuc) {
  return new Promise(bitir => {
    kutular[satirIndeksi].forEach((kutu, i) => {
      setTimeout(() => {
        kutu.classList.add("cevir", sonuc[i]);
        kutu.textContent = tahmin[i];
        if (i === KELIME_UZUNLUGU - 1) setTimeout(bitir, 300);
      }, i * 300);
    });
  });
}

function satiriSalla(satirIndeksi) {
  const satirEl = tahtaEl.children[satirIndeksi];
  satirEl.classList.add("salla");
  setTimeout(() => satirEl.classList.remove("salla"), 500);
}

async function tahminiGonder() {
  if (oyunBitti) return;

  const satirKutulari = kutular[mevcutSatir];
  const tahmin = satirKutulari.map(k => k.textContent).join("");

  if (tahmin.length < KELIME_UZUNLUGU) {
    mesajGoster("5 harf girmelisiniz!", true);
    satiriSalla(mevcutSatir);
    return;
  }

  if (!kelimeGecerliMi(tahmin)) {
    mesajGoster("Geçerli bir kelime değil!", true);
    satiriSalla(mevcutSatir);
    return;
  }

  const tahminHarfleri = [...buyukHarfYap(tahmin)];
  const sonuc = tahminiDegerlendir(tahminHarfleri);

  await satiriAc(mevcutSatir, tahminHarfleri, sonuc);
  tusDurumlariniGuncelle(tahminHarfleri, sonuc);

  if (tahminHarfleri.join("") === gizliKelime) {
    oyunBitti = true;
    const denemeSayisi = mevcutSatir + 1;
    mesajGoster(`Tebrikler! ${denemeSayisi}. denemede buldunuz!`, false, 4000);
    bitisPaneliniGoster(true, denemeSayisi);
    return;
  }

  mevcutSatir++;
  mevcutSutun = 0;

  if (mevcutSatir >= MAKS_DENEME) {
    oyunBitti = true;
    mesajGoster(`Maalesef! Kelime: ${gizliKelime}`, false, 4000);
    bitisPaneliniGoster(false);
  }
}

function tusuIsle(tus) {
  if (oyunBitti) return;

  if (tus === "SIL" || tus === "BACKSPACE") {
    if (mevcutSutun > 0) {
      mevcutSutun--;
      kutular[mevcutSatir][mevcutSutun].textContent = "";
      kutular[mevcutSatir][mevcutSutun].classList.remove("dolu");
    }
    return;
  }

  if (tus === "GIR") {
    tahminiGonder();
    return;
  }

  const harf = buyukHarfYap(tus);
  if (harf.length !== 1 || mevcutSutun >= KELIME_UZUNLUGU) return;

  kutular[mevcutSatir][mevcutSutun].textContent = harf;
  kutular[mevcutSatir][mevcutSutun].classList.add("dolu");
  mevcutSutun++;
}

function bitisPaneliniGoster(kazandiMi, denemeSayisi) {
  bitisMetinEl.textContent = kazandiMi
    ? `${denemeSayisi}. denemede kazandınız!`
    : `Kaybettiniz. Kelime: ${gizliKelime}`;
  bitisPanelEl.classList.remove("gizli");
}

function oyunuBaslat() {
  gizliKelime = gizliKelimeSec();
  mevcutSatir = 0;
  mevcutSutun = 0;
  oyunBitti = false;
  tusDurumlari = {};
  tahtaOlustur();
  klavyeOlustur();
  bitisPanelEl.classList.add("gizli");
  mesajEl.className = "mesaj";
}

function oyunaOdaklan() {
  uygulamaEl.focus({ preventScroll: true });
}

function tusBasildi(e) {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (!(e.key === "Enter" || e.key === "Backspace" || e.key.length === 1)) return;

  e.preventDefault();

  if (e.key === "Enter") tusuIsle("GIR");
  else if (e.key === "Backspace") tusuIsle("SIL");
  else tusuIsle(e.key);
}

// Tarayıcının geri gitmesini engelle
history.pushState(null, "", location.href);
window.addEventListener("popstate", () => {
  history.pushState(null, "", location.href);
});

document.addEventListener("keydown", tusBasildi, true);
uygulamaEl.addEventListener("click", oyunaOdaklan);
tekrarOynaBtn.addEventListener("click", () => {
  oyunuBaslat();
  oyunaOdaklan();
});

oyunaOdaklan();
oyunuBaslat();
