# Merge a {"key.path": [en, hi]} JSON file into locales/en.json and locales/hi.json.
#   python scripts/i18n-merge.py <additions.json>
import json, sys

adds = json.load(open(sys.argv[1], encoding="utf-8"))
for idx, lang in enumerate(["en", "hi"]):
    path = f"locales/{lang}.json"
    data = json.load(open(path, encoding="utf-8"))
    for key, values in adds.items():
        node = data
        *parents, leaf = key.split(".")
        for p in parents:
            node = node.setdefault(p, {})
        node[leaf] = values[idx]
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")
