import { useSelector } from '@legendapp/state/react';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { memo, useCallback, useEffect, useState } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import * as DropdownMenu from 'zeego/dropdown-menu';
import { Button, Card, Paragraph, Text, XStack, YStack } from 'tamagui';
import { InteriorShell } from '../../components/appShell';
import { appState$ } from '../../state/appState';
import { appStorage } from '../../storage/storage';
import { colors } from '../../theme';
import { getAppSettingsDashboard, updateSetting } from './appSettingsMockApi';
const MarketplaceList = FlashList;
const NotificationList = FlashList;
const AboutList = FlashList;
const sections = ['Appearance', 'Language & Region', 'Marketplaces', 'Notifications', 'Accessibility', 'Storage', 'About'];
export function AppSettingsScreen({ onNavigate }) {
    const selectedSection = useSelector(appState$.appSettings.selectedSection);
    const syncStatus = useSelector(appState$.appSettings.syncStatus);
    const [data, setData] = useState(null);
    const [message, setMessage] = useState('');
    const load = useCallback(async () => {
        setData(await getAppSettingsDashboard());
        const stored = appStorage.getString('appSettingsLastSection');
        if (stored && sections.includes(stored))
            appState$.appSettings.selectedSection.set(stored);
    }, []);
    useEffect(() => { load(); }, [load]);
    async function run(action, route) {
        if (route) {
            onNavigate(route);
            return;
        }
        appState$.appSettings.syncStatus.set('SYNCING');
        const result = await updateSetting(action);
        appState$.appSettings.syncStatus.set(result.syncStatus);
        if (action === 'CHANGE_THEME')
            appStorage.setString('appThemePreference', appState$.appSettings.theme.get());
        if (action === 'CLEAR_CACHE')
            appStorage.remove('nonSensitiveMarketplaceCacheMetadata');
        setMessage(result.message);
    }
    if (!data)
        return <InteriorShell onNavigate={onNavigate} title="App Settings" subtitle="Please wait..." scrollable={false}><Centered title="Loading app settings..."/></InteriorShell>;
    return (<InteriorShell onNavigate={onNavigate} title="App Settings" subtitle="Manage preferences and local app controls" scrollable={true}>
      <YStack gap="$5" maxWidth={1240} mx="auto" width="100%">

          <XStack $sm={{ flexDirection: 'column' }} gap="$3">
            <Metric label="Mode" value={data.currentMode.replace('_', ' / ')} tone="info"/>
            <Metric label="Marketplace" value={data.currentMarketplace} tone="success"/>
            <Metric label="Sync" value={syncStatus || data.syncStatus} tone="success"/>
            <Metric label="Country" value={data.regionSummary.countryCode} tone="warning"/>
          </XStack>

          <XStack flexWrap="wrap" gap="$2">{sections.map((section) => <Button key={section} theme={selectedSection === section ? 'purple' : undefined} onPress={() => { appState$.appSettings.selectedSection.set(section); appStorage.setString('appSettingsLastSection', section); }}>{section}</Button>)}</XStack>

          <XStack $md={{ flexDirection: 'column' }} alignItems="flex-start" gap="$5">
            <YStack flex={1} gap="$4" minWidth={0}>
              {selectedSection === 'Appearance' ? <Appearance data={data} run={run}/> : null}
              {selectedSection === 'Language & Region' ? <LanguageRegion data={data} run={run}/> : null}
              {selectedSection === 'Marketplaces' ? <Panel title="Marketplace Preferences"><MarketplaceList data={data.marketplacePreferences} estimatedItemSize={128} keyExtractor={(item) => item.marketplaceCode} renderItem={({ item, index }) => <MarketplaceRow item={item} index={index} run={run}/>}/></Panel> : null}
              {selectedSection === 'Notifications' ? <Panel title="Notification Preferences"><NotificationList data={data.notificationPreferencesSummary} estimatedItemSize={126} keyExtractor={(item) => item.notificationType} renderItem={({ item, index }) => <NotificationRow item={item} index={index} run={run}/>}/></Panel> : null}
              {selectedSection === 'Accessibility' ? <Accessibility data={data} run={run}/> : null}
              {selectedSection === 'Storage' ? <Storage run={run}/> : null}
              {selectedSection === 'About' ? <About about={data.appAbout}/> : null}
            </YStack>
            <YStack gap="$4" width={360} $md={{ width: '100%' }}>
              <Panel title="Shortcuts"><YStack gap="$2"><Button onPress={() => onNavigate('profilePrivacy')}>Open Privacy Settings</Button><Button onPress={() => onNavigate('loginSecurity')}>Open Login & Security</Button><Button onPress={() => onNavigate('support')}>Open Help & Support</Button><Button onPress={() => onNavigate('notifications')}>Open Notification Center</Button></YStack></Panel>
              <Panel title="Safety Notes"><Paragraph color="$gray10">Country changes route to profile review. Currency display cannot override checkout, payment, payout, or refund currency. Clear cache never clears auth/session or secure order access.</Paragraph></Panel>
              {message ? <PremiumCard p="$4"><Paragraph color="$purple10">{message}</Paragraph></PremiumCard> : null}
            </YStack>
          </XStack>
      </YStack>
    </InteriorShell>);
}
function Appearance({ data, run }) {
    const theme = useSelector(appState$.appSettings.theme);
    return <Panel title="Appearance / Theme"><XStack flexWrap="wrap" gap="$2">{data.themePreference.availableThemes.map((option) => <Button key={option} theme={(theme || data.themePreference.currentTheme) === option ? 'purple' : undefined} onPress={() => { appState$.appSettings.theme.set(option); run('CHANGE_THEME'); }}>{option}</Button>)}</XStack><Paragraph color="$gray10">System detected: {data.themePreference.systemThemeDetected}. High contrast is a later placeholder.</Paragraph></Panel>;
}
function LanguageRegion({ data, run }) {
    return <YStack gap="$4"><Panel title="Language"><DropdownMenu.Root><DropdownMenu.Trigger><Button>Language: {data.languagePreference.currentLanguage}</Button></DropdownMenu.Trigger><DropdownMenu.Content><DropdownMenu.Item key="en" onSelect={() => run('CHANGE_LANGUAGE')}>English</DropdownMenu.Item><DropdownMenu.Item key="future" disabled>Future languages later</DropdownMenu.Item></DropdownMenu.Content></DropdownMenu.Root><Paragraph color="$gray10">{data.languagePreference.userSafeMessage}</Paragraph></Panel><Panel title="Region / Country"><Row title={`${data.regionSummary.countryName} (${data.regionSummary.countryCode})`} meta={`${data.regionSummary.marketplaceImpactSummary} ${data.regionSummary.payoutImpactSummary}`} badge={data.regionSummary.countryChangeReviewRequired ? 'Review required' : 'Allowed'} tone="warning" actionLabel="Manage in Profile" action={() => run('MANAGE_REGION_COUNTRY', 'profilePrivacy')}/></Panel><Panel title="Currency Display"><Row title={`Checkout ${data.currencyPreference.checkoutCurrency} / Display ${data.currencyPreference.displayCurrency}`} meta={data.currencyPreference.userSafeMessage} badge={data.currencyPreference.backendControlled ? 'Backend controlled' : 'User controlled'} tone="info" actionLabel="Manage Currency" action={() => run('MANAGE_CURRENCY_DISPLAY')}/></Panel></YStack>;
}
const MarketplaceRow = memo(function MarketplaceRow({ item, index, run }) { const style = useEntrance(index); return <Animated.View style={style}><XStack $sm={{ flexDirection: 'column' }} ai="center" borderColor="$borderColor" borderTopWidth={1} gap="$3" py="$3"><Image source={item.marketplaceIconUrl} style={{ width: 48, height: 48, borderRadius: 10 }}/><YStack flex={1}><Text fontWeight="900">{item.displayOrder}. {item.marketplaceName}</Text><Paragraph color="$gray10">Buyer {item.buyerPreferenceEnabled ? 'shown' : 'hidden'} / Seller {item.sellerPreferenceEnabled ? 'shown' : 'hidden'} / {item.userSafeReason}</Paragraph></YStack><Badge label={item.defaultMarketplace ? 'Default' : item.status} tone={item.adminCountryAllowed ? 'success' : 'warning'}/><DropdownMenu.Root><DropdownMenu.Trigger><Button>Manage</Button></DropdownMenu.Trigger><DropdownMenu.Content><DropdownMenu.Item key="buyer" disabled={!item.adminCountryAllowed} onSelect={() => run('UPDATE_MARKETPLACE_PREFERENCE')}>Toggle Buyer</DropdownMenu.Item><DropdownMenu.Item key="seller" disabled={!item.adminCountryAllowed} onSelect={() => run('UPDATE_MARKETPLACE_PREFERENCE')}>Toggle Seller</DropdownMenu.Item><DropdownMenu.Item key="default" disabled={!item.adminCountryAllowed} onSelect={() => run('SET_DEFAULT_MARKETPLACE')}>Set Default</DropdownMenu.Item></DropdownMenu.Content></DropdownMenu.Root></XStack></Animated.View>; });
function NotificationRow({ item, index, run }) { const style = useEntrance(index); return <Animated.View style={style}><Row title={item.label} meta={`${item.description} Push ${item.pushEnabled ? 'on' : 'off'} / Email ${item.emailEnabled ? 'on' : 'off'} / In-app ${item.inAppEnabled ? 'on' : 'off'} / ${item.userSafeMessage}`} badge={item.mandatory ? 'Mandatory' : item.userCanDisable ? 'Optional' : 'Protected'} tone={item.critical ? 'critical' : item.mandatory ? 'warning' : 'info'} actionLabel="Toggle" action={() => run(item.userCanDisable ? 'UPDATE_NOTIFICATION_PREFERENCE' : 'DISABLE_SECURITY_ALERTS')}/></Animated.View>; }
function Accessibility({ data, run }) { const prefs = data.accessibilityPreferences; return <Panel title="Accessibility Preferences"><Row title="Larger text" meta={`Enabled: ${prefs.largerTextEnabled}. Respects system accessibility where possible.`} badge="Enabled" tone="success" actionLabel="Toggle" action={() => run('UPDATE_ACCESSIBILITY')}/><Row title="Reduce motion" meta={`Enabled: ${prefs.reduceMotionEnabled}. Non-essential motion can be reduced.`} badge="Enabled" tone="success" actionLabel="Toggle" action={() => run('UPDATE_ACCESSIBILITY')}/><Row title="Screen reader labels" meta={`Optimized: ${prefs.screenReaderOptimized}. Settings rows and toggles include safe labels.`} badge="Ready" tone="info"/><Row title="Haptic feedback" meta={`Enabled: ${prefs.hapticFeedbackEnabled}. Applies only to optional haptics.`} badge="Optional" tone="info" actionLabel="Toggle" action={() => run('UPDATE_ACCESSIBILITY')}/></Panel>; }
function Storage({ run }) { return <Panel title="Storage & Cache"><Paragraph color="$gray10">Clears image cache, marketplace cached data, local UI cache, temporary files, and non-sensitive cached metadata. It does not clear auth/session, saved login methods, payment state, digital access records, order history, or checkout snapshots.</Paragraph><Button theme="purple" onPress={() => run('CLEAR_CACHE')}>Clear Cache</Button></Panel>; }
function About({ about }) { const rows = [{ id: 'name', label: 'App', value: about.appName }, { id: 'version', label: 'Version', value: about.appVersion }, { id: 'build', label: 'Build', value: about.buildNumber }, { id: 'platform', label: 'Platform', value: about.platform }, { id: 'env', label: 'Environment', value: about.environmentLabelSafe }, { id: 'debug', label: 'Debug info', value: about.debugInfoAvailableInDevOnly ? 'Available in dev builds only' : 'Hidden' }]; return <Panel title="App Version / About"><AboutList data={rows} estimatedItemSize={74} keyExtractor={(item) => item.id} renderItem={({ item, index }) => <AnimatedRow index={index} title={item.label} meta={item.value}/>}/></Panel>; }
function AnimatedRow({ index, title, meta }) { const style = useEntrance(index); return <Animated.View style={style}><Row title={title} meta={meta} badge="About" tone="info"/></Animated.View>; }
function Panel({ title, children }) { return <PremiumCard p="$5"><YStack gap="$4"><Text fontSize="$6" fontWeight="900">{title}</Text>{children}</YStack></PremiumCard>; }
function Row({ title, meta, badge, tone, actionLabel, action }) { return <XStack $sm={{ flexDirection: 'column' }} ai="center" borderColor="$borderColor" borderTopWidth={1} gap="$3" py="$3"><YStack flex={1} minWidth={0}><Text fontWeight="900">{title}</Text><Paragraph color="$gray10">{meta}</Paragraph></YStack><Badge label={badge} tone={tone}/>{actionLabel && action ? <Button onPress={action}>{actionLabel}</Button> : null}</XStack>; }
function Metric({ label, value, tone }) { return <PremiumCard flex={1} minWidth={160} p="$4"><Text color={toneColor(tone)} fontSize="$7" fontWeight="900">{value}</Text><Text color="$gray10">{label}</Text></PremiumCard>; }
function Centered({ title }) { return <PremiumCard p="$6"><Text fontSize="$6" fontWeight="900" ta="center">{title}</Text></PremiumCard>; }
function Badge({ label, tone }) { return <Text bg={toneBg(tone)} br="$6" color={toneColor(tone)} fontSize="$2" fontWeight="900" px="$2" py="$1">{label}</Text>; }
function PremiumCard(props) { return <Card bg="$backgroundHover" borderColor="$borderColor" borderWidth={1} br="$6" {...props}/>; }
function toneBg(tone) { return tone === 'critical' ? '$red3' : tone === 'warning' ? '$orange3' : tone === 'success' ? '$green3' : '$blue3'; }
function toneColor(tone) { return tone === 'critical' ? '$red10' : tone === 'warning' ? '$orange10' : tone === 'success' ? '$green10' : '$blue10'; }
function useEntrance(index) { const opacity = useSharedValue(0); const translateY = useSharedValue(10); useEffect(() => { opacity.value = withDelay(index * 30, withTiming(1, { duration: 210 })); translateY.value = withDelay(index * 30, withSpring(0, { damping: 18, stiffness: 150 })); }, [index, opacity, translateY]); return useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: translateY.value }] })); }
void colors;
