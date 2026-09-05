# Pull latest frontend (Codespaces / local)

If the UI looks stale after commits, force-sync to `main`:

```bash
cd frontend_code
git fetch origin
git checkout main
git pull origin main
npm install
npm run dev
```

## Features that must be present after pull

| Feature | Where |
|--------|--------|
| Login mock `admin` / `123` | `/login` |
| Post-login → `/dashboard` | Auth |
| SVG BrandLogo | Rail + auth pages |
| Rail collapse chevron half outside border | Primary rail logo hover |
| **My Notifications** | Header bell → `/notifications` |
| **Profile active** | Left border + avatar deep navy on `/profile` |
| **Edit mode** | Profile (Edit Profile / pencil), Project detail (Edit) |
| Enter advances fields | Login, create forms |

Last verified commit series includes: notifications route, profile edit mode, project edit mode, header active states.
