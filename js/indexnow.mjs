import https from 'https';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const HOST = 'nasrallahrafi.me';

// ── Load .env manually (no dotenv dependency on ESM) ──────────────
const envPath = join(__dirname, '..', '.env');
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(line => line.includes('='))
    .map(line => line.split('=').map(s => s.trim()))
);

const KEY = env.INDEXNOW_KEY;
const BING_API_KEY = env.BING_API_KEY; // now optional — see Step 2

// FIX 1: IndexNow no longer depends on the Bing key. Only the key it
// actually needs is required to run.
if (!KEY) {
  console.error('❌ Missing INDEXNOW_KEY in .env');
  process.exit(1);
}

// FIX 2: URLs are read from sitemap.xml instead of a hand-maintained
// array, so this list can never drift out of sync with the site again.
// (Make sure sitemap.xml itself lists every page you want indexed —
// see the corrected sitemap.xml alongside this file.)
const sitemapPath = join(__dirname, '..', 'sitemap.xml');
const sitemapXml = readFileSync(sitemapPath, 'utf8');
const URLS = [...sitemapXml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);

if (URLS.length === 0) {
  console.error('❌ No <loc> entries found in sitemap.xml — nothing to submit.');
  process.exit(1);
}

// ── Step 1: Submit via IndexNow protocol ───────────────────────────
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

// ── Step 2: Submit each URL via Bing URL Submission API (optional) ─
function submitToBingApi(url) {
  return new Promise((resolve) => {
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
        } else {
          console.error(`  ❌ Bing API ${res.statusCode} for ${url}: ${body}`);
        }
        resolve(); // continue even on individual failure
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

// ── Main ─────────────────────────────────────────────────────────
(async () => {
  console.log(`\n🔍 Submitting ${URLS.length} URLs (from sitemap.xml)...\n`);

  console.log('── IndexNow protocol ──');
  await submitIndexNow();

  // FIX 1 (cont.): Bing submission is now skipped gracefully instead
  // of blocking the whole script when the key is absent.
  if (BING_API_KEY) {
    console.log('\n── Bing URL Submission API ──');
    for (const url of URLS) {
      await submitToBingApi(url);
      await new Promise(r => setTimeout(r, 300));
    }
  } else {
    console.log('\n⚠️  Skipping Bing URL Submission API — BING_API_KEY not set in .env.');
    console.log('   IndexNow already notifies Bing (and other participating engines) on its own.');
  }

  console.log('\n🎉 Done.');
})();
