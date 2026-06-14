export const electronicsCategories = [
    'Mobile Phones',
    'Laptops',
    'Tablets',
    'Gaming Consoles',
    'Computer Accessories',
    'Mobile Accessories',
    'Smart Watches',
    'Cameras',
    'Headphones & Audio',
    'TVs & Home Electronics',
    'Used Electronics',
    'Refurbished Electronics'
];
export const electronicsFilters = {
    brand: ['Apple', 'Samsung', 'Sony', 'Dell', 'HP', 'Lenovo', 'Microsoft', 'Nintendo', 'PlayStation', 'Xbox', 'Bose', 'Other'],
    condition: ['New', 'Like New', 'Open Box', 'Used', 'Refurbished'],
    discount: ['Any discount', '10% or more', '25% or more', '50% or more'],
    location: ['Available in my country', 'My state', 'My city', 'USA', 'India', 'Global'],
    priceRange: ['Under $25', '$25 - $50', '$50 - $100', '$100 - $250', '$250 - $500', '$500 - $1000', '$1000+'],
    rating: ['4.5 stars and above', '4 stars and above', '3 stars and above'],
    returnEligible: ['Return eligible', 'No returns', 'Seller policy', 'Admin review required'],
    sellerVerification: ['Verified sellers only', 'All sellers'],
    shipping: ['Shipping available', 'Free shipping', 'Paid shipping'],
    warranty: ['Warranty available', 'Manufacturer warranty', 'Seller warranty', 'No warranty']
};
export const sortOptions = [
    'Best Match',
    'Highest Discount',
    'Lowest Price',
    'Highest Price',
    'Top Rated',
    'Newest',
    'Best Condition',
    'Warranty Available'
];
export const electronicsProducts = [
    {
        brand: 'Apple',
        category: 'Mobile Phones',
        condition: 'Like New',
        id: 'electronics-iphone-15-pro',
        location: 'USA',
        originalPrice: 899,
        price: 799,
        returnEligible: true,
        sellerName: 'Verified seller',
        sellerRating: 4.8,
        shippingAvailable: true,
        title: 'iPhone 15 Pro 256GB',
        warrantyAvailable: true
    },
    {
        brand: 'Apple',
        category: 'Laptops',
        condition: 'Used',
        id: 'electronics-macbook-air-m1',
        location: 'USA',
        price: 499,
        returnEligible: true,
        sellerName: 'Verified seller',
        sellerRating: 4.6,
        shippingAvailable: true,
        title: 'MacBook Air M1 8GB / 256GB',
        warrantyAvailable: false
    },
    {
        brand: 'Sony',
        category: 'Headphones & Audio',
        condition: 'Open Box',
        discountLabel: '20% OFF',
        id: 'electronics-sony-headphones',
        location: 'USA',
        originalPrice: 319,
        price: 249,
        returnEligible: true,
        sellerName: 'Verified seller',
        sellerRating: 4.9,
        shippingAvailable: true,
        title: 'Sony WH-1000XM5 Headphones',
        warrantyAvailable: true
    },
    {
        brand: 'Nintendo',
        category: 'Gaming Consoles',
        condition: 'Refurbished',
        id: 'electronics-switch-oled',
        location: 'USA',
        originalPrice: 299,
        price: 249,
        returnEligible: false,
        sellerName: 'Verified seller',
        sellerRating: 4.7,
        shippingAvailable: true,
        title: 'Nintendo Switch OLED',
        warrantyAvailable: true
    },
    {
        brand: 'Samsung',
        category: 'TVs & Home Electronics',
        condition: 'New',
        id: 'electronics-samsung-tv',
        location: 'USA',
        price: 399,
        returnEligible: true,
        sellerName: 'Verified seller',
        sellerRating: 4.5,
        shippingAvailable: true,
        title: 'Samsung 55-inch Smart TV',
        warrantyAvailable: true
    }
];
export const electronicsConditionIcons = {
    'Like New': 'sparkles-outline',
    New: 'shield-checkmark-outline',
    'Open Box': 'cube-outline',
    Refurbished: 'construct-outline',
    Used: 'refresh-outline'
};
