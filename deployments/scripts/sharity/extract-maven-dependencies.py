"""Collect resolved runtime AND test dependency versions from successful Maven test reports.

Run after mvn verify in every service. This includes test tools deliberately;
it does not infer dependency versions from potentially stale POM declarations.
"""
from pathlib import Path
import xml.etree.ElementTree as ET

from workspace_paths import workspace_root
root = workspace_root()
modules = ['authorization-server', 'marketplace-service', 'payment-service', 'wallet-service',
           'platform-web-bff', 'tesla-dashboard-services', 'platform-ai-service']
for module in modules:
    reports = list((root / module / 'target/surefire-reports').glob('TEST-*.xml'))
    if not reports:
        raise RuntimeError(module + ': run Maven verification first')
    coordinates = set()
    # Every suite in one run uses the same resolved classpath. The newest report
    # avoids mixing excluded/stale suites from earlier dependency versions.
    for report in [max(reports, key=lambda item: item.stat().st_mtime)]:
        tree = ET.parse(str(report))
        if int(tree.getroot().get('failures', '0')) or int(tree.getroot().get('errors', '0')):
            raise RuntimeError(module + ': failed test report; dependency inventory is not a passing build')
        props = {p.attrib['name']: p.attrib.get('value', '') for p in tree.findall('.//property')}
        classpath = props.get('java.class.path', '')
        separator = ';' if ';' in classpath else ':'
        for entry in classpath.split(separator):
            entry = entry.replace('\\', '/')
            marker = '/.m2/repository/'
            if marker not in entry or not entry.endswith('.jar'):
                continue
            parts = entry.split(marker, 1)[1].split('/')
            if len(parts) >= 4:
                coordinates.add('.'.join(parts[:-3]) + ':' + parts[-3] + ':jar:' + parts[-2] + ':compile')
    if not coordinates:
        raise RuntimeError(module + ': no resolved dependencies found')
    (root / module / 'target/runtime-dependencies.txt').write_text('\n'.join(sorted(coordinates)), encoding='utf-8')
    print(module + ': ' + str(len(coordinates)) + ' resolved runtime/test dependencies')
