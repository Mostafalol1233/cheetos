import fs from 'fs';
import https from 'https';
import path from 'path';

const images = [
    { name: 'paypal.png', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/512px-PayPal.svg.png' },
    { name: 'visa.png', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/512px-Visa_Inc._logo.svg.png' },
    { name: 'mastercard.png', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/512px-Mastercard-logo.svg.png' },
    { name: 'vodafone.png', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Vodafone_icon.svg/512px-Vodafone_icon.svg.png' }
];

const destDir = 'd:/GameCart-1/client/public/images';

if (!fs.existsSync(destDir)){
    fs.mkdirSync(destDir, { recursive: true });
}

images.forEach(img => {
    const file = fs.createWriteStream(path.join(destDir, img.name));
    https.get(img.url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, function(response) {
        if (response.statusCode === 200) {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                console.log(`Downloaded ${img.name}`);
            });
        } else {
            console.error(`Failed to download ${img.name}: ${response.statusCode}`);
            response.resume();
        }
    }).on('error', (err) => {
        console.error(`Error downloading ${img.name}: ${err.message}`);
    });
});
