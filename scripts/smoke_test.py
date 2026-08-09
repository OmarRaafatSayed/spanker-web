import urllib.request
import json
import sys

BASE = "http://localhost:3000/api/backend"
PASS = 0
FAIL = 0

def req_get(path):
    r = urllib.request.urlopen(f"{BASE}{path}", timeout=8)
    return r.status, json.loads(r.read().decode())

def req_post(path, body, token=None):
    data = json.dumps(body).encode()
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    r = urllib.request.Request(f"{BASE}{path}", data=data, headers=headers)
    try:
        with urllib.request.urlopen(r, timeout=15) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())

def check(label, condition, detail=""):
    global PASS, FAIL
    if condition:
        print(f"  PASS  {label}" + (f" — {detail}" if detail else ""))
        PASS += 1
    else:
        print(f"  FAIL  {label}" + (f" — {detail}" if detail else ""))
        FAIL += 1

print("\n=== SMOKE TEST ===\n")

# 1. Health checks
for svc in ["/auth/health", "/flights/health", "/hotels/health", "/visa/health", "/payments/health"]:
    try:
        status, body = req_get(svc)
        check(svc, status == 200, body.get("status", ""))
    except Exception as e:
        check(svc, False, str(e))

# 2. Login via proxy
try:
    status, body = req_post("/auth/login", {
        "email": "omarraafat939@gmail.com",
        "password": "NewPass123!"
    })
    ok = status == 200 and body.get("success")
    check("/auth/login", ok, body.get("user", {}).get("email", "") if ok else str(body))
    token = body["session"]["access_token"] if ok else None
except Exception as e:
    check("/auth/login", False, str(e))
    token = None

# 3. Flight search — anonymous (no token)
try:
    status, body = req_post("/flights/search", {
        "origin": "CAI", "destination": "LHR",
        "departure_date": "2026-09-20",
        "passenger_count": 1, "travel_class": "economy"
    })
    flights = body.get("flights", [])
    ok = status == 200 and body.get("success") and len(flights) > 0
    detail = f"{len(flights)} results (no login)" if ok else str(body)
    check("/flights/search anonymous", ok, detail)
except Exception as e:
    check("/flights/search anonymous", False, str(e))

# 4. Flight search one-way (authenticated)
if token:
    try:
        status, body = req_post("/flights/search", {
            "origin": "CAI", "destination": "LHR",
            "departure_date": "2026-09-20",
            "passenger_count": 1, "travel_class": "economy"
        }, token)
        flights = body.get("flights", [])
        ok = status == 200 and body.get("success") and len(flights) > 0
        detail = f"{len(flights)} results, first: {flights[0]['airline']} {flights[0]['price']} {flights[0]['price_currency']}" if ok else str(body)
        check("/flights/search one-way", ok, detail)
    except Exception as e:
        check("/flights/search one-way", False, str(e))

    # 4. Flight search round-trip
    try:
        status, body = req_post("/flights/search", {
            "origin": "CAI", "destination": "DXB",
            "departure_date": "2026-10-01", "return_date": "2026-10-08",
            "passenger_count": 2, "travel_class": "business"
        }, token)
        flights = body.get("flights", [])
        ok = status == 200 and body.get("success") and len(flights) > 0
        check("/flights/search round-trip", ok, f"{len(flights)} results" if ok else str(body))
    except Exception as e:
        check("/flights/search round-trip", False, str(e))

# 5. Frontend homepage
try:
    r = urllib.request.urlopen("http://localhost:3000", timeout=5)
    check("Frontend homepage", r.status == 200, f"HTTP {r.status}")
except Exception as e:
    check("Frontend homepage", False, str(e))

# Summary
print(f"\n{'='*30}")
print(f"  PASSED: {PASS}   FAILED: {FAIL}")
print(f"{'='*30}\n")

sys.exit(0 if FAIL == 0 else 1)
