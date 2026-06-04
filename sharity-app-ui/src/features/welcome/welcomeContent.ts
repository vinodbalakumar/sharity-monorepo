import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

type IconName = ComponentProps<typeof Ionicons>['name'];

export const topCategories = [
  {
    access: 'Instant Access',
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=900&q=80',
    name: 'Digital Codes',
    note: 'Buyer receives code or access after successful payment.'
  },
  {
    access: 'Preview',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80',
    name: 'Electronics',
    note: 'Shipping required in a future physical product flow.'
  },
  {
    access: 'Instant Access',
    image: 'https://images.unsplash.com/photo-1556438064-2d7646166914?auto=format&fit=crop&w=900&q=80',
    name: 'Gaming Codes',
    note: 'Buyer receives game code or redemption details after payment.'
  },
  {
    access: 'Instant Access',
    image: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=900&q=80',
    name: 'Software Keys',
    note: 'Buyer receives license key or activation details after payment.'
  },
  {
    access: 'Risk Checked',
    image: 'https://images.unsplash.com/photo-1607083206968-13611e3d76db?auto=format&fit=crop&w=900&q=80',
    name: 'Gift Cards',
    note: 'Code delivery follows payment and fraud/risk checks.'
  },
  {
    access: 'Instant Access',
    image: 'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?auto=format&fit=crop&w=900&q=80',
    name: 'Digital Subscriptions',
    note: 'Buyer receives account, access, or subscription instructions.'
  },
  {
    access: 'Coming Soon',
    image: 'https://images.unsplash.com/photo-1512054502232-10a0a035d672?auto=format&fit=crop&w=900&q=80',
    name: 'Mobile & Computer Accessories',
    note: 'Shipping required when physical product flow is ready.'
  },
  {
    access: 'Instant Access',
    image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=900&q=80',
    name: 'Downloadable Products',
    note: 'Buyer receives secure download access after successful payment.'
  }
];

export const trustLabels = ['Secure Checkout', 'Instant Digital Access', 'Seller Verification', 'Buyer Protection'];

export const featureCards: {
  icon: IconName;
  text: string;
  title: string;
}[] = [
  {
    icon: 'shield-checkmark-outline',
    text: 'Protected checkout and marketplace safety rules for every purchase.',
    title: 'Secure Transactions'
  },
  {
    icon: 'key-outline',
    text: 'Clear rules for digital codes, software keys, gift cards, and instant-access products.',
    title: 'Digital Code Protection'
  },
  {
    icon: 'flash-outline',
    text: 'Access eligible digital products, codes, and downloads after successful payment.',
    title: 'Instant Access'
  },
  {
    icon: 'people-outline',
    text: 'Buy from sellers with profiles, ratings, reviews, and clear policies.',
    title: 'Trusted Community'
  }
];

export const footerGroups = [
  {
    links: ['About Sharity', 'Seller trust', 'Digital marketplace'],
    title: 'Company'
  },
  {
    links: ['Help Center', 'Buyer safety', 'Code delivery rules'],
    title: 'Support'
  },
  {
    links: ['Privacy', 'Terms', 'Marketplace guidelines'],
    title: 'Legal'
  },
  {
    links: ['Updates', 'Contact', 'Community'],
    title: 'Connect'
  }
];
