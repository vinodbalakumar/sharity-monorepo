export type CartMarketplaceCode = 'DIGITAL' | 'ELECTRONICS';

export type CartItem = {
  availableQuantity?: number;
  condition?: string;
  deliveryType: string;
  discountPercent?: number;
  id: string;
  originalPrice?: number;
  price: number;
  productId: string;
  productType: string;
  quantity: number;
  quantityEditable: boolean;
  refundSummary?: string;
  returnSummary?: string;
  shippingRequired: boolean;
  title: string;
};

export type CartGroup = {
  items: CartItem[];
  marketplaceCode: CartMarketplaceCode;
  marketplaceName: string;
  sellerId: string;
  sellerName: string;
  sellerVerified: boolean;
};

export type Cart = {
  groups: CartGroup[];
  id: string;
  userType: 'GUEST' | 'LOGGED_IN';
};

export const mockCart: Cart = {
  groups: [
    {
      items: [
        {
          deliveryType: 'INSTANT_CODE_REVEAL',
          discountPercent: 25,
          id: 'item-001',
          originalPrice: 19.99,
          price: 14.99,
          productId: 'digital-xbox-game-pass',
          productType: 'GAMING_CODE',
          quantity: 1,
          quantityEditable: false,
          refundSummary: 'Refund limited after code reveal',
          shippingRequired: false,
          title: 'Xbox Game Pass Digital Code'
        },
        {
          deliveryType: 'SECURE_DOWNLOAD',
          id: 'item-002',
          price: 29.99,
          productId: 'digital-template-pack',
          productType: 'DOWNLOADABLE_FILE',
          quantity: 1,
          quantityEditable: false,
          refundSummary: 'Refund eligibility may change after download',
          shippingRequired: false,
          title: 'Premium Downloadable Template Pack'
        }
      ],
      marketplaceCode: 'DIGITAL',
      marketplaceName: 'Digital Marketplace',
      sellerId: 'seller-001',
      sellerName: 'GameCodeHub',
      sellerVerified: true
    },
    {
      items: [
        {
          availableQuantity: 2,
          condition: 'Used',
          deliveryType: 'SHIPPING_REQUIRED',
          id: 'item-003',
          originalPrice: 549,
          price: 499,
          productId: 'electronics-iphone-14',
          productType: 'ELECTRONICS',
          quantity: 1,
          quantityEditable: true,
          returnSummary: '7-day return eligible',
          shippingRequired: true,
          title: 'Used iPhone 14'
        },
        {
          availableQuantity: 4,
          condition: 'Open Box',
          deliveryType: 'SHIPPING_REQUIRED',
          discountPercent: 20,
          id: 'item-004',
          originalPrice: 319,
          price: 249,
          productId: 'electronics-sony-headphones',
          productType: 'ELECTRONICS',
          quantity: 1,
          quantityEditable: true,
          returnSummary: 'Seller return policy',
          shippingRequired: true,
          title: 'Sony WH-1000XM5 Headphones'
        }
      ],
      marketplaceCode: 'ELECTRONICS',
      marketplaceName: 'Electronics Marketplace',
      sellerId: 'seller-002',
      sellerName: 'TechDeals USA',
      sellerVerified: true
    }
  ],
  id: 'cart-001',
  userType: 'GUEST'
};

export function flattenCartItems(cart: Cart) {
  return cart.groups.flatMap((group) => group.items.map((item) => ({ group, item })));
}

export function calculateCartSummary(cart: Cart, couponApplied: boolean) {
  const rows = flattenCartItems(cart);
  const subtotal = rows.reduce((sum, row) => sum + row.item.price * row.item.quantity, 0);
  const discount = rows.reduce((sum, row) => {
    if (!row.item.originalPrice || row.item.originalPrice <= row.item.price) {
      return sum;
    }
    return sum + (row.item.originalPrice - row.item.price) * row.item.quantity;
  }, 0);
  const marketplaceFee = Math.round(subtotal * 0.012 * 100) / 100;
  const estimatedTax = Math.round(subtotal * 0.075 * 100) / 100;
  const couponDiscount = couponApplied ? 10 : 0;
  const hasElectronics = rows.some((row) => row.item.shippingRequired);
  const estimatedTotal = subtotal + marketplaceFee + estimatedTax - couponDiscount;

  return {
    couponDiscount,
    discount,
    estimatedShipping: hasElectronics ? null : 0,
    estimatedTax,
    estimatedTotal,
    marketplaceFee,
    subtotal
  };
}
