import https from 'https';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env manually (no dotenv dependency on ESM)
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env');
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(line => line.includes('='))
    .map(line => line.split('=').map(s => s.trim()))
);

const KEY = env.INDEXNOW_KEY;
const BING_API_KEY = env.BING_API_KEY;
const HOST = 'nasrallahrafi.me';

if (!KEY || !BING_API_KEY) {
  console.error('❌ Missing INDEXNOW_KEY or BING_API_KEY in .env');
  process.exit(1);
}

const URLS = [
  `https://${HOST}/`,
  `https://${HOST}/project-rendezvous.html`,
  `https://${HOST}/project-thermal.html`,
  `https://${HOST}/project-waveguide.html`,
  `https://${HOST}/apprenticeship-rafi.html`,
  `https://${HOST}/internship-onee.html`,
  `https://${HOST}/internship-smcv.html`,
];

// ── Step 1: Submit via IndexNow protocol ──────────────────────────
function submitIndexNow() {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      host: HOST,
      key: KEY,
      keyLocation: `https://${HOST}/${KEY}.txt`,
      urlList: URLS,
    });

    const options = {
      hostname: 'api.indexnow.org',
      path: '/indexnow',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      if (res.statusCode === 200 || res.statusCode === 202) {
        console.log(`✅ IndexNow: ${res.statusCode} — URLs queued for crawling.`);
        resolve();
      } else if (res.statusCode === 403) {
        console.error('❌ IndexNow 403 — key file not found. Push to GitHub first.');
        reject(new Error('403'));
      } else if (res.statusCode === 429) {
        console.error('⚠️  IndexNow 429 — too many requests. Wait before retrying.');
        reject(new Error('429'));
      } else {
        console.error(`❌ IndexNow ${res.statusCode} — unexpected response.`);
        reject(new Error(String(res.statusCode)));
      }
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// ── Step 2: Submit each URL via Bing URL Submission API ───────────
function submitToBingApi(url) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ siteUrl: `https://${HOST}/`, url });

    const options = {
      hostname: 'ssl.bing.com',
      path: `/webmaster/api.svc/json/SubmitUrl?apikey=${BING_API_KEY}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`  ✅ Bing API: submitted ${url}`);
          resolve();
        } else {
          console.error(`  ❌ Bing API ${res.statusCode} for ${url}: ${body}`);
          resolve(); // continue even on individual failure
        }
      });
    });

    req.on('error', (e) => {
      console.error(`  ❌ Bing API request error for ${url}: ${e.message}`);
      resolve();
    });

    req.write(payload);
    req.end();
  });
}

// ── Main ──────────────────────────────────────────────────────────
(async () => {
  console.log(`\n🔍 Submitting ${URLS.length} URLs to Bing...\n`);

  console.log('── IndexNow protocol ──');
  await submitIndexNow();

  console.log('\n── Bing URL Submission API ──');
  for (const url of URLS) {
    await submitToBingApi(url);
    // small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 300));
  }

  console.log('\n🎉 Done. Bing will crawl all pages within minutes.');
})();
