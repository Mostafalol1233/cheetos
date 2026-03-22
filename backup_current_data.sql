-- Backup of current database structure and data
-- Generated on 2024-08-11

-- Categories backup
INSERT INTO categories_backup (id, name, slug, description, image, gradient, icon) VALUES
('hot-deals', 'HOT DEALS', 'hot-deals', 'Limited time offers and special prices', 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600', 'from-red-600 to-orange-600', 'Zap'),
('online-games', 'ONLINE GAMES', 'online-games', 'PC and console game credits', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600', 'from-blue-600 to-purple-700', 'Monitor'),
('mobile-games', 'MOBILE GAMES', 'mobile-games', 'Mobile game currencies and items', 'https://pixabay.com/get/g90b527228ccda2f18b3f0e3084562c379b9c93c65ed89df111aca00916e1de7d1ddf33e39091e139d840610f9b4eafcf17b00169a6a1680e66eea5c28fed5595_1280.jpg', 'from-red-600 to-pink-700', 'Smartphone'),
('gift-cards', 'GIFT CARDS', 'gift-cards', 'Digital vouchers and gift cards', 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600', 'from-green-600 to-teal-700', 'Gift');

-- Games backup with current pricing structure
-- This backup preserves the old Arabic gaming store structure with classic games
-- All games use attached_assets images and Egyptian pricing in EGP