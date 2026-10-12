#!/usr/bin/env python3
"""Build a QA report and optionally ask an AI reviewer for prioritised advice."""
import json, os, sys, urllib.request, xml.etree.ElementTree as ET
from pathlib import Path
junit_path = Path(sys.argv[1] if len(sys.argv) > 1 else "ibadan-life-qa-report.xml")
out = Path("qa-output"); out.mkdir(exist_ok=True)
summary = {"target": os.getenv("IBADAN_LIFE_URL", "https://acerolaorionjr.github.io/ibadan-life/"), "automated_test_status": "not run", "tests": 0, "failures": 0, "errors": 0, "skipped": 0, "test_cases": [], "ai_review": "not enabled"}
if junit_path.exists():
    root = ET.parse(junit_path).getroot()
    suites = [root] if root.tag == "testsuite" else list(root.iter("testsuite"))
    for suite in suites:
        for key in ("tests", "failures", "errors", "skipped"):
            summary[key] += int(suite.attrib.get(key, 0))
        for case in suite.findall("testcase"):
            status, detail = "passed", ""
            for kind in ("failure", "error", "skipped"):
                node = case.find(kind)
                if node is not None:
                    status, detail = kind, (node.attrib.get("message") or node.text or "")[:1600]
                    break
            summary["test_cases"].append({"name": case.attrib.get("name", "test"), "status": status, "detail": detail})
    summary["automated_test_status"] = "failed" if summary["failures"] or summary["errors"] else "passed"
if (out / "exploration.json").exists():
    summary["exploration"] = json.loads((out / "exploration.json").read_text(encoding="utf-8"))
summary["scope_notes"] = [
 "Browser automation validates only reachable flows; it cannot prove every gameplay state is correct.",
 "The game states profile/game saves are local to this device; cloud sync and multiplayer need separately configured backend tests.",
 "Interstate travel currently simulates fares and time; separate explorable state maps are described as future work.",
 "Real Android hardware performance, install behaviour and touch feel still need device testing."
]
summary["suggested_review_topics"] = [
 "Check money/economy balance across LAPO Baby, Student, Nepo Baby and other starts.",
 "Check career progression, energy/needs, rent, business income, purchases, investments and travel costs for exploits or soft locks.",
 "Compare current features with The Sims Mobile, BitLife and other life sims using current public information.",
 "Recommend additions/removals in priority order, keeping the Nigerian/Ibadan setting distinctive and separating implemented features from roadmap ideas."
]
def call_ai():
    key = os.getenv("OPENAI_API_KEY")
    if not key: return None, "AI review not enabled: add repository secret OPENAI_API_KEY."
    prompt = ("Act as a senior game QA lead and product reviewer. Review this Ibadan Life browser-QA evidence. "
      "Be honest about what was and wasn't tested. Prioritise reproducible bugs, economy/progression risks, then additions/removals. "
      "Compare to relevant life-simulation games using current web sources, and cite links for competitor claims. "
      "Do not claim a feature works unless evidence supports it. Output concise Markdown: Executive summary; Critical/High/Medium/Low bugs; "
      "Feature coverage; Balance/exploit risks; Add; Improve; Remove/defer; comparison notes with sources; next actions. "
      "Game context: mobile-first 3D life sim set in Ibadan, Nigeria. Character backgrounds include LAPO Baby, Student, Nepo Baby; systems include needs, "
      "jobs/careers, bank/debt/savings, housing/rent, businesses, advertising, investing, travel to Nigerian cities, missions, events, vehicles, wardrobe and buy mode. "
      "Some services are local-only or prototype-level. QA data JSON: " + json.dumps(summary)[:22000])
    payload = {"model":"gpt-4.1-mini", "tools":[{"type":"web_search_preview"}],
      "input":[{"role":"user","content":[{"type":"input_text","text":prompt}]}], "max_output_tokens":3500}
    req = urllib.request.Request("https://api.openai.com/v1/responses", data=json.dumps(payload).encode(),
      headers={"Authorization":"Bearer "+key,"Content-Type":"application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=90) as response: data = json.loads(response.read().decode())
        chunks = [c.get("text","") for item in data.get("output",[]) for c in item.get("content",[]) if c.get("type")=="output_text"]
        return "\n".join(chunks).strip(), None
    except Exception as exc:
        return None, "AI review could not run ("+type(exc).__name__+"). Automated test report remains available."
review, error = call_ai()
if review:
    summary["ai_review"] = "completed"; (out/"AI_REVIEW.md").write_text(review+"\n",encoding="utf-8")
elif error:
    summary["ai_review"] = error; (out/"AI_REVIEW.md").write_text("# AI review\n\n"+error+"\n",encoding="utf-8")
(out/"qa-report.json").write_text(json.dumps(summary,indent=2),encoding="utf-8")
lines = ["# Ibadan Life — QA Agent Report","",f"- **Live target:** {summary['target']}",f"- **Automated tests:** {summary['automated_test_status']} ({summary['tests']} tests; {summary['failures']} failures; {summary['errors']} errors; {summary['skipped']} skipped)",f"- **AI review:** {summary['ai_review']}","","## Test results",""]
for case in summary["test_cases"]:
    suffix = " — "+case["detail"] if case["detail"] else ""
    lines.append(f"- **{case['status'].upper()}** {case['name']}{suffix}")
if summary.get("exploration"):
    exp=summary["exploration"]
    lines += ["","## Exploratory coverage","",f"- Phone apps visited: {len(exp.get('tested_apps',[]))}",f"- Game actions clicked: {len(exp.get('tested_actions',[]))}",f"- Navigation tabs visited: {len(exp.get('tested_tabs',[]))}",f"- Runtime errors captured: {len(exp.get('runtime_errors',[]))}"]
lines += ["","## Limitations",""] + ["- "+note for note in summary["scope_notes"]]
(out/"QA_REPORT.md").write_text("\n".join(lines)+"\n",encoding="utf-8")
print("\n".join(lines))
