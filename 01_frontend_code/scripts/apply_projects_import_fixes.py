#!/usr/bin/env python3
"""Run from repo root AFTER restructure-projects-module.sh.
Updates imports, merges list hooks, adds barrels/placeholders, splits types.
"""
from __future__ import annotations
from pathlib import Path

ROOT = Path("01_frontend_code/src/modules/projects")

def read(p: Path) -> str:
    return p.read_text(encoding="utf-8")

def write(p: Path, s: str) -> None:
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(s, encoding="utf-8")
    print("write", p)

def sub_many(text: str, pairs: list[tuple[str, str]]) -> str:
    for a, b in pairs:
        text = text.replace(a, b)
    return text

DEPTH1 = [
    ("from '../api/projects'", "from '../../api/project'"),
    ('from "../api/projects"', 'from "../../api/project"'),
    ("from '../api/tasks'", "from '../../api/task'"),
    ("from '../api/teams'", "from '../../api/team'"),
    ("from '../api/documents'", "from '../../api/document'"),
    ("from '../schemas/project'", "from '../../schemas/project/project'"),
    ("from '../schemas/project-form'", "from '../../schemas/project/project-form'"),
    ("from '../schemas/project-detail-form'", "from '../../schemas/project/project-detail-form'"),
    ("from '../schemas/task'", "from '../../schemas/task/task'"),
    ("from '../schemas/task-form'", "from '../../schemas/task/task-form'"),
    ("from '../schemas/task-detail-form'", "from '../../schemas/task/task-detail-form'"),
    ("from '../schemas/team'", "from '../../schemas/team/team'"),
    ("from '../schemas/team-form'", "from '../../schemas/team/team-form'"),
    ("from '../schemas/team-detail-form'", "from '../../schemas/team/team-detail-form'"),
    ("from '../schemas/team-member-form'", "from '../../schemas/team/team-member-form'"),
    ("from '../schemas/document'", "from '../../schemas/document/document'"),
    ("from '../schemas/note'", "from '../../schemas/note/note'"),
    ("from '../schemas/note-form'", "from '../../schemas/note/note-form'"),
    ("from '../types'", "from '../../types'"),
    ("from '../enums'", "from '../../enums'"),
    ("from '../routes'", "from '../../routes'"),
    ("from '../cssTokens'", "from '../../cssTokens'"),
    ("from '../data/", "from '../../data/"),
    ("from '../hooks/use-projects-list'", "from '../../hooks/project/use-projects'"),
    ("from '../hooks/use-projects'", "from '../../hooks/project/use-projects'"),
    ("from '../hooks/use-project-detail'", "from '../../hooks/project/use-project-detail'"),
    ("from '../hooks/use-project-create'", "from '../../hooks/project/use-project-create'"),
    ("from '../hooks/use-tasks-list'", "from '../../hooks/task/use-tasks'"),
    ("from '../hooks/use-tasks'", "from '../../hooks/task/use-tasks'"),
    ("from '../hooks/use-task-detail'", "from '../../hooks/task/use-task-detail'"),
    ("from '../hooks/use-task-create'", "from '../../hooks/task/use-task-create'"),
    ("from '../hooks/use-teams-list'", "from '../../hooks/team/use-teams'"),
    ("from '../hooks/use-teams'", "from '../../hooks/team/use-teams'"),
    ("from '../hooks/use-team-detail'", "from '../../hooks/team/use-team-detail'"),
    ("from '../hooks/use-documents'", "from '../../hooks/document/use-documents'"),
    ("from '../components/ProjectStatusBadge'", "from '../../components/project/ProjectStatusBadge'"),
    ("from '../components/ProjectDetailOverview'", "from '../../components/project/ProjectDetailOverview'"),
    ("from '../components/project-detail-helpers'", "from '../../components/project/project-detail-helpers'"),
    ("from '../components/ProjectDetailTabNav'", "from '../../components/project/ProjectDetailTabNav'"),
    ("from '../components/ProjectDetailTasksTab'", "from '../../components/project/ProjectDetailTasksTab'"),
    ("from '../components/ProjectDetailDocumentsTab'", "from '../../components/project/ProjectDetailDocumentsTab'"),
    ("from '../components/ProjectQuickContent'", "from '../../components/project/ProjectQuickContent'"),
    ("from '../components/ProjectTeamTab'", "from '../../components/project/ProjectTeamTab'"),
    ("from '../components/TaskStatusBadge'", "from '../../components/task/TaskStatusBadge'"),
    ("from '../components/TaskDetailSidebar'", "from '../../components/task/TaskDetailSidebar'"),
    ("from '../components/TaskQuickContent'", "from '../../components/task/TaskQuickContent'"),
    ("from '../components/CreateTaskModal'", "from '../../components/task/CreateTaskModal'"),
    ("from '../components/CreateTeamModal'", "from '../../components/team/CreateTeamModal'"),
    ("from '../components/DocumentQuickContent'", "from '../../components/DocumentQuickContent'"),
    ("from '../components/NotesPanel'", "from '../../components/NotesPanel'"),
]

DOMAIN_GLOBS = [
    "hooks/project/*.ts",
    "hooks/task/*.ts",
    "hooks/team/*.ts",
    "hooks/document/*.ts",
    "pages/project/*.tsx",
    "pages/task/*.tsx",
    "pages/team/*.tsx",
    "pages/document/*.tsx",
    "pages/note/*.tsx",
    "components/project/*",
    "components/task/*",
    "components/team/*",
]

for pattern in DOMAIN_GLOBS:
    for p in ROOT.glob(pattern):
        if not p.is_file():
            continue
        text = read(p)
        new = sub_many(text, DEPTH1)
        if p.parent.name == "project" and p.parent.parent.name == "components":
            new = new.replace(
                "from '../../components/project/project-detail-helpers'",
                "from './project-detail-helpers'",
            )
            new = new.replace(
                "from '../components/project-detail-helpers'",
                "from './project-detail-helpers'",
            )
        if new != text:
            write(p, new)

for api_name in ("project.ts", "task.ts", "team.ts", "document.ts"):
    p = ROOT / "api" / api_name
    if not p.exists():
        continue
    text = read(p)
    new = text
    new = new.replace("from '../schemas/project'", "from '../schemas/project/project'")
    new = new.replace("from '../schemas/task'", "from '../schemas/task/task'")
    new = new.replace("from '../schemas/team'", "from '../schemas/team/team'")
    new = new.replace("from '../schemas/document'", "from '../schemas/document/document'")
    if new != text:
        write(p, new)

def merge_list(into: Path, list_path: Path, marker: str) -> None:
    if not into.exists() or not list_path.exists():
        print("skip merge", into, list_path)
        return
    main = read(into)
    lst = sub_many(read(list_path), DEPTH1)
    if marker not in main:
        main = main.rstrip() + "\n\n// --- list controls (merged from *-list) ---\n" + lst
        write(into, main)
    list_path.unlink()
    print("merged+deleted", list_path)

merge_list(ROOT / "hooks/project/use-projects.ts", ROOT / "hooks/project/use-projects-list.ts", "useProjectsList")
merge_list(ROOT / "hooks/task/use-tasks.ts", ROOT / "hooks/task/use-tasks-list.ts", "useTasksList")
merge_list(ROOT / "hooks/team/use-teams.ts", ROOT / "hooks/team/use-teams-list.ts", "useTeamsList")

if (ROOT / "hooks/team/use-teams.ts").exists():
    write(
        ROOT / "hooks/team/use-team-create.ts",
        "/** Create-team page hook \u2014 wraps useCreateTeam from use-teams. */\n"
        "export { useCreateTeam as useTeamCreate } from './use-teams'\n",
    )

write(
    ROOT / "api/note.ts",
    "/** Notes API \u2014 backend not ready. Placeholder only. */\n"
    "// TODO: wire to Notes public service when available\n"
    "export async function listNotes(_params?: { referenceType?: string; referenceId?: number }) {\n"
    "  return { items: [] as Array<{ id: string; body: string; author: string; createdAt: string }>, total: 0 }\n"
    "}\n"
    "export async function createNote(_input: { body: string; referenceType: string; referenceId: number }) {\n"
    "  throw new Error('Notes API not implemented yet')\n"
    "}\n",
)

write(
    ROOT / "hooks/note/use-notes.ts",
    "/** Notes hooks \u2014 backend not ready. Placeholder only. */\n"
    "import { useQuery } from '@tanstack/react-query'\n"
    "import { listNotes } from '../../api/note'\n\n"
    "export function useNotes(params?: { referenceType?: string; referenceId?: number }) {\n"
    "  return useQuery({\n"
    "    queryKey: ['projects', 'notes', params ?? {}],\n"
    "    queryFn: () => listNotes(params),\n"
    "    enabled: false, // TODO: enable when Notes API is ready\n"
    "  })\n"
    "}\n",
)

write(
    ROOT / "api/index.ts",
    "export * from './project'\n"
    "export * from './task'\n"
    "export * from './team'\n"
    "export * from './document'\n"
    "export * from './note'\n",
)

write(
    ROOT / "hooks/index.ts",
    "export * from './project/use-projects'\n"
    "export * from './project/use-project-detail'\n"
    "export * from './project/use-project-create'\n"
    "export * from './task/use-tasks'\n"
    "export * from './task/use-task-detail'\n"
    "export * from './task/use-task-create'\n"
    "export * from './team/use-teams'\n"
    "export * from './team/use-team-detail'\n"
    "export * from './team/use-team-create'\n"
    "export * from './document/use-documents'\n"
    "export * from './note/use-notes'\n",
)

types_src = ROOT / "types.ts"
if types_src.exists():
    content = read(types_src)
    content = content.replace("from './schemas/", "from '../schemas/")
    content = content.replace("from './enums'", "from '../enums'")
    content = content.replace("from './data/", "from '../data/")
    write(ROOT / "types/index.ts", content)
    write(
        ROOT / "types/project.ts",
        "export type {\n"
        "  ProjectStatus,\n  ProjectListItem,\n  ProjectDetail,\n  CreateProjectInput,\n"
        "  ProjectFormInput,\n  ProjectListParams,\n  ProjectListCache,\n  ProjectListMetrics,\n"
        "  ProjectQuickContentProps,\n  ProjectDocument,\n  ProjectNote,\n"
        "  ProjectTaskListItem,\n  ProjectTeamListItem,\n  AssignMode,\n  PhaseValue,\n  PriorityValue,\n"
        "} from './index'\n",
    )
    write(
        ROOT / "types/task.ts",
        "export type {\n"
        "  Task,\n  TaskPriority,\n  TaskStatus,\n  TaskListCache,\n  CreateTaskInput,\n"
        "  TaskRow,\n  CreateTaskModalProps,\n  CreateTaskFormValues,\n"
        "} from './index'\n",
    )
    write(
        ROOT / "types/team.ts",
        "export type {\n"
        "  Team,\n  TeamStatus,\n  TeamListCache,\n  CreateTeamInput,\n"
        "  TeamMemberFormValues,\n  TeamMemberRole,\n  TeamMemberRow,\n  TeamProjectRow,\n"
        "  TeamCandidate,\n  TeamRow,\n  EmployeeLike,\n  CreateTeamModalProps,\n"
        "  CreateTeamFormValues,\n  FormValues,\n"
        "} from './index'\n",
    )
    write(ROOT / "types/document.ts", "export type { ProjectDocument } from './index'\n")
    write(ROOT / "types/note.ts", "export type { ProjectNote } from './index'\n")
    types_src.unlink()
    print("split types.ts -> types/")

routes = ROOT / "routes.tsx"
if routes.exists():
    t = read(routes)
    for a, b in [
        ("./pages/ProjectsListPage", "./pages/project/ProjectsListPage"),
        ("./pages/ProjectDetailPage", "./pages/project/ProjectDetailPage"),
        ("./pages/ProjectCreatePage", "./pages/project/ProjectCreatePage"),
        ("./pages/TasksListPage", "./pages/task/TasksListPage"),
        ("./pages/TaskCreatePage", "./pages/task/TaskCreatePage"),
        ("./pages/TaskDetailPage", "./pages/task/TaskDetailPage"),
        ("./pages/DocumentsPage", "./pages/document/DocumentsPage"),
        ("./pages/ProjectNotesPage", "./pages/note/ProjectNotesPage"),
    ]:
        t = t.replace(a, b)
    write(routes, t)

idx = ROOT / "index.ts"
if idx.exists():
    t = read(idx)
    reps = [
        ("./pages/ProjectsListPage", "./pages/project/ProjectsListPage"),
        ("./pages/ProjectDetailPage", "./pages/project/ProjectDetailPage"),
        ("./pages/ProjectCreatePage", "./pages/project/ProjectCreatePage"),
        ("./pages/TeamCreatePage", "./pages/team/TeamCreatePage"),
        ("./pages/TasksListPage", "./pages/task/TasksListPage"),
        ("./pages/TaskCreatePage", "./pages/task/TaskCreatePage"),
        ("./pages/TaskDetailPage", "./pages/task/TaskDetailPage"),
        ("./pages/DocumentsPage", "./pages/document/DocumentsPage"),
        ("./api/projects'", "./api/project'"),
        ("./hooks/use-projects'", "./hooks/project/use-projects'"),
        ("./hooks/use-projects-list'", "./hooks/project/use-projects'"),
        ("./hooks/use-tasks'", "./hooks/task/use-tasks'"),
        ("./hooks/use-tasks-list'", "./hooks/task/use-tasks'"),
        ("./hooks/use-teams'", "./hooks/team/use-teams'"),
        ("./hooks/use-teams-list'", "./hooks/team/use-teams'"),
        ("./hooks/use-project-detail'", "./hooks/project/use-project-detail'"),
        ("./hooks/use-task-detail'", "./hooks/task/use-task-detail'"),
        ("./hooks/use-team-detail'", "./hooks/team/use-team-detail'"),
        ("./hooks/use-documents'", "./hooks/document/use-documents'"),
        ("./components/CreateTaskModal'", "./components/task/CreateTaskModal'"),
        ("./components/CreateTeamModal'", "./components/team/CreateTeamModal'"),
        ("./components/ProjectTeamTab'", "./components/project/ProjectTeamTab'"),
    ]
    for a, b in reps:
        t = t.replace(a, b)
    write(idx, t)

print("DONE \u2014 run: cd 01_frontend_code && npm run lint && npm run typecheck")
