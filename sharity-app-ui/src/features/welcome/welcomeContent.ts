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

export { footerGroups } from '../../components/publicSite/footerContent';
