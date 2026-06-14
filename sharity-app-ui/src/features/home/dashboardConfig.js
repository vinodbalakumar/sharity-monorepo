export const sidebarItems = [
    { icon: 'home-outline', label: 'Home' },
    { icon: 'storefront-outline', label: 'Marketplace' },
    { icon: 'receipt-outline', label: 'Orders' },
    { icon: 'gift-outline', label: 'Rewards' },
    { icon: 'pricetags-outline', label: 'Sell' },
    { icon: 'wallet-outline', label: 'Wallet' },
    { icon: 'person-outline', label: 'Profile' }
];
export const mobileTabItems = [
    { icon: 'home-outline', label: 'Home' },
    { icon: 'storefront-outline', label: 'Marketplace' },
    { icon: 'receipt-outline', label: 'Orders' },
    { icon: 'pricetags-outline', label: 'Sell' },
    { icon: 'person-outline', label: 'Profile' }
];
export const quickActionConfigs = [
    {
        audience: 'authenticated',
        icon: 'receipt-outline',
        label: 'My Orders',
        requiresMarketplaceAccess: true,
        route: 'orders',
        text: 'Recent orders and digital purchases.'
    },
    {
        audience: 'buyer',
        fallbackText: 'Rewards activate when buyer marketplaces are enabled for your country.',
        icon: 'gift-outline',
        label: 'Rewards',
        requiresMarketplaceAccess: true,
        route: 'rewards',
        text: 'Coupons, cashback, points, and referral rewards.'
    },
    {
        audience: 'buyer',
        fallbackText: 'Cart unlocks when shopping is enabled for your current country.',
        icon: 'cart-outline',
        label: 'Cart',
        requiresMarketplaceAccess: true,
        route: 'cart',
        text: 'Review items before checkout.'
    },
    {
        audience: 'seller',
        fallbackText: 'Seller tools unlock after seller access is enabled for your role and country.',
        icon: 'pricetags-outline',
        label: 'Sell',
        requiresSellerAccess: true,
        route: 'sellerVerification',
        text: 'Open seller dashboard, listings, and onboarding.'
    },
    {
        audience: 'authenticated',
        icon: 'wallet-outline',
        label: 'Wallet',
        route: 'wallet',
        text: 'Balances, payouts, and transaction history.'
    }
];
export const serviceConfigs = [
    {
        activeCategoryCodes: ['GIFT_CARDS', 'MARKETPLACE_GIFT_CARDS', 'GAMING', 'MARKETPLACE_GAMING'],
        code: 'DIGITAL',
        ctaLabel: 'Browse',
        description: 'Buy digital codes, gaming codes, software keys, gift cards, subscriptions, and downloadable products.',
        icon: 'keypad-outline',
        name: 'Digital Marketplace',
        sourceVerticalCodes: ['MARKETPLACE', 'GIFT_CARDS']
    },
    {
        activeCategoryCodes: ['ELECTRONICS', 'MARKETPLACE_ELECTRONICS'],
        code: 'ELECTRONICS',
        ctaLabel: 'Browse',
        description: 'Buy and sell electronics, gadgets, devices, and accessories.',
        icon: 'phone-portrait-outline',
        name: 'Electronics Marketplace',
        sourceVerticalCodes: ['ELECTRONICS', 'MARKETPLACE']
    },
    {
        code: 'IMITATION_JEWELLERY',
        ctaLabel: 'Notify Me',
        description: 'Fashion jewellery and one-gram gold-style products.',
        forceComingSoon: true,
        icon: 'diamond-outline',
        name: 'Imitation Jewellery',
        sourceVerticalCodes: ['IMITATION_JEWELLERY']
    },
    {
        code: 'AUTOMOTIVE',
        ctaLabel: 'Notify Me',
        description: 'Cars, bikes, vehicle accessories, and services.',
        forceComingSoon: true,
        icon: 'car-outline',
        name: 'Automotive',
        sourceVerticalCodes: ['AUTOMOTIVE']
    },
    {
        code: 'GROCERY',
        ctaLabel: 'Notify Me',
        description: 'Fresh groceries delivered to your door.',
        forceComingSoon: true,
        icon: 'basket-outline',
        name: 'Grocery Delivery',
        sourceVerticalCodes: ['GROCERY']
    },
    {
        code: 'MEAT',
        ctaLabel: 'Notify Me',
        description: 'Premium quality fresh meat marketplace.',
        forceComingSoon: true,
        icon: 'restaurant-outline',
        name: 'Fresh Meat',
        sourceVerticalCodes: ['MEAT_SHOP']
    },
    {
        code: 'RENTALS',
        ctaLabel: 'Notify Me',
        description: 'Rent homes, spaces, vehicles, and products.',
        forceComingSoon: true,
        icon: 'business-outline',
        name: 'Rentals',
        sourceVerticalCodes: ['RENTALS']
    }
];
