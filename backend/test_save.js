import fetch from 'node-fetch';

const gameId = 'game_1767646974994';
const packages = [
  { name: '830 Jewels', price: 135, discountPrice: null },
  { name: '2333 Jewels', price: 280, discountPrice: null },
  { name: '5150 Jewels', price: 560, discountPrice: null },
  { name: '10400 Jewels', price: 1120, discountPrice: null },
  { name: '13000 Jewels', price: 1450, discountPrice: null },
  { name: '27800 Jewels', price: 2750, discountPrice: null },
  { name: '56000 Jewels', price: 5250, discountPrice: null }
];

const response = await fetch(`http://localhost:3001/api/games/${gameId}/packages/key`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-admin-key': 'testkey123'
  },
  body: JSON.stringify({ packages })
});

const result = await response.json();
console.log('Response:', result);