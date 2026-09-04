# TODO #6: Keyboard Shortcuts System

**Priority:** MEDIUM | **Effort:** Medium (2-3 weeks) | **Impact:** Power user productivity, accessibility

---

## 🎯 Objective
Implement a global keyboard shortcut system with context-aware shortcuts, help dialog, and customization.

---

## 📍 Current State

### Current Keyboard Support
| Feature | Status |
|---------|--------|
| **Form navigation** | Tab/Shift+Tab, Enter to submit |
| **Modal close** | Escape |
| **Dropdown** | Arrow keys, Enter |
| **Table navigation** | None |
| **Global shortcuts** | None |
| **Help dialog** | None |

---

## 📂 Where to Implement

### 1. Core Shortcut System
```
src/shared/hooks/
├── useKeyboardShortcuts.ts    # Global shortcut registry
├── useHotkeys.ts              # React-hotkeys-hook wrapper
└── useKeyCombination.ts       # Key combination parser
```

### 2. Components
```
src/shared/components/keyboard/
├── ShortcutsHelpDialog.tsx    # Cmd+K / ? help dialog
├── ShortcutIndicator.tsx      # Inline shortcut hints
├── KeyboardShortcutsProvider.tsx # Context provider
└── KeyboardShortcutsEditor.tsx # Settings panel
```

### 3. Module Integration
```
src/modules/*/hooks/
├── useProjectShortcuts.ts
├── useTaskShortcuts.ts
├── useApprovalShortcuts.ts
├── useSalesShortcuts.ts
└── useWorkforceShortcuts.ts
```

---

## 🔧 What Should Be Done

### 1. Core Shortcut System
```typescript
// src/shared/hooks/useKeyboardShortcuts.ts
interface Shortcut {
  key: string;                    // 'cmd+k', 'ctrl+s', 'alt+n'
  description: string;            // 'Open command palette'
  action: () => void | Promise<void>;
  context?: string;               // 'global' | 'project' | 'task' | 'modal'
  preventDefault?: boolean;       // Default: true
  enabled?: boolean | (() => boolean);
  tags?: string[];                // ['navigation', 'editing', 'global']
}

interface ShortcutGroup {
  name: string;
  shortcuts: Shortcut[];
}

export function useKeyboardShortcuts() {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [groups, setGroups] = useState<ShortcutGroup[]>([]);
  
  const register = useCallback((shortcut: Shortcut) => {
    setShortcuts(prev => [...prev.filter(s => s.key !== shortcut.key), shortcut]);
  }, []);
  
  const unregister = useCallback((key: string) => {
    setShortcuts(prev => prev.filter(s => s.key !== key));
  }, []);
  
  const registerGroup = useCallback((group: ShortcutGroup) => {
    setGroups(prev => [...prev.filter(g => g.name !== group.name), group]);
  }, []);
  
  // Auto-cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup handled by useHotkeys
    };
  }, []);
  
  return { shortcuts, groups, register, unregister, registerGroup };
}
```

### 2. useHotkeys Wrapper (using react-hotkeys-hook)
```typescript
// src/shared/hooks/useHotkeys.ts
import { useHotkeys } from 'react-hotkeys-hook';

interface HotkeyOptions extends Omit<Shortcut, 'key'> {
  key: string;
  dependencies?: React.DependencyList;
}

export function useHotkey(
  key: string,
  callback: () => void,
  options: Omit<HotkeyOptions, 'key' | 'action'> = {}
) {
  const { description, context = 'global', enabled = true, preventDefault = true, tags = [] } = options;
  
  useHotkeys(key, callback, {
    enabled,
    preventDefault,
    keydown: true,
    keyup: false,
    filter: () => enabled,
    // Only trigger if no input focused (unless explicitly allowed)
    filter: (e) => enabled && (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA' && !e.target.isContentEditable),
  });
  
  // Auto-register in global registry
  const { register } = useKeyboardShortcuts();
  useEffect(() => {
    register({ key, description, context, tags: ['global', ...tags] });
    return () => unregister(key);
  }, [key, description, context, tags]);
}

// Convenience hooks
export function useGlobalHotkey(key: string, callback: () => void, description: string) {
  return useHotkey(key, callback, { context: 'global', description });
}

export function useContextHotkey(context: string, key: string, callback: () => void, description: string) {
  return useHotkey(key, callback, { context, description });
}
```

### 3. Keyboard Shortcuts Provider
```tsx
// src/shared/components/keyboard/KeyboardShortcutsProvider.tsx
interface KeyboardShortcutsProviderProps {
  children: React.ReactNode;
  enableGlobal?: boolean;
}

export function KeyboardShortcutsProvider({ children, enableGlobal = true }: KeyboardShortcutsProviderProps) {
  const { shortcuts, groups, register } = useKeyboardShortcuts();
  const [showHelp, setShowHelp] = useState(false);
  
  // Global shortcuts
  useGlobalHotkey('cmd+k', () => setShowHelp(true), 'Open command palette');
  useGlobalHotkey('?', () => setShowHelp(true), 'Show keyboard shortcuts');
  useGlobalHotkey('escape', () => setShowHelp(false), 'Close dialogs/panels');
  
  return (
    <KeyboardShortcutsContext.Provider value={{ shortcuts, groups, register, showHelp, setShowHelp }}>
      {children}
      {showHelp && <ShortcutsHelpDialog onClose={() => setShowHelp(false)} />}
    </KeyboardShortcutsContext.Provider>
  );
}
```

### 4. Help Dialog
```tsx
// src/shared/components/keyboard/ShortcutsHelpDialog.tsx
export function ShortcutsHelpDialog({ onClose }: { onClose: () => void }) {
  const { groups } = useKeyboardShortcuts();
  
  return (
    <Modal open onClose={onClose} title="Keyboard Shortcuts" widthClass="max-w-2xl">
      <div className="space-y-6">
        {groups.map(group => (
          <section key={group.name} className="space-y-3">
            <h3 className="text-label-md font-semibold text-on-surface-variant uppercase tracking-wider">
              {group.name}
            </h3>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
              {group.shortcuts.map(shortcut => (
                <>
                  <dt key={shortcut.key} className="text-body-sm text-on-surface-variant">
                    <kbd className={cn(
                      'inline-flex items-center justify-center px-2 py-1 rounded bg-surface-container',
                      'border border-outline-variant text-label-sm font-mono font-medium'
                    )}>
                      {formatKey(shortcut.key)}
                    </kbd>
                  </dt>
                  <dd className="text-body-sm text-on-surface">{shortcut.description}</dd>
                </>
              ))}
            </dl>
          </section>
        ))}
        
        <div className="pt-4 border-t border-outline-variant">
          <p className="text-body-sm text-on-surface-variant">
            Press <kbd className="px-1.5 py-0.5 rounded bg-surface-container border border-outline-variant">?</kbd> 
            or <kbd className="px-1.5 py-0.5 rounded bg-surface-container border border-outline-variant">Cmd+K</kbd> to close
          </p>
        </div>
      </div>
    </Modal>
  );
}

function formatKey(key: string): string {
  return key
    .split('+')
    .map(k => k === 'cmd' ? '⌘' : k === 'ctrl' ? 'Ctrl' : k === 'shift' ? '⇧' : k === 'alt' ? '⌥' : k.toUpperCase())
    .join(' + ');
}
```

---

## 📂 Module-Specific Shortcuts

### Project Module Shortcuts
```typescript
// src/modules/projects/hooks/use-project-shortcuts.ts
export function useProjectShortcuts(projectId?: number) {
  const navigate = useNavigate();
  const { selectedTask, setSelectedTask } = useTaskSelection();
  
  useContextHotkey('project', 'n', () => {
    safeNavigate(navigate, { to: projectRoutes.taskNew, search: { projectId: String(projectId) } });
  }, 'Create new task');
  
  useContextHotkey('project', 'cmd+n', () => {
    safeNavigate(navigate, { to: projectRoutes.projectNew });
  }, 'Create new project');
  
  useContextHotkey('project', 'cmd+f', () => {
    document.querySelector('[data-search-input]')?.focus();
  }, 'Focus search');
  
  useContextHotkey('project', 'arrowdown', () => {
    selectNextTask();
  }, 'Select next task');
  
  useContextHotkey('project', 'arrowup', () => {
    selectPrevTask();
  }, 'Select previous task');
  
  useContextHotkey('project', 'enter', () => {
    if (selectedTask) openTaskDetail(selectedTask);
  }, 'Open selected task');
  
  useContextHotkey('project', 'delete', () => {
    if (selectedTask) deleteTask(selectedTask.id);
  }, 'Delete selected task');
  
  useContextHotkey('project', 'cmd+s', () => {
    saveCurrentTask();
  }, 'Save current task');
}
```

### Task Detail Shortcuts
```typescript
// src/modules/projects/hooks/use-task-detail-shortcuts.ts
export function useTaskDetailShortcuts(taskId: number) {
  const { isEditing, form, save, cancelEdit } = useTaskDetail(taskId);
  
  useContextHotkey('task-detail', 'cmd+s', () => {
    if (isEditing) save();
  }, 'Save task');
  
  useContextHotkey('task-detail', 'escape', () => {
    if (isEditing) cancelEdit();
    else closeDetail();
  }, 'Close/Cancel');
  
  useContextHotkey('task-detail', 'cmd+enter', () => {
    if (isEditing) save();
  }, 'Save and close');
  
  useContextHotkey('task-detail', 'tab', () => {
    focusNextField();
  }, 'Next field');
  
  useContextHotkey('task-detail', 'shift+tab', () => {
    focusPrevField();
  }, 'Previous field');
}
```

---

## 📋 Module Shortcut Maps

### Global Shortcuts
| Shortcut | Action | Context |
|----------|--------|---------|
| `Cmd+K` | Open command palette | Global |
| `?` | Show keyboard shortcuts | Global |
| `Escape` | Close dialog/modal/panel | Global |
| `Cmd+/` | Focus global search | Global |
| `Cmd+Shift+K` | Open keyboard shortcuts editor | Global |

### Navigation
| Shortcut | Action | Context |
|----------|--------|---------|
| `G` then `D` | Go to Dashboard | Global |
| `G` then `P` | Go to Projects | Global |
| `G` then `S` | Go to Sales | Global |
| `G` then `W` | Go to Workforce | Global |
| `G` then `A` | Go to Admin | Global |
| `G` then `M` | Go to My Work | Global |
| `G` then `N` | Go to Notifications | Global |

### Project Module
| Shortcut | Action | Context |
|----------|--------|---------|
| `N` | New task | Project list |
| `Cmd+N` | New project | Project list |
| `Cmd+F` | Focus search | Project list |
| `↑/↓` | Navigate tasks | Project list |
| `Enter` | Open task detail | Project list |
| `Delete` | Delete task | Project list |
| `S` | Toggle task status | Task list |
| `Cmd+S` | Save task | Task detail |
| `Escape` | Close/Cancel | Task detail |
| `Tab` / `Shift+Tab` | Next/Prev field | Task detail |

### Approvals
| Shortcut | Action | Context |
|----------|--------|---------|
| `A` | Approve selected | Approval list |
| `R` | Reject selected | Approval list |
| `V` | View detail | Approval list |
| `Cmd+Enter` | Submit decision | Approval detail |

### Sales
| Shortcut | Action | Context |
|----------|--------|---------|
| `N` | New lead | Leads list |
| `Cmd+N` | New client | Clients list |
| `Enter` | Open lead detail | Leads list |

### Workforce
| Shortcut | Action | Context |
|----------|--------|---------|
| `N` | New employee | Employees list |
| `Enter` | Open employee detail | Employees list |
| `Cmd+F` | Focus search | Employees list |

---

## 📋 Implementation Checklist

### Core System
- [ ] `useKeyboardShortcuts` registry
- [ ] `useHotkeys` wrapper with react-hotkeys-hook
- [ ] `KeyboardShortcutsProvider` context
- [ ] `ShortcutsHelpDialog` (Cmd+K / ?)
- [ ] `ShortcutIndicator` component
- [ ] `KeyboardShortcutsEditor` settings panel

### Module Integration
- [ ] Global shortcuts (navigation, palette, help)
- [ ] Project module shortcuts
- [ ] Task detail shortcuts
- [ ] Approvals shortcuts
- [ ] Sales shortcuts
- [ ] Workforce shortcuts
- [ ] Profile shortcuts
- [ ] Admin shortcuts

### UI/UX
- [ ] `ShortcutsHelpDialog` (Cmd+K / ?)
- [ ] `ShortcutIndicator` inline hints
- [ ] `KeyboardShortcutsEditor` settings
- [ ] Visual feedback on shortcut press
- [ ] Conflict detection (warn on duplicates)
- [ ] Customizable shortcuts (user preferences)

### Accessibility
- [ ] Screen reader announcements for shortcuts
- [ ] High contrast mode for shortcut indicators
- [ ] Focus management during shortcuts
- [ ] Respect `prefers-reduced-motion`

### Testing
- [ ] All shortcuts trigger correct actions
- [ ] No conflicts between contexts
- [ ] Shortcuts disabled in inputs (unless allowed)
- [ ] Shortcuts work in modals/panels
- [ ] Help dialog shows correct shortcuts for context

---

## 📋 Acceptance Criteria

- [ ] `Cmd+K` opens help dialog anywhere
- [ ] `?` shows shortcuts for current context
- [ ] `Escape` closes any open modal/panel
- [ ] Module-specific shortcuts work in context
- [ ] No conflicts between global and context shortcuts
- [ ] Shortcuts disabled in text inputs (unless explicit)
- [ ] Help dialog shows all shortcuts grouped by category
- [ ] Users can customize shortcuts in settings
- [ ] Shortcuts persisted to localStorage/user profile
- [ ] Works across all modules consistently

---

## 📝 Future Enhancements

- [ ] **Command Palette** (Cmd+K) - full fuzzy search + actions
- [ ] **Vim mode** - optional vim keybindings
- [ ] **Macro recording** - record action sequences
- [ ] **Shortcut conflicts** - visual conflict resolver
- [ ] **Team shortcuts** - shared shortcuts per team
- [ ] **Macro recording** - record/replay action sequences
- [ ] **Voice commands** - speech-to-action
- [ ] **Gamepad support** - for dashboard navigation