import { db } from './db';
import { games, categories } from '@shared/schema';

// Function to generate random stock between 30-100
const randomStock = () => Math.floor(Math.random() * 71) + 30;

export async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  try {
    // Clear existing data
    await db.delete(games);
    await db.delete(categories);

    // Seed Categories
    const categoryData = [
      {
        id: 'action',
        name: 'Action Games',
        slug: 'action',
        description: 'Fast-paced action and adventure games',
        image: 'https://wallpaperaccess.com/full/267733.jpg',
        gradient: 'from-red-500 to-orange-500',
        icon: 'Zap'
      },
      {
        id: 'adventure',
        name: 'Adventure',
        slug: 'adventure',
        description: 'Epic story-driven adventures',
        image: 'https://wallpaperaccess.com/full/267685.jpg',
        gradient: 'from-green-500 to-teal-500',
        icon: 'Map'
      },
      {
        id: 'strategy',
        name: 'Strategy',
        slug: 'strategy',
        description: 'Think and plan your way to victory',
        image: 'https://wallpaperaccess.com/full/267656.jpg',
        gradient: 'from-blue-500 to-purple-500',
        icon: 'Brain'
      },
      {
        id: 'simulation',
        name: 'Simulation',
        slug: 'simulation',
        description: 'Real-world simulation experiences',
        image: 'https://wallpaperaccess.com/full/267678.jpg',
        gradient: 'from-purple-500 to-pink-500',
        icon: 'Settings'
      }
    ];

    await db.insert(categories).values(categoryData);

    // Seed Games with actual gaming images
    const gameData = [
      {
        id: 'gta-v',
        name: 'Grand Theft Auto V',
        slug: 'gta-v',
        description: 'The biggest, most dynamic and most diverse open world ever',
        price: '29.99',
        currency: 'USD',
        image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/271590/header.jpg',
        category: 'action',
        isPopular: true,
        stock: randomStock()
      },
      {
        id: 'cyberpunk-2077',
        name: 'Cyberpunk 2077',
        slug: 'cyberpunk-2077',
        description: 'Open-world action-adventure story set in Night City',
        price: '59.99',
        currency: 'USD',
        image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/header.jpg',
        category: 'action',
        isPopular: true,
        stock: randomStock()
      },
      {
        id: 'witcher-3',
        name: 'The Witcher 3: Wild Hunt',
        slug: 'witcher-3',
        description: 'Story-driven open world RPG set in a fantasy universe',
        price: '39.99',
        currency: 'USD',
        image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/292030/header.jpg',
        category: 'adventure',
        isPopular: true,
        stock: randomStock()
      },
      {
        id: 'red-dead-2',
        name: 'Red Dead Redemption 2',
        slug: 'red-dead-2',
        description: 'Epic tale of life in Americas unforgiving heartland',
        price: '59.99',
        currency: 'USD',
        image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1174180/header.jpg',
        category: 'action',
        isPopular: true,
        stock: randomStock()
      },
      {
        id: 'call-of-duty',
        name: 'Call of Duty: Modern Warfare II',
        slug: 'call-of-duty',
        description: 'Experience the global campaign in stunning detail',
        price: '69.99',
        currency: 'USD',
        image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1938090/header.jpg',
        category: 'action',
        isPopular: true,
        stock: randomStock()
      },
      {
        id: 'minecraft',
        name: 'Minecraft',
        slug: 'minecraft',
        description: 'Build anything you can imagine with blocks',
        price: '26.95',
        currency: 'USD',
        image: 'https://www.minecraft.net/content/dam/games/minecraft/key-art/Minecraft-Star-Wars_TLM-16x9.jpg',
        category: 'simulation',
        isPopular: true,
        stock: randomStock()
      },
      {
        id: 'fifa-24',
        name: 'EA Sports FC 24',
        slug: 'fifa-24',
        description: 'Experience the worlds game with 19,000+ players',
        price: '59.99',
        currency: 'USD',
        image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/2195250/header.jpg',
        category: 'action',
        isPopular: true,
        stock: randomStock()
      },
      {
        id: 'valorant',
        name: 'VALORANT',
        slug: 'valorant',
        description: '5v5 character-based tactical FPS',
        price: '0.00',
        currency: 'USD',
        image: 'https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blt5df1238dd44f1d90/5eb26f0ed7090c6e2e8efcbb/V_AGENTS_587x900_Sage.jpg',
        category: 'action',
        isPopular: true,
        stock: randomStock()
      },
      {
        id: 'apex-legends',
        name: 'Apex Legends',
        slug: 'apex-legends',
        description: 'Choose from a diverse cast of Legends',
        price: '0.00',
        currency: 'USD',
        image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1172470/header.jpg',
        category: 'action',
        isPopular: true,
        stock: randomStock()
      },
      {
        id: 'fortnite',
        name: 'Fortnite',
        slug: 'fortnite',
        description: 'Battle Royale with building mechanics',
        price: '0.00',
        currency: 'USD',
        image: 'https://cdn2.unrealengine.com/fortnite-chapter-4-season-4-battle-royale-1920x1080-7c2cd4b80c53.jpg',
        category: 'action',
        isPopular: true,
        stock: randomStock()
      },
      {
        id: 'assassins-creed',
        name: 'Assassins Creed Mirage',
        slug: 'assassins-creed',
        description: 'Experience the story of Basim in 9th-century Baghdad',
        price: '49.99',
        currency: 'USD',
        image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/2369390/header.jpg',
        category: 'adventure',
        isPopular: false,
        stock: randomStock()
      },
      {
        id: 'elden-ring',
        name: 'Elden Ring',
        slug: 'elden-ring',
        description: 'Rise, Tarnished, and be guided by grace',
        price: '59.99',
        currency: 'USD',
        image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/header.jpg',
        category: 'adventure',
        isPopular: true,
        stock: randomStock()
      },
      {
        id: 'horizon-zero',
        name: 'Horizon Zero Dawn',
        slug: 'horizon-zero',
        description: 'Experience Aloys legendary quest in a world of machines',
        price: '39.99',
        currency: 'USD',
        image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1151640/header.jpg',
        category: 'adventure',
        isPopular: true,
        stock: randomStock()
      },
      {
        id: 'civilization-6',
        name: 'Civilization VI',
        slug: 'civilization-6',
        description: 'Build an empire to stand the test of time',
        price: '49.99',
        currency: 'USD',
        image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/289070/header.jpg',
        category: 'strategy',
        isPopular: true,
        stock: randomStock()
      },
      {
        id: 'total-war',
        name: 'Total War: Warhammer III',
        slug: 'total-war',
        description: 'The cataclysmic conclusion to the Total War trilogy',
        price: '59.99',
        currency: 'USD',
        image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1142710/header.jpg',
        category: 'strategy',
        isPopular: false,
        stock: randomStock()
      },
      {
        id: 'cities-skylines',
        name: 'Cities: Skylines',
        slug: 'cities-skylines',
        description: 'Modern city building simulation',
        price: '29.99',
        currency: 'USD',
        image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/255710/header.jpg',
        category: 'simulation',
        isPopular: true,
        stock: randomStock()
      },
      {
        id: 'flight-simulator',
        name: 'Microsoft Flight Simulator',
        slug: 'flight-simulator',
        description: 'Experience the joy of flying with authentic aircraft',
        price: '69.99',
        currency: 'USD',
        image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1250410/header.jpg',
        category: 'simulation',
        isPopular: false,
        stock: randomStock()
      },
      {
        id: 'the-sims-4',
        name: 'The Sims 4',
        slug: 'the-sims-4',
        description: 'Create unique Sims and control their lives',
        price: '19.99',
        currency: 'USD',
        image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1222670/header.jpg',
        category: 'simulation',
        isPopular: true,
        stock: randomStock()
      }
    ];

    await db.insert(games).values(gameData);

    console.log('✅ Database seeded successfully!');
    console.log(`📦 Created ${categoryData.length} categories`);
    console.log(`🎮 Created ${gameData.length} games`);
    console.log('📊 All games have random stock between 30-100 units');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run seed if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => {
      console.log('🎉 Seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}