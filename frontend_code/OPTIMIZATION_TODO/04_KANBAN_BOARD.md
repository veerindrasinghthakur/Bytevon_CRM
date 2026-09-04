# TODO #4: Kanban Board for Tasks

**Priority:** MEDIUM | **Effort:** High (3-4 weeks) | **Impact:** Visual task management, drag-drop workflow

---

## 🎯 Objective
Implement a Kanban board view for tasks with drag-and-drop, replacing/augmenting the current table view.

---

## 📍 Current State

### Current Task Views
| View | Location | Features |
|------|----------|----------|
| **Table View** | `TasksListPage.tsx` | Sortable, filterable, paginated |
| **Detail View** | `TaskDetailPage.tsx` | Full details, inline edit |
| **Create Modal** | `CreateTaskModal.tsx` | Form with validation |

**Missing:** Kanban board with drag-drop between status columns.

---

## 📂 Where to Implement

### 1. New Components
```
src/shared/components/kanban/
├── KanbanBoard.tsx            # Main board container
├── KanbanColumn.tsx           # Single status column
├── KanbanCard.tsx             # Draggable task card
├── KanbanHeader.tsx           # Board header with filters
├── KanbanEmptyState.tsx       # Empty column state
└── useKanbanDnD.ts           # Drag-drop logic (react-dnd or dnd-kit)
```

### 2. Project Module Integration
```
src/modules/projects/
├── pages/
│   ├── TasksKanbanPage.tsx    # New Kanban page
│   └── ProjectDetailPage.tsx  # Add Kanban tab
├── hooks/
│   └── use-tasks-kanban.ts    # Kanban-specific data/hooks
├── components/
│   └── TaskKanbanCard.tsx     # Project-specific card
└── routes.tsx                 # Add /projects/:id/kanban route
```

---

## 🔧 What Should Be Done

### 1. Drag-and-Drop Library Selection
**Recommendation: `@dnd-kit/core`** (modern, accessible, TypeScript-first)

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### 2. Core Kanban Types
```typescript
// src/shared/components/kanban/types.ts
interface KanbanColumn {
  id: TaskStatus;
  title: string;
  order: number;
  taskIds: number[];
  limit?: number; // WIP limit
  color?: string;
}

interface KanbanTask {
  id: number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeName?: string;
  assigneeInitials?: string;
  dueDate?: string;
  projectName?: string;
  projectId?: number;
  tags?: string[];
}

interface KanbanBoardState {
  columns: Record<TaskStatus, KanbanColumn>;
  tasks: Record<number, KanbanTask>;
  columnOrder: TaskStatus[];
}
```

### 3. Main Kanban Board Component
```tsx
// src/shared/components/kanban/KanbanBoard.tsx
interface KanbanBoardProps {
  tasks: KanbanTask[];
  columns: KanbanColumn[];
  onTaskMove: (taskId: number, newStatus: TaskStatus, newIndex: number) => Promise<void>;
  onTaskClick: (task: KanbanTask) => void;
  onTaskCreate: (columnId: TaskStatus) => void;
  filters?: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
  loading?: boolean;
  className?: string;
}

export function KanbanBoard({
  tasks,
  columns,
  onTaskMove,
  onTaskClick,
  onTaskCreate,
  filters,
  onFiltersChange,
  loading,
  className,
}: KanbanBoardProps) {
  const { sensor, useSensor, useSensors, DragOverlay } = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );
  
  const { useDroppable } = useDroppable;
  
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className={cn('flex gap-4 overflow-x-auto pb-4', className)}>
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={tasks.filter(t => t.status === column.id)}
            onTaskClick={onTaskClick}
            onTaskCreate={() => onTaskCreate(column.id)}
          />
        ))}
      </div>
      <DragOverlay>
        {({ activator }) => activator && <KanbanCard task={activator.data.current.task} isDragging />}
      </DragOverlay>
    </DndContext>
  );
}
```

### 4. Kanban Column Component
```tsx
// src/shared/components/kanban/KanbanColumn.tsx
interface KanbanColumnProps {
  column: KanbanColumn;
  tasks: KanbanTask[];
  onTaskClick: (task: KanbanTask) => void;
  onTaskCreate: () => void;
}

export function KanbanColumn({ column, tasks, onTaskClick, onTaskCreate }) {
  const { setNodeRef, isOver } = useDroppable(column.id, {
    canDropOnMe: ({ active }) => {
      // Optional: limit WIP
      return !column.limit || tasks.length < column.limit;
    },
  });

  return (
    <div ref={setNodeRef} className={cn('flex flex-col min-w-[300px] max-w-[350px]', isOver && 'ring-2 ring-secondary')}>
      <div className="flex items-center justify-between px-3 py-2 bg-surface-container rounded-t-xl">
        <h3 className="font-semibold text-on-background">{column.title}</h3>
        <span className="text-sm text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>
      
      <div
        className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[400px]"
        role="list"
        aria-label={`${column.title} tasks`}
      >
        {tasks.map((task) => (
          <KanbanCard
            key={task.id}
            task={task}
            onClick={() => onTaskClick(task)}
          />
        ))}
        
        {tasks.length === 0 && (
          <div className="text-center py-8 text-on-surface-variant">
            <p className="text-sm">No tasks</p>
            <p className="text-xs opacity-60">Drag tasks here or click +</p>
          </div>
        )}
      </div>
      
      <button
        type="button"
        onClick={onTaskCreate}
        className="w-full px-3 py-2 text-sm font-medium text-secondary hover:bg-secondary/10 rounded-b-xl border-t border-outline-variant flex items-center justify-center gap-1"
      >
        <span className="material-symbols-outlined text-[18px]">add</span>
        Add task
      </button>
    </div>
  );
}
```

### 5. Kanban Card Component
```tsx
// src/shared/components/kanban/KanbanCard.tsx
interface KanbanCardProps {
  task: KanbanTask;
  onClick: (task: KanbanTask) => void;
  isDragging?: boolean;
}

export function KanbanCard({ task, onClick, isDragging }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isDragActive } = useDraggable({
    id: String(task.id),
    data: { task },
  });

  const style = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    transition,
    opacity: isDragging ? 0.5 : 1,
    boxShadow: isDragActive ? '0 8px 16px -4px rgba(0,0,0,0.3)' : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-surface-container-lowest border border-outline-variant rounded-xl p-3 cursor-pointer transition-all',
        'hover:shadow-md hover:border-secondary/50',
        isDragging && 'opacity-50 rotate-1 scale-102'
      )}
      onClick={() => onClick(task)}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold uppercase', priorityStyles[task.priority])}>
          {task.priority}
        </span>
        {task.dueDate && (
          <span className={cn('px-2 py-0.5 rounded text-[10px] font-medium', isOverdue(task.dueDate) ? 'bg-error/10 text-error' : 'bg-surface-container text-on-surface-variant')}>
            {formatDate(task.dueDate)}
          </span>
        )}
      </div>
      
      <h4 className="font-semibold text-on-background mb-1 line-clamp-1">{task.title}</h4>
      {task.description && (
        <p className="text-sm text-on-surface-variant line-clamp-2 mb-2">{task.description}</p>
      )}
      
      <div className="flex items-center justify-between text-xs text-on-surface-variant">
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">person</span>
          {task.assigneeInitials ?? '—'}
        </span>
        {task.projectName && (
          <span className="flex items-center gap-1 opacity-70">
            <span className="material-symbols-outlined text-[14px]">folder</span>
            {task.projectName}
          </span>
        )}
      </div>
    </div>
  );
}
```

---

## 📂 Module Integration

### 1. Projects Module - Kanban Page
```tsx
// src/modules/projects/pages/TasksKanbanPage.tsx
export function TasksKanbanPage() {
  const navigate = useNavigate();
  const { filteredTasks, statusFilter, setStatusFilter } = useTasksKanban();
  
  const columns = useMemo(() => [
    { id: 'TODO', title: 'To Do', order: 0, color: 'bg-surface-container' },
    { id: 'IN_PROGRESS', title: 'In Progress', order: 1, color: 'bg-primary/10' },
    { id: 'IN_REVIEW', title: 'In Review', order: 2, color: 'bg-violet-100' },
    { id: 'DONE', title: 'Done', order: 3, color: 'bg-emerald-100' },
    { id: 'BLOCKED', title: 'Blocked', order: 4, color: 'bg-error/10' },
    { id: 'ON_HOLD', title: 'On Hold', order: 5, color: 'bg-amber-100' },
  ] as KanbanColumn[], []);

  const handleTaskMove = async (taskId: number, newStatus: TaskStatus, newIndex: number) => {
    await updateTaskStatus(taskId, newStatus);
    // Optimistic update handled by hook
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Tasks Kanban" ... />
      <KanbanBoard
        tasks={filteredTasks}
        columns={columns}
        onTaskMove={handleTaskMove}
        onTaskClick={(task) => safeNavigate(navigate, { to: projectRoutes.taskDetail(task.id) })}
        onTaskCreate={(status) => openCreateModal({ status })}
      />
    </div>
  );
}
```

### 2. Hook for Kanban Data
```typescript
// src/modules/projects/hooks/use-tasks-kanban.ts
export function useTasksKanban(filters?: TaskFilters) {
  const query = useQuery({
    queryKey: queryKeys.tasks.kanban(filters),
    queryFn: () => getTasksKanban(filters),
  });

  const updateStatus = useMutation({
    mutationFn: ({ taskId, status }: { taskId: number; status: TaskStatus }) => 
      updateTask(taskId, { status }),
    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.kanban() });
      const previous = queryClient.getQueryData(queryKeys.tasks.kanban());
      
      queryClient.setQueryData(queryKeys.tasks.kanban(), (old) => ({
        ...old,
        tasks: old.tasks.map(t => t.id === taskId ? { ...t, status } : t),
        columns: updateColumnTaskIds(old.columns, taskId, status),
      });
      
      return { previous };
    },
    onError: (err, vars, context) => {
      queryClient.setQueryData(queryKeys.tasks.kanban(), context?.previous);
    },
  });

  return {
    tasks: query.data?.tasks ?? [],
    columns: query.data?.columns ?? [],
    isLoading: query.isLoading,
    moveTask: updateStatus.mutateAsync,
  };
}
```

### 3. Route Integration
```tsx
// src/modules/projects/routes.tsx
export const projectRoutes = {
  // ... existing
  taskKanban: (projectId?: string) => `/projects/${projectId}/kanban`,
} as const;

// In createProjectsRoutes:
createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/projects/$projectId/kanban',
  component: TasksKanbanPage,
}),
```

---

## 🎨 Drag-and-Drop Features

### Core Interactions
| Interaction | Behavior |
|-------------|----------|
| **Drag card** | Lift with 8px distance threshold |
| **Drop in column** | Snap to column, insert at position |
| **Reorder within column** | Vertical reorder with visual indicator |
| **Drag scroll** | Auto-scroll when near edges |
| **Keyboard support** | Arrow keys to move, Enter to pick up, Escape to cancel |
| **Touch support** | Long press to initiate on mobile |

### Visual Feedback
| State | Style |
|-------|-------|
| **Dragging** | `opacity-50 rotate-1 scale-102` + shadow |
| **Over valid drop** | Column `ring-2 ring-secondary` |
| **Over invalid** | Column `ring-2 ring-error` |
| **Ghost** | Semi-transparent card follows cursor |

### WIP Limits
```typescript
// Optional: Per-column WIP limits
const columns: KanbanColumn[] = [
  { id: 'TODO', title: 'To Do', order: 0, limit: 20 },
  { id: 'IN_PROGRESS', title: 'In Progress', order: 1, limit: 5, color: 'bg-primary/10' },
  { id: 'IN_REVIEW', title: 'In Review', order: 2, limit: 3, color: 'bg-violet-100' },
  { id: 'DONE', title: 'Done', order: 3, color: 'bg-emerald-100' },
];
```

---

## 📋 Migration Checklist

### Core Components
- [ ] `KanbanBoard` with DndContext
- [ ] `KanbanColumn` with useDroppable
- [ ] `KanbanCard` with useDraggable
- [ ] `DragOverlay` for ghost preview
- [ ] `useKanbanDnD` hook for shared logic

### Project Module
- [ ] `TasksKanbanPage.tsx` page
- [ ] `use-tasks-kanban.ts` hook
- [ ] Route `/projects/:id/kanban`
- [ ] Add Kanban tab to `ProjectDetailPage`

### API
- [ ] `updateTaskStatus` mutation
- [ ] `getTasksKanban` query (grouped by status)

### UI/UX
- [ ] Column headers with counts
- [ ] WIP limit indicators
- [ ] Empty column states
- [ ] Loading skeletons
- [ ] Empty board state
- [ ] Mobile responsive (horizontal scroll)
- [ ] Keyboard accessibility
- [ ] Touch support

### Testing
- [ ] Drag-drop between columns
- [ ] Reorder within column
- [ ] WIP limit enforcement
- [ ] Optimistic updates
- [ ] Error rollback
- [ ] Mobile touch
- [ ] Keyboard navigation
- [ ] Screen reader support

---

## 📋 Acceptance Criteria

- [ ] Drag task between columns updates status via API
- [ ] Reorder within column persists order
- [ ] WIP limits prevent overloading columns
- [ ] Optimistic updates with rollback on error
- [ ] Works on desktop (mouse) and mobile (touch)
- [ ] Keyboard accessible (Tab, Enter, Arrows, Escape)
- [ ] Screen reader announces drag state
- [ ] No layout shift during drag
- [ ] Smooth 60fps animations
- [ ] Works on ProjectDetailPage Kanban tab

---

## 📝 Future Enhancements

- [ ] Swimlanes (by assignee, priority, project)
- [ ] Custom column configuration per project
- [ ] Bulk actions (multi-select + move)
- [ ] Card aging indicators (time in column)
- [ ] Custom fields on cards
- [ ] Card covers/attachments preview
- [ ] Checklist progress on card
- [ ] Time tracking on cards