export type MaterialProduct = {
  Id: string;
  ProductName: string;
  Latitude: number;
  Longitude: number;
  Product: string;
};

export const sampleProducts: MaterialProduct[] = [
  {
    Id: 'prod-001',
    ProductName: 'Low-Carbon Concrete Mix',
    Latitude: 51.509865,
    Longitude: -0.118092,
    Product: 'Concrete'
  },
  {
    Id: 'prod-002',
    ProductName: 'Reclaimed Steel Beam',
    Latitude: 52.486244,
    Longitude: -1.890401,
    Product: 'Steel'
  },
  {
    Id: 'prod-003',
    ProductName: 'Engineered Timber Panel',
    Latitude: 53.480759,
    Longitude: -2.242631,
    Product: 'Timber'
  },
  {
    Id: 'prod-004',
    ProductName: 'Recycled Aluminium Cladding',
    Latitude: 55.953251,
    Longitude: -3.188267,
    Product: 'Facade'
  },
  {
    Id: 'prod-005',
    ProductName: 'Insulated Brick Unit',
    Latitude: 50.719164,
    Longitude: -1.880769,
    Product: 'Masonry'
  }
];