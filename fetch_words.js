const fs = require("fs");
const https = require("https");

const PAGES = [
  "A-ile-baslayan-5-harfli-kelimeler",
  "B-ile-baslayan-5-harfli-kelimeler",
  "C-ile-baslayan-5-harfli-kelimeler",
  "Ç-ile-baslayan-5-harfli-kelimeler",
  "D-ile-baslayan-5-harfli-kelimeler",
  "E-ile-baslayan-5-harfli-kelimeler",
  "F-ile-baslayan-5-harfli-kelimeler",
  "G-ile-baslayan-5-harfli-kelimeler",
  "H-ile-baslayan-5-harfli-kelimeler",
  "I-ile-baslayan-5-harfli-kelimeler",
  "\u0130-ile-baslayan-5-harfli-kelimeler",
  "J-ile-baslayan-5-harfli-kelimeler",
  "K-ile-baslayan-5-harfli-kelimeler",
  "L-ile-baslayan-5-harfli-kelimeler",
  "M-ile-baslayan-5-harfli-kelimeler",
  "N-ile-baslayan-5-harfli-kelimeler",
  "O-ile-baslayan-5-harfli-kelimeler",
  "Ö-ile-baslayan-5-harfli-kelimeler",
  "P-ile-baslayan-5-harfli-kelimeler",
  "R-ile-baslayan-5-harfli-kelimeler",
  "S-ile-baslayan-5-harfli-kelimeler",
  "Ş-ile-baslayan-5-harfli-kelimeler",
  "T-ile-baslayan-5-harfli-kelimeler",
  "U-ile-baslayan-5-harfli-kelimeler",
  "Ü-ile-baslayan-5-harfli-kelimeler",
  "V-ile-baslayan-5-harfli-kelimeler",
  "Y-ile-baslayan-5-harfli-kelimeler",
  "Z-ile-baslayan-5-harfli-kelimeler",
];

function fetchPage(path) {
  return new Promise((resolve, reject) => {
    const url = `https://www.kelimetre.com/${encodeURI(path)}`;
    https
      .get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(data));
      })
      .on("error", reject);
  });
}

function extractWords(html) {
  const words = new Set();
  const regex = /<span><B[^>]*>([^<])<\/B>([^<]*)<\/span>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const word = (match[1] + match[2]).toLocaleUpperCase("tr-TR");
    if ([...word].length === 5) {
      words.add(word);
    }
  }
  return words;
}

async function main() {
  const allWords = new Set();

  // Yerel A sayfası varsa kullan
  if (fs.existsSync("a_page.html")) {
    const local = fs.readFileSync("a_page.html", "utf8");
    for (const w of extractWords(local)) allWords.add(w);
    console.log("Local a_page.html:", allWords.size, "words so far");
  }

  for (const page of PAGES) {
    try {
      process.stdout.write(`Fetching ${page}... `);
      const html = await fetchPage(page);
      const before = allWords.size;
      for (const w of extractWords(html)) allWords.add(w);
      console.log(`+${allWords.size - before} (total: ${allWords.size})`);
      await new Promise((r) => setTimeout(r, 300));
    } catch (err) {
      console.log("FAILED:", err.message);
    }
  }

  const sorted = [...allWords].sort((a, b) => a.localeCompare(b, "tr-TR"));
  const invalid = sorted.filter((w) => [...w].length !== 5);
  console.log("\nTotal unique 5-letter words:", sorted.length);
  if (invalid.length) console.log("Invalid length:", invalid);

  fs.writeFileSync("words_fetched.json", JSON.stringify(sorted, null, 0));

  const lines = [];
  for (let i = 0; i < sorted.length; i += 10) {
    lines.push('  "' + sorted.slice(i, i + 10).join('", "') + '"');
  }

  const content = `// Tam 5 harfli Türkçe kelimeler (${sorted.length} adet)
// Kaynak: https://www.kelimetre.com/5-harfli-kelimeler
const VALID_WORDS = [
${lines.join(",\n")}
];
`;

  fs.writeFileSync("words.js", content, "utf8");
  console.log("words.js written.");
}

main().catch(console.error);
