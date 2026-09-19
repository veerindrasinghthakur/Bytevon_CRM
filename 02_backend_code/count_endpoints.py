import os, re

route_files = []
for root, dirs, files in os.walk('app/modules'):
    for f in files:
        if f == 'routes.py':
            route_files.append(os.path.join(root, f))

print(f'Total routes.py files: {len(route_files)}')
print()

endpoint_count = 0
for rf in route_files:
    with open(rf) as f:
        content = f.read()
    matches = re.findall(r'@router\.(get|post|put|patch|delete|head|options)\([^)]+\)', content)
    if matches:
        endpoint_count += len(matches)
        
print(f'Total endpoint definitions (rough): {endpoint_count}')
print()

for rf in sorted(route_files):
    with open(rf) as f:
        content = f.read()
    paths = re.findall(r'@router\.(get|post|put|patch|delete|head|options)\s*\(\s*["\']([^"\']+)["\']', content)
    if not paths:
        paths = re.findall(r'@router\.(get|post|put|patch|delete|head|options)\s*\(\s*["\']', content)
    print(f'  {rf.split("/")[-1]}: {len(paths) if paths else "?"} explicit paths')