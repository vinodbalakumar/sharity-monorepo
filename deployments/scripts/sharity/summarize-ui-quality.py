"""Combine immutable Playwright reports, resolving rerun scenarios by their identity."""
import hashlib
import json
from pathlib import Path
from workspace_paths import workspace_root

root = workspace_root()
sources = ["quality-playwright-final.json", "quality-boundaries.json", "quality-rewards-final.json", "quality-recovery-final.json", "quality-stock-final.json", "quality-discovery-final.json"]
records = {}


def read_specs(suite):
    for spec in suite.get("specs", []):
        yield spec
    for child in suite.get("suites", []):
        yield from read_specs(child)


reports = []
for name in sources:
    report = json.loads((root / "outputs" / name).read_text(encoding="utf-8-sig"))
    if report.get("errors"):
        raise RuntimeError("Report contains runner errors: " + name)
    reports.append({"file": name, "stats": report["stats"]})
    for spec in read_specs(report):
        for case in spec["tests"]:
            identity = (case["projectName"], spec["file"], spec["title"])
            results = case.get("results", [])
            records[identity] = {
                "project": identity[0], "file": identity[1], "scenario": identity[2],
                "status": results[-1]["status"] if results else "not-run", "report": name,
            }

failed = [item for item in records.values() if item["status"] != "passed"]
bundle = next((root / "sharity-app-ui/dist-e2e/_expo/static/js/web").glob("index-*.js"))
summary = {
    "stats": {"expected": len(records) - len(failed), "unexpected": len(failed)},
    "reports": reports,
    "bundle": bundle.name,
    "bundleSha256": hashlib.sha256(bundle.read_bytes()).hexdigest(),
    "scenarios": list(records.values()),
    "note": "The original regression run retained two refund-recovery failures; the feature-boundary run exposed malformed rewards data. "
            "Focused tests on the final export cover the replaced issue form, valid rewards fixtures, malformed rewards recovery and preview labels. "
            "All original reports are preserved; scenario identities select the latest result.",
}
(root / "outputs/quality-verified-results.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
print(json.dumps({"verified": summary["stats"], "failed": failed}))
if failed:
    raise SystemExit(1)
