# TODO #3: Real-Time Updates (WebSocket/SSE)

**Priority:** MEDIUM | **Effort:** High (3-4 weeks) | **Impact:** Live updates for notifications, approvals, attendance

---

## 🎯 Objective
Implement real-time updates via WebSocket or Server-Sent Events (SSE) for live data across modules.

---

## 📍 Current State

### Polling-Based Updates (Current)
| Module | Feature | Current Method | Frequency |
|--------|---------|----------------|-----------|
| **notifications** | Notification center | `refetch()` on mount | Manual |
| **approvals** | Pending approvals | Manual refetch | Manual |
| **my-work** | Attendance status | Manual refetch | Manual |
| **admin** | Security events | Manual refetch | Manual |
| **profile** | Active sessions | Manual refetch | Manual |

**All real-time features currently require manual refresh.**

---

## 📂 Where to Implement

### 1. Backend (WebSocket/SSE Server)
```
server/
├── websocket/
│   ├── server.ts              # WebSocket server entry
│   ├── handlers/
│   │   ├── notifications.ts   # Notification events
│   │   ├── approvals.ts       # Approval events
│   │   ├── attendance.ts      # Attendance events
│   │   ├── security.ts        # Security events
│   │   └── presence.ts        # User presence
│   ├── auth.ts                # WS authentication
│   ├── rooms.ts               # Room/channel management
│   └── types.ts               # Event types
```

### 2. Frontend - Shared WebSocket Hook
```
src/shared/hooks/
├── useWebSocket.ts            # Core WS connection
├── useRealtimeNotifications.ts
├── useRealtimeApprovals.ts
├── useRealtimeAttendance.ts
├── useRealtimeSecurity.ts
├── usePresence.ts
└── useRealtimeQuery.ts        # TanStack Query + WS sync
```

### 3. Module Integration Points
```
src/modules/*/hooks/
├── notifications/
│   └── use-notifications.ts   # Add WS subscription
├── approvals/
│   └── use-approvals.ts       # Add WS subscription
├── my-work/
│   ├── use-my-attendance.ts   # Add WS subscription
│   └── use-my-approvals.ts    # Add WS subscription
├── admin/
│   ├── use-security-events.ts # Add WS subscription
│   └── use-active-sessions.ts # Add WS subscription
└── profile/
    └── use-profile.ts         # Add WS subscription
```

---

## 🔧 What Should Be Done

### 1. WebSocket Connection Manager
```typescript
// src/shared/hooks/useWebSocket.ts
interface WebSocketConfig {
  url: string;
  protocols?: string[];
  reconnectInterval?: number;
  maxRetries?: number;
  onOpen?: () => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  onMessage?: (data: WSMessage) => void;
}

interface WSMessage {
  type: string;
  payload: unknown;
  timestamp: string;
  correlationId?: string;
}

export function useWebSocket(config: WebSocketConfig) {
  // Implementation with:
  // - Auto-reconnect with exponential backoff
  // - Heartbeat/ping-pong
  // - Message queue for offline
  // - Connection state management
  // - Type-safe message handlers
}
```

### 2. Real-Time Query Sync Hook
```typescript
// src/shared/hooks/useRealtimeQuery.ts
interface RealtimeQueryOptions<T> {
  queryKey: QueryKey;
  wsEventType: string;
  onEvent: (event: WSMessage) => QueryClientUpdater<T>;
  enabled?: boolean;
}

export function useRealtimeQuery<T>({
  queryKey,
  wsEventType,
  onEvent,
  enabled = true,
}: RealtimeQueryOptions<T>) {
  const queryClient = useQueryClient();
  const { subscribe } = useWebSocket({ url: WS_URL });

  useEffect(() => {
    if (!enabled) return;
    
    const unsubscribe = subscribe(wsEventType, (event) => {
      queryClient.setQueryData(queryKey, (old: T | undefined) => 
        onEvent(event)(old)
      );
    });
    
    return unsubscribe;
  }, [queryKey, wsEventType, enabled]);
}
```

### 3. Module-Specific Hooks

#### Notifications
```typescript
// src/modules/notifications/hooks/use-notifications.ts
export function useNotifications() {
  const queryClient = useQueryClient();
  
  useRealtimeQuery({
    queryKey: queryKeys.notifications.list(),
    wsEventType: 'notification:created',
    onEvent: (event) => (old) => ({
      items: [event.payload, ...(old?.items ?? [])],
      total: (old?.total ?? 0) + 1,
    }),
  });

  // ... existing query logic
}
```

#### Approvals
```typescript
// src/modules/approvals/hooks/use-approvals.ts
export function usePendingApprovals() {
  useRealtimeQuery({
    queryKey: queryKeys.approvals.pending(),
    wsEventType: 'approval:status_changed',
    onEvent: (event) => (old) => {
      const updated = event.payload;
      return {
        items: old?.items.map((item) => 
          item.id === updated.id ? updated : item
        ) ?? [],
      };
    },
  });
  
  // ... existing query logic
}
```

#### Attendance
```typescript
// src/modules/my-work/hooks/use-my-attendance.ts
export function useMyAttendance() {
  useRealtimeQuery({
    queryKey: queryKeys.myWork.attendance.todayInfo(),
    wsEventType: 'attendance:checkin',
    onEvent: (event) => (old) => event.payload,
  });
  
  useRealtimeQuery({
    queryKey: queryKeys.myWork.attendance.todayInfo(),
    wsEventType: 'attendance:checkout',
    onEvent: (event) => (old) => event.payload,
  });
  
  useRealtimeQuery({
    queryKey: queryKeys.myWork.attendance.todayInfo(),
    wsEventType: 'attendance:break_started',
    onEvent: (event) => (old) => ({ ...old, onBreak: true }),
  });
  
  // ... existing query logic
}
```

#### Security Center
```typescript
// src/modules/admin/hooks/use-security-score.ts
export function useSecurityEvents() {
  useRealtimeQuery({
    queryKey: queryKeys.admin.security.events(),
    wsEventType: 'security:event',
    onEvent: (event) => (old) => ({
      items: [event.payload, ...(old?.items ?? [])].slice(0, 100),
    }),
  });
  
  // ... existing query logic
}
```

#### User Presence
```typescript
// src/shared/hooks/usePresence.ts
export function useUserPresence(userId?: string) {
  const [presence, setPresence] = useState<Map<string, UserPresence>>(new Map());
  
  useRealtimeQuery({
    queryKey: ['presence', userId],
    wsEventType: 'presence:update',
    onEvent: (event) => (old) => {
      const newMap = new Map(old);
      newMap.set(event.payload.userId, event.payload);
      return newMap;
    },
  });
  
  return presence.get(userId ?? '');
}

interface UserPresence {
  userId: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen: string;
  device?: string;
}
```

---

## 🔧 Backend Event Types

### Event Schema
```typescript
// server/websocket/types.ts
interface BaseEvent {
  type: string;
  timestamp: string;
  correlationId: string;
}

interface NotificationCreatedEvent extends BaseEvent {
  type: 'notification:created';
  payload: Notification;
}

interface ApprovalStatusChangedEvent extends BaseEvent {
  type: 'approval:status_changed';
  payload: { id: string; status: ApprovalStatus; updatedAt: string };
}

interface AttendanceCheckinEvent extends BaseEvent {
  type: 'attendance:checkin';
  payload: TodayAttendanceSession;
}

interface SecurityEventEvent extends BaseEvent {
  type: 'security:event';
  payload: SecurityEvent;
}

interface PresenceUpdateEvent extends BaseEvent {
  type: 'presence:update';
  payload: UserPresence;
}

type WSMessage = 
  | NotificationCreatedEvent
  | ApprovalStatusChangedEvent
  | AttendanceCheckinEvent
  | SecurityEventEvent
  | PresenceUpdateEvent;
```

### Server-Side Event Emission
```typescript
// server/websocket/handlers/notifications.ts
export function emitNotificationCreated(notification: Notification) {
  broadcastToUser(notification.userId, {
    type: 'notification:created',
    payload: notification,
    timestamp: new Date().toISOString(),
    correlationId: crypto.randomUUID(),
  });
}

// server/websocket/handlers/approvals.ts
export function emitApprovalStatusChanged(approval: Approval) {
  broadcastToRelevantUsers(approval, {
    type: 'approval:status_changed',
    payload: { id: approval.id, status: approval.status, updatedAt: approval.updatedAt },
    timestamp: new Date().toISOString(),
    correlationId: crypto.randomUUID(),
  });
}
```

---

## 📋 Implementation Checklist

### Backend
- [ ] WebSocket server with authentication
- [ ] Room/channel management (user rooms, org rooms, public rooms)
- [ ] Event handlers for each domain
- [ ] Connection lifecycle (heartbeat, reconnection)
- [ ] Message broadcasting (to user, to room, to org)
- [ ] Message persistence for offline users
- [ ] Rate limiting per connection
- [ ] SSL/TLS termination

### Frontend - Core
- [ ] `useWebSocket` hook with reconnection logic
- [ ] `useRealtimeQuery` for TanStack Query sync
- [ ] Message type definitions
- [ ] Connection state management (connecting, connected, disconnected, error)
- [ ] Automatic reconnection with exponential backoff
- [ ] Heartbeat mechanism (ping/pong every 30s)

### Frontend - Module Integration
- [ ] Notifications: `notification:created` → update list
- [ ] Approvals: `approval:status_changed` → update item
- [ ] Attendance: `attendance:checkin/out/break` → update today info
- [ ] Security: `security:event` → prepend to list
- [ ] Presence: `presence:update` → update user status indicators

### UI Indicators
- [ ] Connection status badge (header)
- [ ] Real-time badge on notifications icon
- [ ] Live approval count in header
- [ ] Attendance status live updates
- [ ] User presence dots (green/red/gray)

---

## 📋 Migration Checklist

### Phase 1: Foundation (Week 1)
- [ ] WebSocket server setup with auth
- [ ] `useWebSocket` hook with reconnection
- [ ] `useRealtimeQuery` hook
- [ ] Type definitions for all events

### Phase 2: Core Modules (Week 2)
- [ ] Notifications real-time
- [ ] Approvals real-time
- [ ] Presence system

### Phase 3: Extended Modules (Week 3)
- [ ] Attendance real-time
- [ ] Security events real-time
- [ ] Profile sessions real-time

### Phase 4: Polish (Week 4)
- [ ] Connection status UI
- [ ] Offline message queue
- [ ] Reconnection UX (toast notifications)
- [ ] Load testing

---

## 📋 Acceptance Criteria

- [ ] Notifications appear within 500ms of creation
- [ ] Approval status updates reflect within 1s
- [ ] Attendance check-in/out reflects immediately
- [ ] Security events appear in real-time
- [ ] User presence updates within 2s
- [ ] Reconnection within 5s after network loss
- [ ] No memory leaks (cleanup on unmount)
- [ ] Works across browser tabs (shared connection)
- [ ] Graceful degradation when WS unavailable (fallback to polling)

---

## 📝 API Contract

### WebSocket URL
```
wss://api.bytevon.com/ws?v=1&token=<jwt>
```

### Connection Flow
```
Client -> WS Connect (with JWT) 
  -> Server validates JWT
  -> Server joins user to rooms (user:{id}, org:{id})
  -> Server sends { type: 'connected', payload: { userId, rooms } }
  -> Client subscribes to events
```

### Message Format
```json
{
  "type": "notification:created",
  "payload": { "id": "123", "title": "New message", ... },
  "timestamp": "2026-09-04T10:30:00.000Z",
  "correlationId": "uuid"
}
```

### Heartbeat
```json
// Client -> Server (every 30s)
{ "type": "ping", "timestamp": "2026-09-04T10:30:00.000Z" }

// Server -> Client (immediate)
{ "type": "pong", "timestamp": "2026-09-04T10:30:00.001Z" }
```