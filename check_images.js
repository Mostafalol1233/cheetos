import fs from 'fs';
import https from 'https';
import path from 'path';

const destDir = 'd:/GameCart-1/client/public/images';

const files = ['paypal.png', 'visa.png', 'mastercard.png', 'vodafone.png'];

files.forEach(f => {
    const p = path.join(destDir, f);
    if (fs.existsSync(p)) {
        const stats = fs.statSync(p);
        console.log(`${f}: ${stats.size} bytes`);
    } else {
        console.log(`${f}: Missing`);
    }
});

// Redownload Vodafone
const vfUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Vodafone_icon.svg/512px-Vodafone_icon.svg.png';
const vfFile = fs.createWriteStream(path.join(destDir, 'vodafone.png'));
https.get(vfUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
    if (res.statusCode === 200) {
        res.pipe(vfFile);
        vfFile.on('finish', () => console.log('Redownloaded vodafone.png'));
    } else {
        console.log(`Vodafone download failed: ${res.statusCode}`);
    }
});
