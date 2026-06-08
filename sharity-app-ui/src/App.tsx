import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TamaguiProvider } from 'tamagui';

import { AccountSwitcherScreen } from './features/accountSwitcher/AccountSwitcherScreen';
import { AppSettingsScreen } from './features/appSettings/AppSettingsScreen';
import { CompleteSocialRegistrationScreen } from './features/auth/CompleteSocialRegistrationScreen';
import { CreateAccountScreen } from './features/auth/CreateAccountScreen';
import { CartScreen } from './features/cart/CartScreen';
import { CheckoutScreen } from './features/checkout/CheckoutScreen';
import { DigitalProductDetailsScreen } from './features/digital/DigitalProductDetailsScreen';
import { SplashScreen } from './features/splash/SplashScreen';
import { ElectronicsMarketplaceHomeScreen } from './features/electronics/ElectronicsMarketplaceHomeScreen';
import { HomeScreen } from './features/home/HomeScreen';
import { BuyerLibraryScreen } from './features/library/BuyerLibraryScreen';
import { LoginSecurityScreen } from './features/loginSecurity/LoginSecurityScreen';
import { CodeRevealScreen, SecureDownloadScreen } from './features/library/SecureAccessScreens';
import { MarketplaceSwitcherScreen } from './features/marketplace/MarketplaceSwitcherScreen';
import { MarketplaceConfigScreen } from './features/marketplaceConfig/MarketplaceConfigScreen';
import { NotificationCenterScreen } from './features/notifications/NotificationCenterScreen';
import { DisputeStatusScreen } from './features/orders/DisputeStatusScreen';
import { OpenDisputeScreen } from './features/orders/OpenDisputeScreen';
import { OrderDetailsScreen } from './features/orders/OrderDetailsScreen';
import { OrderReceiptScreen } from './features/orders/OrderReceiptScreen';
import { OrdersScreen } from './features/orders/OrdersScreen';
import { RefundReturnStatusScreen } from './features/orders/RefundReturnStatusScreen';
import { SellerOrderRefundScreen } from './features/refunds/SellerOrderRefundScreen';
import { RewardsScreen } from './features/rewards/RewardsScreen';
import { TrackingScreen } from './features/orders/TrackingScreen';
import { PaymentFailedScreen } from './features/payment/PaymentFailedScreen';
import { PaymentAuthorizationScreen } from './features/paymentAuthorization/PaymentAuthorizationScreen';
import { PaymentSuccessScreen } from './features/payment/PaymentSuccessScreen';
import { PoliciesScreen } from './features/policies/PoliciesScreen';
import { PricingPromotionsScreen } from './features/pricingPromotions/PricingPromotionsScreen';
import { ProfilePrivacyScreen } from './features/profilePrivacy/ProfilePrivacyScreen';
import { ProductDetailsScreen } from './features/products/ProductDetailsScreen';
import { PublicContentScreen } from './features/publicContent/PublicContentScreen';
import { SellerListingScreen } from './features/seller/SellerListingScreen';
import { SellerVerificationScreen } from './features/sellerVerification/SellerVerificationScreen';
import { SupportScreen } from './features/support/SupportScreen';
import { WalletScreen } from './features/wallet/WalletScreen';
import { WelcomeScreen } from './features/welcome/WelcomeScreen';
import { getVisitorContext, type VisitorContextResponse } from './services/publicContentApi';
import { checkSession } from './services/sessionService';
import type { AppRoute } from './types/navigation';
import tamaguiConfig from '../tamagui.config';

const minimumSplashMs = 900;

function publicRouteFromLocation(): AppRoute | null {
  if (Platform.OS !== 'web') {
    return null;
  }
  const path = window.location.pathname.replace(/\/+$/, '');
  if (path === '/app/register') {
    return 'register';
  }
  if (path === '/app/complete-registration') {
    return 'completeSocialRegistration';
  }
  if (path.startsWith('/app/legal/') || path.startsWith('/app/company/') || path.startsWith('/app/support/')) {
    return 'publicContent';
  }
  if (path === '/app') {
    return null;
  }
  return null;
}

function publicContentSlugFromLocation(): string | null {
  if (Platform.OS !== 'web') {
    return null;
  }
  const segments = window.location.pathname.split('/').filter(Boolean);
  return segments.length >= 3 && segments[0] === 'app' ? segments[2] ?? null : null;
}

function updatePublicPath(route: AppRoute) {
  if (Platform.OS !== 'web') {
    return;
  }
  const path = route === 'register'
    ? '/app/register'
    : route === 'completeSocialRegistration'
      ? '/app/complete-registration'
      : '/app/';
  if (window.location.pathname !== path) {
    window.history.pushState(null, '', path);
  }
}

function updatePublicContentPath(slug: string) {
  if (Platform.OS !== 'web') {
    return;
  }
  const legalSlugs = new Set(['privacy', 'terms', 'guidelines']);
  const supportSlugs = new Set(['help-center', 'safety', 'contact-us']);
  const section = legalSlugs.has(slug) ? 'legal' : supportSlugs.has(slug) ? 'support' : 'company';
  const path = `/app/${section}/${slug}`;
  if (window.location.pathname !== path) {
    window.history.pushState(null, '', path);
  }
}

export default function App() {
  const [route, setRoute] = useState<AppRoute>('splash');
  const [digitalProductId, setDigitalProductId] = useState<string | null>(null);
  const [electronicsProductId, setElectronicsProductId] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [refundRequestId, setRefundRequestId] = useState<string | null>(null);
  const [disputeId, setDisputeId] = useState<string | null>(null);
  const [secureAccessId, setSecureAccessId] = useState<string | null>(null);
  const [socialProvider] = useState<'Google'>('Google');
  const [isTakingLonger, setIsTakingLonger] = useState(false);
  const [visitorContext, setVisitorContext] = useState<VisitorContextResponse | null>(null);
  const [publicContentSlug, setPublicContentSlug] = useState('terms');

  function startBrowserLogin() {
    if (Platform.OS === 'web') {
      window.location.assign('/bff/login');
      return;
    }

    setRoute('home');
  }

  useEffect(() => {
    let isMounted = true;

    const fallbackTimer = setTimeout(() => {
      if (isMounted) {
        setIsTakingLonger(true);
      }
    }, 1600);

    const startTime = Date.now();

    async function resolveStartupRoute() {
      const publicRoute = publicRouteFromLocation();
      const [session, context] = await Promise.all([
        checkSession(),
        getVisitorContext().catch(() => null)
      ]);
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(minimumSplashMs - elapsed, 0);

      setTimeout(() => {
        if (!isMounted) {
          return;
        }
        if (context) {
          setVisitorContext(context);
        }
        if (publicRoute === 'publicContent') {
          setPublicContentSlug(publicContentSlugFromLocation() ?? 'terms');
        }
        setRoute(publicRoute ?? (session.status === 'authenticated' ? 'home' : 'welcome'));
      }, remaining);
    }

    resolveStartupRoute();

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimer);
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return undefined;
    }

    function handlePopState() {
      const publicRoute = publicRouteFromLocation();
      if (publicRoute === 'publicContent') {
        setPublicContentSlug(publicContentSlugFromLocation() ?? 'terms');
        setRoute('publicContent');
        return;
      }
      if (publicRoute === 'register' || publicRoute === 'completeSocialRegistration') {
        setRoute(publicRoute);
        return;
      }
      setRoute('welcome');
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  function leavePublicContent() {
    updatePublicPath('welcome');
    setRoute('welcome');
  }

  function openPublicContent(slug: string) {
    setPublicContentSlug(slug);
    updatePublicContentPath(slug);
    setRoute('publicContent');
  }

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <SafeAreaProvider>
          <StatusBar style="dark" />
          {route === 'splash' ? <SplashScreen isTakingLonger={isTakingLonger} /> : null}
          {route === 'welcome' ? (
            <WelcomeScreen
              onBrowse={() => setRoute('marketplaces')}
              onGetStarted={() => {
                updatePublicPath('register');
                setRoute('register');
              }}
              onSignIn={startBrowserLogin}
              onOpenPublicContent={openPublicContent}
              visitorContext={visitorContext}
            />
          ) : null}
          {route === 'register' ? (
            <CreateAccountScreen
              onNavigate={(nextRoute) => {
                updatePublicPath(nextRoute);
                setRoute(nextRoute);
              }}
              onSignIn={startBrowserLogin}
              visitorContext={visitorContext}
            />
          ) : null}
          {route === 'completeSocialRegistration' ? (
            <CompleteSocialRegistrationScreen
              onCancel={() => setRoute('welcome')}
              onNavigate={setRoute}
              onSignIn={startBrowserLogin}
              provider={socialProvider}
              visitorContext={visitorContext}
            />
          ) : null}
          {route === 'home' ? (
            <HomeScreen
              onNavigate={setRoute}
              onOpenDigitalProduct={(productId) => {
                setDigitalProductId(productId);
                setRoute('digitalProduct');
              }}
            />
          ) : null}
          {route === 'marketplaces' ? (
            <MarketplaceSwitcherScreen
              onNavigate={setRoute}
              onOpenDigitalProduct={(productId) => {
                setDigitalProductId(productId);
                setRoute('digitalProduct');
              }}
            />
          ) : null}
          {route === 'electronics' ? (
            <ElectronicsMarketplaceHomeScreen
              onNavigate={setRoute}
              onOpenProduct={(productId) => {
                setElectronicsProductId(productId);
                setRoute('electronicsProduct');
              }}
            />
          ) : null}
          {route === 'digitalProduct' ? (
            <DigitalProductDetailsScreen listingPublicId={digitalProductId} onNavigate={setRoute} />
          ) : null}
          {route === 'electronicsProduct' ? (
            <ProductDetailsScreen mode="electronics" onNavigate={setRoute} productId={electronicsProductId} />
          ) : null}
          {route === 'cart' ? <CartScreen onNavigate={setRoute} /> : null}
          {route === 'checkout' ? <CheckoutScreen onNavigate={setRoute} /> : null}
          {route === 'library' ? (
            <BuyerLibraryScreen
              onNavigate={setRoute}
              onOpenCodeReveal={(accessId) => {
                setSecureAccessId(accessId);
                setRoute('codeReveal');
              }}
              onOpenSecureDownload={(accessId) => {
                setSecureAccessId(accessId);
                setRoute('secureDownload');
              }}
            />
          ) : null}
          {route === 'codeReveal' ? <CodeRevealScreen accessId={secureAccessId} onNavigate={setRoute} /> : null}
          {route === 'secureDownload' ? <SecureDownloadScreen accessId={secureAccessId} onNavigate={setRoute} /> : null}
          {route === 'orders' ? (
            <OrdersScreen
              onNavigate={setRoute}
              onOpenOrderDetails={(nextOrderId) => {
                setOrderId(nextOrderId);
                setRoute('orderDetails');
              }}
              onOpenReceipt={(nextOrderId, nextReceiptId) => {
                setOrderId(nextOrderId);
                setReceiptId(nextReceiptId);
                setRoute('receipt');
              }}
              onOpenTracking={(nextOrderId) => {
                setOrderId(nextOrderId);
                setRoute('tracking');
              }}
            />
          ) : null}
          {route === 'orderDetails' ? (
            <OrderDetailsScreen
              onNavigate={setRoute}
              onOpenDispute={(nextOrderId) => {
                setOrderId(nextOrderId);
                setRoute('openDispute');
              }}
              onOpenRefundReturn={(nextOrderId) => {
                setOrderId(nextOrderId);
                setRoute('refundRequest');
              }}
              onOpenReceipt={(nextOrderId, nextReceiptId) => {
                setOrderId(nextOrderId);
                setReceiptId(nextReceiptId);
                setRoute('receipt');
              }}
              onOpenTracking={(nextOrderId) => {
                setOrderId(nextOrderId);
                setRoute('tracking');
              }}
              orderId={orderId}
            />
          ) : null}
          {route === 'receipt' ? <OrderReceiptScreen onNavigate={setRoute} orderId={orderId} receiptId={receiptId} /> : null}
          {route === 'tracking' ? (
            <TrackingScreen
              onNavigate={setRoute}
              onOpenRefundReturn={(nextOrderId) => {
                setOrderId(nextOrderId);
                setRoute('refundRequest');
              }}
              orderId={orderId}
            />
          ) : null}
          {route === 'refundRequest' ? (
            <SellerOrderRefundScreen
              onNavigate={setRoute}
              onOpenRefundStatus={(nextRefundRequestId, nextOrderId) => {
                setRefundRequestId(nextRefundRequestId);
                if (nextOrderId) setOrderId(nextOrderId);
                setRoute('refundStatus');
              }}
              orderId={orderId}
            />
          ) : null}
          {route === 'refundStatus' ? (
            <RefundReturnStatusScreen
              onNavigate={setRoute}
              onOpenDispute={(nextOrderId, nextRefundRequestId) => {
                setOrderId(nextOrderId);
                setRefundRequestId(nextRefundRequestId);
                setRoute('openDispute');
              }}
              orderId={orderId}
              refundRequestId={refundRequestId}
            />
          ) : null}
          {route === 'openDispute' ? (
            <OpenDisputeScreen
              onNavigate={setRoute}
              onOpenDisputeStatus={(nextDisputeId, nextOrderId) => {
                setDisputeId(nextDisputeId);
                setOrderId(nextOrderId);
                setRoute('disputeStatus');
              }}
              orderId={orderId}
              refundRequestId={refundRequestId}
            />
          ) : null}
          {route === 'disputeStatus' ? <DisputeStatusScreen disputeId={disputeId} onNavigate={setRoute} orderId={orderId} /> : null}
          {route === 'paymentSuccess' ? <PaymentSuccessScreen onNavigate={setRoute} /> : null}
          {route === 'paymentFailed' ? <PaymentFailedScreen onNavigate={setRoute} status="PAYMENT_FAILED" /> : null}
          {route === 'paymentCancelled' ? <PaymentFailedScreen onNavigate={setRoute} status="PAYMENT_CANCELLED" /> : null}
          {route === 'notifications' ? <NotificationCenterScreen onNavigate={setRoute} /> : null}
          {route === 'appSettings' ? <AppSettingsScreen onNavigate={setRoute} /> : null}
          {route === 'loginSecurity' ? <LoginSecurityScreen onNavigate={setRoute} /> : null}
          {route === 'profilePrivacy' ? <ProfilePrivacyScreen onNavigate={setRoute} /> : null}
          {route === 'accountSwitcher' ? <AccountSwitcherScreen onNavigate={setRoute} /> : null}
          {route === 'paymentAuthorization' ? <PaymentAuthorizationScreen onNavigate={setRoute} /> : null}
          {route === 'pricingPromotions' ? <PricingPromotionsScreen onNavigate={setRoute} /> : null}
          {route === 'rewards' ? <RewardsScreen onNavigate={setRoute} /> : null}
          {route === 'wallet' ? <WalletScreen onNavigate={setRoute} /> : null}
          {route === 'marketplaceConfig' ? <MarketplaceConfigScreen onNavigate={setRoute} /> : null}
          {route === 'sellerVerification' ? <SellerVerificationScreen onNavigate={setRoute} /> : null}
          {route === 'seller' ? <SellerListingScreen onNavigate={setRoute} /> : null}
          {route === 'policies' ? <PoliciesScreen onNavigate={setRoute} /> : null}
          {route === 'publicContent' ? (
            <PublicContentScreen
              context={visitorContext}
              onBack={leavePublicContent}
              onOpenPublicContent={openPublicContent}
              slug={publicContentSlug}
            />
          ) : null}
          {route === 'support' ? <SupportScreen onNavigate={setRoute} /> : null}
        </SafeAreaProvider>
    </TamaguiProvider>
  );
}
