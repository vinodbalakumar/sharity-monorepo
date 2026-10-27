import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { InteriorShell } from '../../components/appShell';
import { AppButton } from '../../components/ui';
import { apiRequest } from '../../services/apiClient';
import { getBrowserSessionSummary } from '../../services/sessionService';
import { colors } from '../../theme';
import { systemFontFamily } from '../../theme/typography';
import type { AppRoute } from '../../types/navigation';

type Service = { service: string; requests: number; errors: number; p95Ms: number; lastSeen: string; state: string };
type Incident = { id: string; time: string; service: string; correlationId: string; status: number; durationMs: number; kind: string; analysisStatus: string; explanation: string; operation?: string };
type Dashboard = { generatedAt: string; windowSeconds: number; slowThresholdMs: number; aiEnabled: boolean; services: Service[]; incidents: Incident[]; droppedAnalyses: number; notice: string };

export function DiagnosticsScreen({ onNavigate }: { onNavigate: (route: AppRoute) => void }) {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState('');
  const [access, setAccess] = useState<'checking' | 'allowed' | 'denied'>('checking');
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    let active = true;
    void getBrowserSessionSummary().then(session => {
      if (active) setAccess(session?.authenticated && session.roles?.some(role => ['ADMIN', 'SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN'].includes(role)) ? 'allowed' : 'denied');
    });
    return () => { active = false; };
  }, []);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setData(await apiRequest<Dashboard>('/api/platform-ai-service/api/v1/admin/diagnostics')); }
    catch (ex) { setError(ex instanceof Error ? ex.message : 'Unable to load monitoring.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { if (access === 'allowed') void load(); }, [access, load]);
  return <InteriorShell title="Service operations" subtitle="Administrator diagnostics" onNavigate={onNavigate}>
    <View style={styles.stack} testID="admin-diagnostics">
      <Text accessibilityRole="header" style={styles.title}>Service operations</Text>
      <Text style={styles.body}>Request failures and performance across Sharity. AI suggestions require an administrator’s review.</Text>
      {access === 'checking' ? <Text style={styles.body}>Checking administrator access…</Text> : access === 'denied' ? <Text accessibilityRole="alert" style={styles.body}>Administrator access is required to view diagnostics.</Text> : <>
        <AppButton loading={loading} disabled={loading} onPress={load}>{loading ? 'Refreshing…' : 'Refresh diagnostics'}</AppButton>
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        {data ? <>
          <View style={styles.notice}><Text style={styles.body}>Updated {new Date(data.generatedAt).toLocaleString()} · Last {data.windowSeconds / 60} minutes · Slow threshold {data.slowThresholdMs} ms</Text>
            <Text style={styles.body}>AI analysis: {data.aiEnabled ? 'enabled' : 'disabled — measured incidents remain available'}</Text>
            <Text style={styles.muted}>{data.notice}</Text>
            {data.droppedAnalyses > 0 ? <Text style={styles.error}>{data.droppedAnalyses} analyses were skipped because capacity was reached.</Text> : null}
          </View>
          <View style={styles.grid}>{data.services.map(service => <View key={service.service} style={styles.card}>
            <Text style={styles.heading}>{service.service}</Text>
            <Text style={styles.status}>{service.state.replace(/_/g, ' ')}</Text>
            <Text style={styles.body}>{service.requests} delivered requests · {service.errors} server errors</Text>
            <Text style={styles.metric}>{service.p95Ms} <Text style={styles.muted}>ms p95</Text></Text>
            <Text style={styles.muted}>{service.lastSeen ? `Last request: ${new Date(service.lastSeen).toLocaleString()}` : 'No request samples received'}</Text>
          </View>)}</View>
          <Text accessibilityRole="header" style={styles.heading}>Recent incidents</Text>
          {data.incidents.length === 0 ? <View style={styles.notice}><Text style={styles.body}>No incidents received in the retained window. This does not confirm that every service is healthy.</Text></View> : data.incidents.map(incident => <View style={styles.incident} key={incident.id}>
            <Text style={styles.heading}>{incident.service} · {incident.kind.replace(/_/g, ' ')}</Text>
            <Text style={styles.body}>{incident.operation && incident.operation !== 'HTTP request' ? 'Operation status' : 'HTTP'} {incident.status} · {incident.durationMs} ms · {new Date(incident.time).toLocaleString()}</Text>
            {incident.operation && incident.operation !== 'HTTP request' ? <Text style={styles.body}>Operation: {incident.operation} (service measurement)</Text> : null}
            <Text selectable style={styles.muted}>Support reference: {incident.correlationId}</Text>
            <Text style={styles.status}>{incident.analysisStatus === 'AVAILABLE' ? 'AI suggestion — unverified' : `Analysis: ${incident.analysisStatus.toLowerCase()}`}</Text>
            <Text selectable style={styles.body}>{incident.explanation}</Text>
          </View>)}
        </> : null}
      </>}
    </View>
  </InteriorShell>;
}
const styles = StyleSheet.create({
  stack: { gap: 20, minWidth: 0 }, title: { fontFamily: systemFontFamily, fontSize: 30, fontWeight: '700', color: colors.textPrimary },
  body: { fontFamily: systemFontFamily, fontSize: 15, lineHeight: 23, color: colors.textPrimary, flexShrink: 1 },
  muted: { fontFamily: systemFontFamily, fontSize: 13, lineHeight: 20, color: colors.textSecondary },
  heading: { fontFamily: systemFontFamily, fontSize: 17, fontWeight: '600', color: colors.textPrimary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 }, card: { flexGrow: 1, flexBasis: 270, minWidth: 0, gap: 10, padding: 20, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 12 },
  notice: { backgroundColor: colors.surface, padding: 20, borderRadius: 12, gap: 10, borderWidth: 1, borderColor: colors.border },
  incident: { borderLeftWidth: 3, borderLeftColor: colors.warning, backgroundColor: colors.surface, padding: 20, gap: 10, borderRadius: 8 },
  status: { fontFamily: systemFontFamily, color: colors.primary, fontSize: 12, fontWeight: '700', letterSpacing: .6 },
  metric: { fontFamily: systemFontFamily, fontSize: 28, fontWeight: '700', color: colors.textPrimary },
  error: { fontFamily: systemFontFamily, fontSize: 15, lineHeight: 23, color: colors.error },
});
