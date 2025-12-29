import fs from 'fs';
import https from 'https';
import path from 'path';

const destDir = 'd:/GameCart-1/client/public/images';

const downloads = [
    { name: 'paypal.png', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/200px-PayPal.svg.png' },
    { name: 'vodafone.png', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Vodafone_icon.svg/200px-Vodafone_icon.svg.png' }
];

downloads.forEach(d => {
    const file = fs.createWriteStream(path.join(destDir, d.name));
    https.get(d.url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
        if (res.statusCode === 200) {
            res.pipe(file);
            file.on('finish', () => console.log(`Downloaded ${d.name}`));
        } else {
            console.log(`Failed ${d.name}: ${res.statusCode}`);
        }
    });
});
