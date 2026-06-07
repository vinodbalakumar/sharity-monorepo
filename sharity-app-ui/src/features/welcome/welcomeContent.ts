import type { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

type IconName = ComponentProps<typeof Ionicons>['name'];

export const featureCards: {
  icon: IconName;
  text: string;
  title: string;
}[] = [
  {
    icon: 'shield-checkmark-outline',
    text: 'Protected payments and buyer guarantee on all purchases',
    title: 'Secure Transactions'
  },
  {
    icon: 'bag-handle-outline',
    text: 'Over 100M products across multiple categories',
    title: 'Wide Selection'
  },
  {
    icon: 'flash-outline',
    text: 'Quick shipping and reliable tracking on all orders',
    title: 'Fast Delivery'
  },
  {
    icon: 'people-outline',
    text: 'Join 10M+ active users buying and selling daily',
    title: 'Trusted Community'
  }
];

export const footerGroups = [
  {
    links: [
      { label: 'About Us', slug: 'about-us' },
      { label: 'Careers', slug: 'careers' },
      { label: 'Press', slug: 'press' }
    ],
    title: 'Company'
  },
  {
    links: [
      { label: 'Help Center', slug: 'help-center' },
      { label: 'Safety', slug: 'safety' },
      { label: 'Contact Us', slug: 'contact-us' }
    ],
    title: 'Support'
  },
  {
    links: [
      { label: 'Privacy', slug: 'privacy' },
      { label: 'Terms', slug: 'terms' },
      { label: 'Guidelines', slug: 'guidelines' }
    ],
    title: 'Legal'
  }
];
