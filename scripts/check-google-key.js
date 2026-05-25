const crypto = require('crypto');
const fs = require('fs');

const env = Object.fromEntries(
  fs
    .readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .filter((line) => /^\s*[^#=]+=/.test(line))
    .map((line) => {
      const index = line.indexOf('=');
      return [line.slice(0, index).trim(), line.slice(index + 1)];
    })
);

function cleanEnvValue(value) {
  if (!value) return '';

  let cleaned = value.trim();
  if (cleaned.endsWith(',')) {
    cleaned = cleaned.slice(0, -1).trim();
  }

  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1);
  }

  return cleaned;
}

const key = cleanEnvValue(env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY)
  .replace(/\\\\n/g, '\n')
  .replace(/\\n/g, '\n');

crypto.createPrivateKey(key);
console.log('PRIVATE_KEY_OK');
