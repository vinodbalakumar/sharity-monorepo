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
    text: 'Protected checkout and buyer support on every order',
    title: 'Secure Transactions'
  },
  {
    icon: 'bag-handle-outline',
    text: 'Curated digital goods, jewellery, and gift card collections',
    title: 'Wide Selection'
  },
  {
    icon: 'flash-outline',
    text: 'Clear delivery details and fast access for digital items',
    title: 'Fast Delivery'
  },
  {
    icon: 'people-outline',
    text: 'Verified sellers and customer-first marketplace rules',
    title: 'Trusted Community'
  }
];

export const footerGroups = [
  {
    links: [
      { label: 'About Sharity', slug: 'about-us' },
      { label: 'Careers', slug: 'careers' },
      { label: 'Press Center', slug: 'press' }
    ],
    title: 'Company'
  },
  {
    links: [
      { label: 'Help Center', slug: 'help-center' },
      { label: 'Safety Center', slug: 'safety' },
      { label: 'Contact Support', slug: 'contact-us' }
    ],
    title: 'Support'
  },
  {
    links: [
      { label: 'Privacy Policy', slug: 'privacy' },
      { label: 'Terms of Use', slug: 'terms' },
      { label: 'Community Guidelines', slug: 'guidelines' }
    ],
    title: 'Legal'
  }
];
