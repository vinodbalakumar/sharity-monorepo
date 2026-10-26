import { useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { systemFontFamily } from '../../theme/typography';

export function AiCopy({ text, label = 'Copy response' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={() => {
    void Clipboard.setStringAsync(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(() => setCopied(false));
  }} style={{ minHeight: 44, paddingHorizontal: 12, justifyContent: 'center' }}><Text style={{ color: '#499b80', fontFamily: systemFontFamily, fontSize: 13 }}>{copied ? 'Copied' : label}</Text></Pressable>;
}
function Inline({ text, color }: { text: string; color: string }) {
  return <Text selectable style={{ color, fontFamily: systemFontFamily, fontSize: 16, lineHeight: 27 }}>{text.split(/(\*\*[^*]+\*\*|`[^`]+`|https:\/\/[^\s)<>]+)/g).map((part, index) =>
    part.startsWith('https://') ? <Text key={index} accessibilityRole="link" onPress={() => void Linking.openURL(part)} style={{ color: '#499b80', textDecorationLine: 'underline' }}>{part}</Text> :
      part.startsWith('**') ? <Text key={index} style={{ fontWeight: '700' }}>{part.slice(2, -2)}</Text> :
        part.startsWith('`') ? <Text key={index} style={{ fontFamily: 'monospace', color: '#499b80' }}>{part.slice(1, -1)}</Text> : <Text key={index}>{part.replace(/^#{1,6} /gm, '')}</Text>)}</Text>;
}
/** A deliberately small safe Markdown renderer: text, emphasis, links and fenced highlighted code. No HTML execution. */
export function AiMarkdown({ text, dark }: { text: string; dark: boolean }) {
  return <View style={{ gap: 14, minWidth: 0 }}>{text.split(/(```[\s\S]*?(?:```|$))/g).filter(Boolean).map((part, index) => {
    if (!part.startsWith('```')) return <Inline key={index} text={part} color={dark ? '#e7eae6' : '#273831'} />;
    const firstBreak = part.indexOf('\n');
    const language = firstBreak < 0 ? 'code' : part.slice(3, firstBreak).trim() || 'code';
    const code = (firstBreak < 0 ? part.slice(3) : part.slice(firstBreak + 1)).replace(/```$/, '').trimEnd();
    return <View key={index} style={{ borderRadius: 14, backgroundColor: '#162620', overflow: 'hidden', minWidth: 0 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 16 }}><Text style={{ color: '#abc3b7', fontSize: 12 }}>{language}</Text><AiCopy text={code} label="Copy code" /></View>
      <ScrollView horizontal style={{ maxWidth: '100%' }} contentContainerStyle={{ padding: 16, paddingTop: 0 }}><Text selectable style={{ fontFamily: 'monospace', fontSize: 13, lineHeight: 22, color: '#e5ece8' }}>{code.split(/("[^"\n]*"|'[^'\n]*'|\b(?:public|private|class|static|void|return|new|import|const|let|function|if|else|SELECT|FROM|WHERE|int|String|boolean)\b)/g).map((token, i) =>
        <Text key={i} style={{ color: /^["']/.test(token) ? '#dccc91' : /^(public|private|class|static|void|return|new|import|const|let|function|if|else|SELECT|FROM|WHERE|int|String|boolean)$/.test(token) ? '#8ed4b7' : '#e5ece8' }}>{token}</Text>)}</Text></ScrollView>
    </View>;
  })}</View>;
}
