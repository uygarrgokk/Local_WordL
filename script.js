const KELIME_UZUNLUGU = 5;
const MAKS_DENEME = 6;

const TURKCE_KLAVYE = [
  ["E", "R", "T", "Y", "U", "I", "O", "P", "Ğ", "Ü"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Ş", "İ"],
  ["GIR", "Z", "C", "V", "B", "N", "M", "Ö", "Ç", "SIL"]
];

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
  const $tahta = $("#tahta");
  $tahta.empty();
  kutular = [];

  for (let satir = 0; satir < MAKS_DENEME; satir++) {
    const $satir = $("<div>").addClass("satir");
    const satirKutulari = [];

    for (let sutun = 0; sutun < KELIME_UZUNLUGU; sutun++) {
      const $kutu = $("<div>").addClass("kutu");
      $satir.append($kutu);
      satirKutulari.push($kutu[0]);
    }

    $tahta.append($satir);
    kutular.push(satirKutulari);
  }
}

function klavyeOlustur() {
  const $klavye = $("#klavye");
  $klavye.empty();

  TURKCE_KLAVYE.forEach(satir => {
    const $satir = $("<div>").addClass("klavye-satir");

    satir.forEach(tus => {
      const $dugme = $("<button>")
        .attr("type", "button")
        .addClass("tus")
        .attr("data-tus", tus)
        .text(tus === "GIR" ? "GİR" : tus === "SIL" ? "SİL" : tus);

      if (tus === "GIR" || tus === "SIL") {
        $dugme.addClass("genis");
      }

      $satir.append($dugme);
    });

    $klavye.append($satir);
  });
}

function mesajGoster(metin, hataMi = false, sure = 2000) {
  const $mesaj = $("#mesaj");
  $mesaj.text(metin).attr("class", "mesaj goster" + (hataMi ? " hata" : ""));
  clearTimeout(mesajGoster._zamanlayici);
  mesajGoster._zamanlayici = setTimeout(() => {
    $mesaj.attr("class", "mesaj");
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
    const $tus = $(`#klavye [data-tus="${harf}"]`);
    if ($tus.length) {
      $tus.removeClass("dogru yanlis-yerde yok").addClass(durum);
    }
  }
}

function satiriAc(satirIndeksi, tahmin, sonuc) {
  return new Promise(bitir => {
    kutular[satirIndeksi].forEach((kutu, i) => {
      setTimeout(() => {
        $(kutu).addClass("cevir " + sonuc[i]).text(tahmin[i]);
        if (i === KELIME_UZUNLUGU - 1) setTimeout(bitir, 300);
      }, i * 300);
    });
  });
}

function satiriSalla(satirIndeksi) {
  const $satir = $("#tahta .satir").eq(satirIndeksi);
  $satir.addClass("salla");
  setTimeout(() => $satir.removeClass("salla"), 500);
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
      $(kutular[mevcutSatir][mevcutSutun]).text("").removeClass("dolu");
    }
    return;
  }

  if (tus === "GIR") {
    tahminiGonder();
    return;
  }

  const harf = buyukHarfYap(tus);
  if (harf.length !== 1 || mevcutSutun >= KELIME_UZUNLUGU) return;

  $(kutular[mevcutSatir][mevcutSutun]).text(harf).addClass("dolu");
  mevcutSutun++;
}

function bitisPaneliniGoster(kazandiMi, denemeSayisi) {
  $("#bitis-metin").text(
    kazandiMi
      ? `${denemeSayisi}. denemede kazandınız!`
      : `Kaybettiniz. Kelime: ${gizliKelime}`
  );
  $("#bitis-panel").removeClass("gizli");
}

function oyunuBaslat() {
  gizliKelime = gizliKelimeSec();
  mevcutSatir = 0;
  mevcutSutun = 0;
  oyunBitti = false;
  tusDurumlari = {};
  tahtaOlustur();
  klavyeOlustur();
  $("#bitis-panel").addClass("gizli");
  $("#mesaj").attr("class", "mesaj");
}

function oyunaOdaklan() {
  $(".uygulama")[0].focus({ preventScroll: true });
}

function tusBasildi(e) {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (!(e.key === "Enter" || e.key === "Backspace" || e.key.length === 1)) return;

  e.preventDefault();

  if (e.key === "Enter") tusuIsle("GIR");
  else if (e.key === "Backspace") tusuIsle("SIL");
  else tusuIsle(e.key);
}

$(function () {
  // Klavye tuşları (dinamik — event delegation)
  $("#klavye").on("mousedown", ".tus", function (e) {
    e.preventDefault();
  });

  $("#klavye").on("click", ".tus", function () {
    tusuIsle($(this).data("tus"));
    oyunaOdaklan();
  });

  // Fiziksel klavye
  $(document).on("keydown", tusBasildi);

  // Uygulamaya tıklayınca odak
  $(".uygulama").on("click", oyunaOdaklan);

  // Tekrar oyna
  $("#tekrar-oyna").on("click", function () {
    oyunuBaslat();
    oyunaOdaklan();
  });

  // Tarayıcı geri tuşu
  history.pushState(null, "", location.href);
  $(window).on("popstate", function () {
    history.pushState(null, "", location.href);
  });

  oyunaOdaklan();
  oyunuBaslat();
});
