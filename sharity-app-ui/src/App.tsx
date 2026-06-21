import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TamaguiProvider } from 'tamagui';

import { AccountSwitcherScreen } from './features/accountSwitcher/AccountSwitcherScreen';
import { AppSettingsScreen } from './features/appSettings/AppSettingsScreen';
import { CompleteSocialRegistrationScreen } from './features/auth/CompleteSocialRegistrationScreen';
import { CreateAccountScreen } from './features/auth/CreateAccountScreen';
import { ForgotPasswordScreen, ResetPasswordScreen } from './features/auth/PasswordRecoveryScreen';
import { VerifyEmailScreen } from './features/auth/VerifyEmailScreen';
import { CartScreen } from './features/cart/CartScreen';
import { CheckoutScreen } from './features/checkout/CheckoutScreen';
import { DigitalProductDetailsScreen } from './features/digital/DigitalProductDetailsScreen';
import { SplashScreen } from './features/splash/SplashScreen';
import { DigitalMarketplaceListingsScreen } from './features/marketplace/DigitalMarketplaceListingsScreen';
import { ElectronicsMarketplaceHomeScreen } from './features/electronics/ElectronicsMarketplaceHomeScreen';
import { HomeScreen } from './features/home/HomeScreen';
import { BuyerLibraryScreen } from './features/library/BuyerLibraryScreen';
import { LoginSecurityScreen } from './features/loginSecurity/LoginSecurityScreen';
import { CodeRevealScreen, SecureDownloadScreen } from './features/library/SecureAccessScreens';
import { MarketplaceSwitcherScreen } from './features/marketplace/MarketplaceSwitcherScreen';
import { MarketplaceConfigScreen } from './features/marketplaceConfig/MarketplaceConfigScreen';
import { JewelryMarketplaceListingsScreen } from './features/marketplace/JewelryMarketplaceListingsScreen';
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
import { getRegistrationOptions } from './services/authApi';
import { getVisitorContext, type VisitorContextResponse } from './services/publicContentApi';
import { checkSession, clearLogoutOverride, hasLogoutOverride } from './services/sessionService';
import { appState$ } from './state/appState';
import type { AppRoute } from './types/navigation';
import tamaguiConfig from '../tamagui.config';

const minimumSplashMs = 900;
const bffBaseUrl = process.env.EXPO_PUBLIC_BFF_BASE_URL ?? '/bff';

type RouteSnapshot = {
  disputeId?: string | null;
  digitalProductId?: string | null;
  electronicsProductId?: string | null;
  electronicsRoute?: boolean;
  orderId?: string | null;
  authToken?: string | null;
  publicContentSlug?: string | null;
  receiptId?: string | null;
  refundRequestId?: string | null;
  route: AppRoute;
  secureAccessId?: string | null;
};

function publicRouteFromLocation(): AppRoute | null {
  if (Platform.OS !== 'web') {
    return null;
  }
  const path = window.location.pathname.replace(/\/+$/, '');
  if (path === '/app/register') {
    return 'register';
  }
  if (path === '/app/forgot-password') {
    return 'forgotPassword';
  }
  if (path === '/app/reset-password') {
    return 'resetPassword';
  }
  if (path === '/app/verify-email') {
    return 'verifyEmail';
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

function isLoginSuccessReturn(): boolean {
  if (Platform.OS !== 'web') {
    return false;
  }
  return new URLSearchParams(window.location.search).get('login') === 'success';
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

function routeSnapshotFromLocation(pathname: string, search: string, historyState: RouteSnapshot | null): RouteSnapshot | null {
  const path = pathname.replace(/\/+$/, '');
  const query = new URLSearchParams(search);
  const fromHistory = historyState?.route ? historyState : null;

  switch (path) {
    case '/app/home':
      return { route: 'home' };
    case '/app/marketplaces':
      return { route: 'marketplaces' };
    case '/app/marketplace/digital':
      return { route: 'digitalMarketplace' };
    case '/app/marketplace/jewellery':
      return { route: 'jewelryMarketplace' };
    case '/app/electronics':
      return { route: 'electronics' };
    case '/app/cart':
      return { route: 'cart' };
    case '/app/checkout':
      return { route: 'checkout' };
    case '/app/library':
      return { route: 'library' };
    case '/app/orders':
      return { route: 'orders', orderId: query.get('orderId') };
    case '/app/orders/details':
      return { route: 'orderDetails', orderId: query.get('orderId') };
    case '/app/orders/receipt':
      return { route: 'receipt', orderId: query.get('orderId'), receiptId: query.get('receiptId') };
    case '/app/orders/tracking':
      return { route: 'tracking', orderId: query.get('orderId') };
    case '/app/orders/refund-request':
      return { route: 'refundRequest', orderId: query.get('orderId') };
    case '/app/orders/refund-status':
      return { route: 'refundStatus', orderId: query.get('orderId'), refundRequestId: query.get('refundRequestId') };
    case '/app/orders/dispute':
      return { route: 'openDispute', orderId: query.get('orderId'), refundRequestId: query.get('refundRequestId') };
    case '/app/orders/dispute-status':
      return { route: 'disputeStatus', orderId: query.get('orderId'), disputeId: query.get('disputeId') };
    case '/app/forgot-password':
      return { route: 'forgotPassword' };
    case '/app/reset-password':
      return { route: 'resetPassword', authToken: query.get('token') };
    case '/app/verify-email':
      return { route: 'verifyEmail', authToken: query.get('token') };
    case '/app/notifications':
      return { route: 'notifications' };
    case '/app/app-settings':
      return { route: 'appSettings' };
    case '/app/login-security':
      return { route: 'loginSecurity' };
    case '/app/profile':
      return { route: 'profilePrivacy' };
    case '/app/account-switcher':
      return { route: 'accountSwitcher' };
    case '/app/payment-authorization':
      return { route: 'paymentAuthorization' };
    case '/app/pricing-promotions':
      return { route: 'pricingPromotions' };
    case '/app/rewards':
      return { route: 'rewards' };
    case '/app/wallet':
      return { route: 'wallet' };
    case '/app/marketplace-config':
      return { route: 'marketplaceConfig' };
    case '/app/sell':
      return { route: 'sellerVerification' };
    case '/app/seller':
      return { route: 'seller' };
    case '/app/policies':
      return { route: 'policies' };
    case '/app/support':
      return { route: 'support' };
    case '/app/complete-registration':
      return { route: 'completeSocialRegistration' };
    case '/app/register':
      return { route: 'register' };
    case '/app': {
      if (fromHistory) {
        return fromHistory;
      }
      return null;
    }
    default:
      if (path.startsWith('/app/legal/') || path.startsWith('/app/company/') || path.startsWith('/app/support/')) {
        return { route: 'publicContent', publicContentSlug: path.split('/').filter(Boolean)[2] ?? 'terms' };
      }
      return fromHistory;
  }
}

function snapshotToPath(snapshot: RouteSnapshot): string {
  switch (snapshot.route) {
    case 'home':
      return '/app/home';
    case 'marketplaces':
      return '/app/marketplaces';
    case 'digitalMarketplace':
      return '/app/marketplace/digital';
    case 'jewelryMarketplace':
      return '/app/marketplace/jewellery';
    case 'electronics':
      return '/app/electronics';
    case 'cart':
      return '/app/cart';
    case 'checkout':
      return '/app/checkout';
    case 'library':
      return '/app/library';
    case 'orders':
      return `/app/orders${snapshot.orderId ? `?orderId=${encodeURIComponent(snapshot.orderId)}` : ''}`;
    case 'orderDetails':
      return `/app/orders/details${snapshot.orderId ? `?orderId=${encodeURIComponent(snapshot.orderId)}` : ''}`;
    case 'receipt':
      return `/app/orders/receipt${snapshot.orderId || snapshot.receiptId ? `?${new URLSearchParams({ ...(snapshot.orderId ? { orderId: snapshot.orderId } : {}), ...(snapshot.receiptId ? { receiptId: snapshot.receiptId } : {}) }).toString()}` : ''}`;
    case 'tracking':
      return `/app/orders/tracking${snapshot.orderId ? `?orderId=${encodeURIComponent(snapshot.orderId)}` : ''}`;
    case 'refundRequest':
      return `/app/orders/refund-request${snapshot.orderId ? `?orderId=${encodeURIComponent(snapshot.orderId)}` : ''}`;
    case 'refundStatus':
      return `/app/orders/refund-status${snapshot.orderId || snapshot.refundRequestId ? `?${new URLSearchParams({ ...(snapshot.orderId ? { orderId: snapshot.orderId } : {}), ...(snapshot.refundRequestId ? { refundRequestId: snapshot.refundRequestId } : {}) }).toString()}` : ''}`;
    case 'openDispute':
      return `/app/orders/dispute${snapshot.orderId || snapshot.refundRequestId ? `?${new URLSearchParams({ ...(snapshot.orderId ? { orderId: snapshot.orderId } : {}), ...(snapshot.refundRequestId ? { refundRequestId: snapshot.refundRequestId } : {}) }).toString()}` : ''}`;
    case 'disputeStatus':
      return `/app/orders/dispute-status${snapshot.orderId || snapshot.disputeId ? `?${new URLSearchParams({ ...(snapshot.orderId ? { orderId: snapshot.orderId } : {}), ...(snapshot.disputeId ? { disputeId: snapshot.disputeId } : {}) }).toString()}` : ''}`;
    case 'notifications':
      return '/app/notifications';
    case 'appSettings':
      return '/app/app-settings';
    case 'loginSecurity':
      return '/app/login-security';
    case 'profilePrivacy':
      return '/app/profile';
    case 'accountSwitcher':
      return '/app/account-switcher';
    case 'paymentAuthorization':
      return '/app/payment-authorization';
    case 'pricingPromotions':
      return '/app/pricing-promotions';
    case 'rewards':
      return '/app/rewards';
    case 'wallet':
      return '/app/wallet';
    case 'marketplaceConfig':
      return '/app/marketplace-config';
    case 'sellerVerification':
      return '/app/sell';
    case 'seller':
      return '/app/seller';
    case 'policies':
      return '/app/policies';
    case 'support':
      return '/app/support';
    case 'publicContent':
      return `/app/${publicSectionFromSlug(snapshot.publicContentSlug ?? 'terms')}/${snapshot.publicContentSlug ?? 'terms'}`;
    case 'register':
      return '/app/register';
    case 'forgotPassword':
      return '/app/forgot-password';
    case 'resetPassword':
      return `/app/reset-password${snapshot.authToken ? `?token=${encodeURIComponent(snapshot.authToken)}` : ''}`;
    case 'verifyEmail':
      return `/app/verify-email${snapshot.authToken ? `?token=${encodeURIComponent(snapshot.authToken)}` : ''}`;
    case 'completeSocialRegistration':
      return '/app/complete-registration';
    default:
      return '/app/';
  }
}

function publicSectionFromSlug(slug: string): 'legal' | 'support' | 'company' {
  if (['privacy', 'terms', 'guidelines'].includes(slug)) {
    return 'legal';
  }
  if (['help-center', 'safety', 'contact-us'].includes(slug)) {
    return 'support';
  }
  return 'company';
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
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [socialProvider] = useState<'Google'>('Google');
  const [isTakingLonger, setIsTakingLonger] = useState(false);
  const [visitorContext, setVisitorContext] = useState<VisitorContextResponse | null>(null);
  const [publicContentSlug, setPublicContentSlug] = useState('terms');

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }

    const { body, documentElement } = window.document;
    const previousBodyOverflowY = body.style.overflowY;
    const previousBodyOverscrollBehaviorY = body.style.overscrollBehaviorY;
    const previousRootOverflowY = documentElement.style.overflowY;
    const previousRootOverscrollBehaviorY = documentElement.style.overscrollBehaviorY;

    body.style.overflowY = 'auto';
    body.style.overscrollBehaviorY = 'auto';
    documentElement.style.overflowY = 'auto';
    documentElement.style.overscrollBehaviorY = 'auto';

    return () => {
      body.style.overflowY = previousBodyOverflowY;
      body.style.overscrollBehaviorY = previousBodyOverscrollBehaviorY;
      documentElement.style.overflowY = previousRootOverflowY;
      documentElement.style.overscrollBehaviorY = previousRootOverscrollBehaviorY;
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' || route === 'splash') {
      return;
    }

    const snapshot: RouteSnapshot = {
      disputeId,
      digitalProductId,
      electronicsProductId,
      orderId,
      authToken,
      publicContentSlug,
      receiptId,
      refundRequestId,
      route,
      secureAccessId
    };
    const nextPath = snapshotToPath(snapshot);
    const currentPath = `${window.location.pathname}${window.location.search}`;
    const historyState = window.history.state as RouteSnapshot | null;

    if (currentPath !== nextPath) {
      window.history.pushState(snapshot, '', nextPath);
      return;
    }

    if (!historyState || historyState.route !== route) {
      window.history.replaceState(snapshot, '', nextPath);
    }
  }, [authToken, digitalProductId, disputeId, electronicsProductId, orderId, publicContentSlug, receiptId, refundRequestId, route, secureAccessId]);

  function startBrowserLogin() {
    clearLogoutOverride();
    if (Platform.OS === 'web') {
      window.location.assign(`${bffBaseUrl}/login?force=true`);
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
      const historySnapshot = window.history.state as RouteSnapshot | null;
      const locationSnapshot = routeSnapshotFromLocation(window.location.pathname, window.location.search, historySnapshot);
      const loginSuccessReturn = isLoginSuccessReturn();
      const logoutOverride = hasLogoutOverride();
      const [session, context, registrationOptions] = await Promise.all([
        checkSession(),
        getVisitorContext().catch(() => null),
        getRegistrationOptions().catch(() => null)
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
        if (locationSnapshot?.route === 'publicContent') {
          setPublicContentSlug(locationSnapshot.publicContentSlug ?? 'terms');
        }
        if (locationSnapshot?.route === 'forgotPassword' || locationSnapshot?.route === 'resetPassword' || locationSnapshot?.route === 'verifyEmail') {
          setAuthToken(locationSnapshot.authToken ?? null);
        }
        if (!logoutOverride && (loginSuccessReturn || session.status === 'authenticated')) {
          const nextRoute = locationSnapshot?.route ?? 'home';
          applyRouteSnapshot(locationSnapshot ?? { route: 'home' });
          setRoute(nextRoute);
          if (loginSuccessReturn) {
            window.history.replaceState({
              route: nextRoute,
              ...snapshotStateForRoute(nextRoute, locationSnapshot)
            }, '', snapshotToPath(locationSnapshot ?? { route: 'home' }));
          }
          return;
        }
        if (locationSnapshot?.route && isPublicRoute(locationSnapshot.route)) {
          applyRouteSnapshot(locationSnapshot);
          setRoute(locationSnapshot.route);
          window.history.replaceState({
            route: locationSnapshot.route,
            ...snapshotStateForRoute(locationSnapshot.route, locationSnapshot)
          }, '', snapshotToPath(locationSnapshot));
          return;
        }
        setRoute('welcome');
        window.history.replaceState({ route: 'welcome' }, '', '/app/');
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

    let cancelled = false;

    const syncBrowserSession = async () => {
      const session = await checkSession();
      if (cancelled) {
        return;
      }
      if (!hasLogoutOverride() && session.status === 'authenticated') {
        setRoute((current) => (current === 'welcome' || current === 'register' || current === 'completeSocialRegistration' ? 'home' : current));
      }
    };

    function handlePopState() {
      const snapshot = routeSnapshotFromLocation(window.location.pathname, window.location.search, window.history.state as RouteSnapshot | null);
      if (snapshot) {
        applyRouteSnapshot(snapshot);
        setRoute(snapshot.route);
        return;
      }
      setRoute('welcome');
    }

    const handleBrowserSessionSync = () => {
      void syncBrowserSession();
    };

    handleBrowserSessionSync();
    window.addEventListener('focus', handleBrowserSessionSync);
    window.addEventListener('pageshow', handleBrowserSessionSync);
    window.addEventListener('popstate', handlePopState);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', handleBrowserSessionSync);
      window.removeEventListener('pageshow', handleBrowserSessionSync);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  function leavePublicContent() {
    if (Platform.OS === 'web' && hasLogoutOverride()) {
      clearLogoutOverride();
    }
    updatePublicPath('welcome');
    setRoute('welcome');
  }

  function openPublicContent(slug: string) {
    setPublicContentSlug(slug);
    updatePublicContentPath(slug);
    setRoute('publicContent');
  }

  function applyRouteSnapshot(snapshot: RouteSnapshot) {
    setDigitalProductId(snapshot.digitalProductId ?? null);
    setElectronicsProductId(snapshot.electronicsProductId ?? null);
    setOrderId(snapshot.orderId ?? null);
    setAuthToken(snapshot.authToken ?? null);
    setReceiptId(snapshot.receiptId ?? null);
    setRefundRequestId(snapshot.refundRequestId ?? null);
    setDisputeId(snapshot.disputeId ?? null);
    setSecureAccessId(snapshot.secureAccessId ?? null);
    if (snapshot.publicContentSlug) {
      setPublicContentSlug(snapshot.publicContentSlug);
    }
  }

  function snapshotStateForRoute(routeValue: AppRoute, snapshot?: RouteSnapshot | null): Omit<RouteSnapshot, 'route'> {
    return {
      disputeId: snapshot?.disputeId ?? disputeId,
      digitalProductId: snapshot?.digitalProductId ?? digitalProductId,
      electronicsProductId: snapshot?.electronicsProductId ?? electronicsProductId,
      electronicsRoute: routeValue === 'electronics',
      orderId: snapshot?.orderId ?? orderId,
      authToken: snapshot?.authToken ?? authToken,
      publicContentSlug: snapshot?.publicContentSlug ?? publicContentSlug,
      receiptId: snapshot?.receiptId ?? receiptId,
      refundRequestId: snapshot?.refundRequestId ?? refundRequestId,
      secureAccessId: snapshot?.secureAccessId ?? secureAccessId
    };
  }

  function isPublicRoute(routeValue: AppRoute) {
    return routeValue === 'welcome'
      || routeValue === 'register'
      || routeValue === 'forgotPassword'
      || routeValue === 'resetPassword'
      || routeValue === 'verifyEmail'
      || routeValue === 'completeSocialRegistration'
      || routeValue === 'publicContent';
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
              onOpenMarketplace={(routeName) => {
                setRoute(routeName);
              }}
              onSearchMarketplace={(query) => {
                appState$.marketplace.searchQuery.set(query);
                setRoute('marketplaces');
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
          {route === 'forgotPassword' ? (
            <ForgotPasswordScreen
              onSignIn={startBrowserLogin}
            />
          ) : null}
          {route === 'resetPassword' ? (
            <ResetPasswordScreen
              onSignIn={startBrowserLogin}
              resetToken={authToken}
            />
          ) : null}
          {route === 'verifyEmail' ? (
            <VerifyEmailScreen
              onSignIn={startBrowserLogin}
              token={authToken}
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
              visitorContext={visitorContext}
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
          {route === 'digitalMarketplace' ? (
            <DigitalMarketplaceListingsScreen
              onNavigate={setRoute}
              onOpenListing={(listingId) => {
                setDigitalProductId(listingId);
                setRoute('digitalProduct');
              }}
            />
          ) : null}
          {route === 'jewelryMarketplace' ? (
            <JewelryMarketplaceListingsScreen
              onNavigate={setRoute}
              onOpenListing={(listingId) => {
                setDigitalProductId(listingId);
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
