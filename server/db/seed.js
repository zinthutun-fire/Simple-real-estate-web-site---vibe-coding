import bcrypt from 'bcryptjs';
import { getDb, initSchema } from './schema.js';

const properties = [
  {
    title: 'Modern Luxury Villa',
    location: 'Beverly Hills, CA',
    price: 2500000,
    beds: 5, baths: 4, sqft: 4500,
    type: 'House', status: 'For Sale', badge: 'Featured',
    image: 'https://picsum.photos/seed/prop1/800/600',
    images: JSON.stringify([
      'https://picsum.photos/seed/prop1a/800/600',
      'https://picsum.photos/seed/prop1b/800/600',
      'https://picsum.photos/seed/prop1c/800/600',
      'https://picsum.photos/seed/prop1d/800/600'
    ]),
    description: 'Stunning modern luxury villa nestled in the heart of Beverly Hills. This architectural masterpiece features floor-to-ceiling windows, a chef-inspired kitchen with Italian marble countertops, and a private infinity pool overlooking the city skyline.',
    amenities: JSON.stringify(['Infinity Pool', 'Home Theater', 'Wine Cellar', 'Smart Home System', 'Gym', 'Rooftop Terrace', 'EV Charger', 'Walk-in Closets'])
  },
  {
    title: 'Downtown Penthouse',
    location: 'New York, NY',
    price: 1800000,
    beds: 3, baths: 2, sqft: 2200,
    type: 'Apartment', status: 'For Sale', badge: 'Premium',
    image: 'https://picsum.photos/seed/prop2/800/600',
    images: JSON.stringify([
      'https://picsum.photos/seed/prop2a/800/600',
      'https://picsum.photos/seed/prop2b/800/600',
      'https://picsum.photos/seed/prop2c/800/600',
      'https://picsum.photos/seed/prop2d/800/600'
    ]),
    description: 'Luxurious penthouse in the heart of Manhattan with breathtaking skyline views.',
    amenities: JSON.stringify(['Private Terrace', 'Concierge', 'Fitness Center', 'Rooftop Lounge', 'Parking', 'Storage Unit', 'Pet Friendly'])
  },
  {
    title: 'Suburban Family Home',
    location: 'Austin, TX',
    price: 650000,
    beds: 4, baths: 3, sqft: 2800,
    type: 'House', status: 'For Sale', badge: null,
    image: 'https://picsum.photos/seed/prop3/800/600',
    images: JSON.stringify([
      'https://picsum.photos/seed/prop3a/800/600',
      'https://picsum.photos/seed/prop3b/800/600',
      'https://picsum.photos/seed/prop3c/800/600',
      'https://picsum.photos/seed/prop3d/800/600'
    ]),
    description: 'Beautiful family home in a sought-after Austin neighborhood.',
    amenities: JSON.stringify(['Backyard', 'Hardwood Floors', 'Updated Kitchen', 'Basement', 'Two-car Garage', 'Central A/C', 'Sprinkler System'])
  },
  {
    title: 'Beachfront Condo',
    location: 'Miami, FL',
    price: 950000,
    beds: 2, baths: 2, sqft: 1500,
    type: 'Apartment', status: 'For Sale', badge: 'New',
    image: 'https://picsum.photos/seed/prop4/800/600',
    images: JSON.stringify([
      'https://picsum.photos/seed/prop4a/800/600',
      'https://picsum.photos/seed/prop4b/800/600',
      'https://picsum.photos/seed/prop4c/800/600',
      'https://picsum.photos/seed/prop4d/800/600'
    ]),
    description: 'Stunning beachfront condo with panoramic ocean views.',
    amenities: JSON.stringify(['Ocean View', 'Balcony', 'Pool', 'Spa', 'Beach Access', 'Fitness Center', 'Valet Parking'])
  },
  {
    title: 'Mountain Retreat',
    location: 'Aspen, CO',
    price: 1200000,
    beds: 4, baths: 3, sqft: 3200,
    type: 'House', status: 'For Sale', badge: null,
    image: 'https://picsum.photos/seed/prop5/800/600',
    images: JSON.stringify([
      'https://picsum.photos/seed/prop5a/800/600',
      'https://picsum.photos/seed/prop5b/800/600',
      'https://picsum.photos/seed/prop5c/800/600',
      'https://picsum.photos/seed/prop5d/800/600'
    ]),
    description: 'Charming mountain retreat with breathtaking views of the Rockies.',
    amenities: JSON.stringify(['Fireplace', 'Hot Tub', 'Ski-in/Ski-out', 'Heated Floors', 'Deck', 'Mountain View', 'Garage'])
  },
  {
    title: 'Urban Studio',
    location: 'San Francisco, CA',
    price: 350000,
    beds: 1, baths: 1, sqft: 650,
    type: 'Apartment', status: 'For Sale', badge: 'Affordable',
    image: 'https://picsum.photos/seed/prop6/800/600',
    images: JSON.stringify([
      'https://picsum.photos/seed/prop6a/800/600',
      'https://picsum.photos/seed/prop6b/800/600',
      'https://picsum.photos/seed/prop6c/800/600',
      'https://picsum.photos/seed/prop6d/800/600'
    ]),
    description: 'Chic urban studio in the heart of SF.',
    amenities: JSON.stringify(['Built-in Storage', 'Modern Kitchen', 'Natural Light', 'Laundry in Building', 'Bike Room', 'Near Transit'])
  }
];

initSchema();
const db = getDb();

// Clear existing data
db.exec('DELETE FROM properties');
db.exec('DELETE FROM users');

// Seed properties
const insert = db.prepare(`
  INSERT INTO properties (title, location, price, beds, baths, sqft, type, status, badge, image, images, description, amenities)
  VALUES (@title, @location, @price, @beds, @baths, @sqft, @type, @status, @badge, @image, @images, @description, @amenities)
`);

const insertMany = db.transaction((items) => {
  for (const item of items) insert.run(item);
});

insertMany(properties);
console.log(`Seeded ${properties.length} properties.`);

// Create default admin user
const hash = bcrypt.hashSync('admin123', 10);
db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run('admin', hash);
console.log('Created admin user (admin / admin123).');
