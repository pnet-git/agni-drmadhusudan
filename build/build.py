#!/usr/bin/env python3
"""Assemble agni/index.html from the Modak page's CSS plus the Agni body and script.
Run from anywhere: python3 build/build.py
"""
import re, pathlib

HERE = pathlib.Path(__file__).resolve().parent
AGNI = HERE.parent
MODAK = AGNI.parent / "modak" / "index.html"

src = MODAK.read_text(encoding="utf-8")
head_end = src.index("</style>") + len("</style>")
head = src[:head_end]

# ---- palette: maroon family becomes green family, gold becomes amber gold ----
head = head.replace("--maroon-dark", "--green-dark").replace("--maroon", "--green")
head = head.replace("#8B1538", "#1F4D3A").replace("#5C0E25", "#123526")
head = head.replace("#C9A14A", "#D99A1E").replace("#E5C77E", "#F2C94C")
head = head.replace("#FAF6EE", "#FBF7EC").replace("#F0E9DC", "#F3EBD6")
head = head.replace("#2A1810", "#1E2A22").replace("#5C4836", "#4E5C52")
head = head.replace("139,21,56", "31,77,58").replace("139, 21, 56", "31, 77, 58")
head = head.replace("91,14,37", "18,53,38").replace("91, 14, 37", "18, 53, 38")
head = head.replace("201,161,74", "217,154,30").replace("201, 161, 74", "217, 154, 30")

# ---- title and meta ----
head = re.sub(r"<title>.*?</title>",
              "<title>Agni Drops — Lose 3 to 4 kg In 30 Days, No Starving, No Gym | Dr. Madhu Sudan</title>", head, flags=re.S)
head = re.sub(r'<meta name="description" content=".*?">',
              '<meta name="description" content="Ayurvedic metabolism drops by Dr. Madhu Sudan. Wake the digestive fire. Lose 3 to 4 kg in your first 30 days with no starving, no gym, no laxative. Free online consultation with every pack.">', head, flags=re.S)
head = head.replace('<link rel="icon" href="/favicon.ico">', '<link rel="icon" href="/public/favicon.png">')

extra_css = (HERE / "extra.css").read_text(encoding="utf-8")
head = head.replace("</style>", "\n/* ===== AGNI ADDITIONS ===== */\n" + extra_css + "\n</style>")

body = (HERE / "body.html").read_text(encoding="utf-8")
script = (HERE / "script.js").read_text(encoding="utf-8")

out = head + "\n</head>\n<body>\n\n" + body + "\n\n<script>\n" + script + "\n</script>\n\n</body>\n</html>\n"
(AGNI / "index.html").write_text(out, encoding="utf-8")
print("wrote", AGNI / "index.html", len(out), "bytes")

# ---- sanity: every class used in the body has a rule in the head ----
used = set(re.findall(r'class="([^"]+)"', body))
names = set()
for u in used:
    names.update(u.split())
missing = sorted(n for n in names if ("." + n) not in head)
print("classes with no CSS rule:", missing or "none")
