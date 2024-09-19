const express = require('express');
const { resolve } = require('node:path');
const { execSync } = require('child_process');
const crypto = require('crypto');
const { readFileSync } = require('fs');

const routes = JSON.parse(readFileSync('./routes.json'));

const sigHeaderName = 'X-Hub-Signature-256';
const sigHashAlg = 'sha256';

const app = express();
app.use(express.json());

const sh_ok = (folder) => `/home/node/app/telegram-notif.sh -p ${folder} -m "updated successfully ✅"`;
const sh_ko = (folder) => `/home/node/app/telegram-notif.sh -p ${folder} -m "failed to update ❌"`;

const verifyPostData = (secret) => {
  return (req, res, next) => {
    if (!req.body) {
      return next('Request body empty');
    }

    const data = JSON.stringify(req.body);
    const sig = Buffer.from(req.get(sigHeaderName) || '', 'utf8');
    const hmac = crypto.createHmac(sigHashAlg, secret);
    const digest = Buffer.from(sigHashAlg + '=' + hmac.update(data).digest('hex'), 'utf8');
    if (sig.length !== digest.length || !crypto.timingSafeEqual(digest, sig)) {
      return next(`Request body digest (${digest}) did not match ${sigHeaderName} (${sig})`);
    }

    return next();
  }
};

const cloneRepo = (folder, branch, command) => {
  if (branch.trim() !== '') {
    execSync(`git pull origin ${branch} && ${command} && ${sh_ok(folder)} || ${sh_ko(folder)}`, {
      stdio: [0, 1, 2],
      cwd: resolve(__dirname, folder),
    })
  } else {
    execSync(`${command} && ${sh_ok(folder)} || ${sh_ko(folder)}`, {
      stdio: [0, 1, 2],
      cwd: resolve(__dirname, folder),
    })
  }
}

for (let [route, data] of Object.entries(routes)) {
  app.post(route, verifyPostData(data.secret), (req, res) => {
    console.log(`Cloning ${data.folder} repository...`);
    cloneRepo(data.folder, data.branch, data.command);
    res.status(204).send('{}');
  });
}

app.use((err, req, res, _) => {
  if (err) console.error(err);
  res.status(403).send('Request body was not signed or verification failed');
});

app.listen(5000, () => {
  console.log('Server Running on port 5000');
})

