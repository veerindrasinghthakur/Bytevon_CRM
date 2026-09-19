import json
with open('Z:/bytevon extra/Bytevon_frontend/bytevon_documentation/02_backend_code/API_ENDPOINTS.json') as f:
    data = json.load(f)
print(f'Total endpoints: {len(data["endpoints"])}')
modules = {}
for ep in data["endpoints"]:
    m = ep["module"]
    modules[m] = modules.get(m, 0) + 1
for m, c in sorted(modules.items()):
    print(f'  {m}: {c}')