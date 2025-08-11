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
        image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=300&fit=crop',
        gradient: 'from-red-500 to-orange-500',
        icon: 'Zap'
      },
      {
        id: 'adventure',
        name: 'Adventure',
        slug: 'adventure',
        description: 'Epic story-driven adventures',
        image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
        gradient: 'from-green-500 to-teal-500',
        icon: 'Map'
      },
      {
        id: 'strategy',
        name: 'Strategy',
        slug: 'strategy',
        description: 'Think and plan your way to victory',
        image: 'https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=400&h=300&fit=crop',
        gradient: 'from-blue-500 to-purple-500',
        icon: 'Brain'
      },
      {
        id: 'simulation',
        name: 'Simulation',
        slug: 'simulation',
        description: 'Real-world simulation experiences',
        image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=300&fit=crop',
        gradient: 'from-purple-500 to-pink-500',
        icon: 'Settings'
      }
    ];

    await db.insert(categories).values(categoryData);

    // Seed Games
    const gameData = [
      {
        id: 'cyberpunk-2077',
        name: 'Cyberpunk 2077',
        slug: 'cyberpunk-2077',
        description: 'Open-world action-adventure story set in Night City',
        price: '59.99',
        currency: 'USD',
        image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop',
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
        image: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400&h=300&fit=crop',
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
        image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
        category: 'strategy',
        isPopular: true,
        stock: randomStock()
      },
      {
        id: 'cities-skylines',
        name: 'Cities: Skylines',
        slug: 'cities-skylines',
        description: 'Modern city building simulation',
        price: '29.99',
        currency: 'USD',
        image: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1f?w=400&h=300&fit=crop',
        category: 'simulation',
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
        image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=300&fit=crop',
        category: 'action',
        isPopular: true,
        stock: randomStock()
      },
      {
        id: 'assassins-creed',
        name: 'Assassins Creed Valhalla',
        slug: 'assassins-creed',
        description: 'Become a legendary Viking warrior',
        price: '49.99',
        currency: 'USD',
        image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop',
        category: 'adventure',
        isPopular: false,
        stock: randomStock()
      },
      {
        id: 'total-war',
        name: 'Total War: Warhammer III',
        slug: 'total-war',
        description: 'The cataclysmic conclusion to the Total War trilogy',
        price: '59.99',
        currency: 'USD',
        image: 'https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=400&h=300&fit=crop',
        category: 'strategy',
        isPopular: false,
        stock: randomStock()
      },
      {
        id: 'flight-simulator',
        name: 'Microsoft Flight Simulator',
        slug: 'flight-simulator',
        description: 'Experience the joy of flying with authentic aircraft',
        price: '69.99',
        currency: 'USD',
        image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=300&fit=crop',
        category: 'simulation',
        isPopular: false,
        stock: randomStock()
      },
      {
        id: 'call-of-duty',
        name: 'Call of Duty: Modern Warfare II',
        slug: 'call-of-duty',
        description: 'Experience the global campaign in stunning detail',
        price: '69.99',
        currency: 'USD',
        image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop',
        category: 'action',
        isPopular: true,
        stock: randomStock()
      },
      {
        id: 'horizon-zero',
        name: 'Horizon Zero Dawn',
        slug: 'horizon-zero',
        description: 'Experience Aloys entire legendary quest',
        price: '39.99',
        currency: 'USD',
        image: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400&h=300&fit=crop',
        category: 'adventure',
        isPopular: true,
        stock: randomStock()
      },
      {
        id: 'starcraft-2',
        name: 'StarCraft II',
        slug: 'starcraft-2',
        description: 'The ultimate real-time strategy experience',
        price: '19.99',
        currency: 'USD',
        image: 'https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=400&h=300&fit=crop',
        category: 'strategy',
        isPopular: false,
        stock: randomStock()
      },
      {
        id: 'euro-truck',
        name: 'Euro Truck Simulator 2',
        slug: 'euro-truck',
        description: 'Travel across Europe as king of the road',
        price: '24.99',
        currency: 'USD',
        image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=300&fit=crop',
        category: 'simulation',
        isPopular: false,
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