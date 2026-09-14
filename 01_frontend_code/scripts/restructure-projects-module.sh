#!/usr/bin/env bash
# Run from repo root on a clean working tree. Uses git mv to preserve history.
set -euo pipefail
ROOT="01_frontend_code/src/modules/projects"
cd "$(git rev-parse --show-toplevel)"

mkdir -p \
  "$ROOT/api" \
  "$ROOT/hooks/project" "$ROOT/hooks/task" "$ROOT/hooks/team" "$ROOT/hooks/document" "$ROOT/hooks/note" \
  "$ROOT/pages/project" "$ROOT/pages/task" "$ROOT/pages/team" "$ROOT/pages/document" "$ROOT/pages/note" \
  "$ROOT/components/project" "$ROOT/components/task" "$ROOT/components/team" \
  "$ROOT/schemas/project" "$ROOT/schemas/task" "$ROOT/schemas/team" "$ROOT/schemas/document" "$ROOT/schemas/note" \
  "$ROOT/types"

# --- API renames ---
git mv "$ROOT/api/projects.ts" "$ROOT/api/project.ts"
git mv "$ROOT/api/tasks.ts" "$ROOT/api/task.ts"
git mv "$ROOT/api/teams.ts" "$ROOT/api/team.ts"
git mv "$ROOT/api/documents.ts" "$ROOT/api/document.ts"

# --- Hooks domain folders ---
git mv "$ROOT/hooks/use-project-detail.ts" "$ROOT/hooks/project/use-project-detail.ts"
git mv "$ROOT/hooks/use-project-create.ts" "$ROOT/hooks/project/use-project-create.ts"
git mv "$ROOT/hooks/use-projects.ts" "$ROOT/hooks/project/use-projects.ts"
git mv "$ROOT/hooks/use-projects-list.ts" "$ROOT/hooks/project/use-projects-list.ts"

git mv "$ROOT/hooks/use-task-detail.ts" "$ROOT/hooks/task/use-task-detail.ts"
git mv "$ROOT/hooks/use-task-create.ts" "$ROOT/hooks/task/use-task-create.ts"
git mv "$ROOT/hooks/use-tasks.ts" "$ROOT/hooks/task/use-tasks.ts"
git mv "$ROOT/hooks/use-tasks-list.ts" "$ROOT/hooks/task/use-tasks-list.ts"

git mv "$ROOT/hooks/use-team-detail.ts" "$ROOT/hooks/team/use-team-detail.ts"
git mv "$ROOT/hooks/use-teams.ts" "$ROOT/hooks/team/use-teams.ts"
git mv "$ROOT/hooks/use-teams-list.ts" "$ROOT/hooks/team/use-teams-list.ts"

git mv "$ROOT/hooks/use-documents.ts" "$ROOT/hooks/document/use-documents.ts"

# --- Pages ---
git mv "$ROOT/pages/ProjectsListPage.tsx" "$ROOT/pages/project/ProjectsListPage.tsx"
git mv "$ROOT/pages/ProjectDetailPage.tsx" "$ROOT/pages/project/ProjectDetailPage.tsx"
git mv "$ROOT/pages/ProjectCreatePage.tsx" "$ROOT/pages/project/ProjectCreatePage.tsx"
git mv "$ROOT/pages/TasksListPage.tsx" "$ROOT/pages/task/TasksListPage.tsx"
git mv "$ROOT/pages/TaskCreatePage.tsx" "$ROOT/pages/task/TaskCreatePage.tsx"
git mv "$ROOT/pages/TaskDetailPage.tsx" "$ROOT/pages/task/TaskDetailPage.tsx"
git mv "$ROOT/pages/TeamsListPage.tsx" "$ROOT/pages/team/TeamsListPage.tsx"
git mv "$ROOT/pages/TeamCreatePage.tsx" "$ROOT/pages/team/TeamCreatePage.tsx"
git mv "$ROOT/pages/TeamDetailPage.tsx" "$ROOT/pages/team/TeamDetailPage.tsx"
git mv "$ROOT/pages/TeamMembersPage.tsx" "$ROOT/pages/team/TeamMembersPage.tsx"
git mv "$ROOT/pages/TeamAddMemberPage.tsx" "$ROOT/components/team/TeamAddMemberPage.tsx"
git mv "$ROOT/pages/DocumentsPage.tsx" "$ROOT/pages/document/DocumentsPage.tsx"
git mv "$ROOT/pages/ProjectNotesPage.tsx" "$ROOT/pages/note/ProjectNotesPage.tsx"

# --- Components ---
git mv "$ROOT/components/ProjectDetailOverview.tsx" "$ROOT/components/project/ProjectDetailOverview.tsx"
git mv "$ROOT/components/project-detail-helpers.tsx" "$ROOT/components/project/project-detail-helpers.tsx"
git mv "$ROOT/components/ProjectDetailDocumentsTab.tsx" "$ROOT/components/project/ProjectDetailDocumentsTab.tsx"
git mv "$ROOT/components/ProjectDetailTasksTab.tsx" "$ROOT/components/project/ProjectDetailTasksTab.tsx"
git mv "$ROOT/components/ProjectDetailTabNav.tsx" "$ROOT/components/project/ProjectDetailTabNav.tsx"
git mv "$ROOT/components/ProjectQuickContent.tsx" "$ROOT/components/project/ProjectQuickContent.tsx"
git mv "$ROOT/components/ProjectStatusBadge.tsx" "$ROOT/components/project/ProjectStatusBadge.tsx"
git mv "$ROOT/components/ProjectTeamTab.tsx" "$ROOT/components/project/ProjectTeamTab.tsx"
git mv "$ROOT/components/TaskDetailSidebar.tsx" "$ROOT/components/task/TaskDetailSidebar.tsx"
git mv "$ROOT/components/TaskQuickContent.tsx" "$ROOT/components/task/TaskQuickContent.tsx"
git mv "$ROOT/components/TaskStatusBadge.tsx" "$ROOT/components/task/TaskStatusBadge.tsx"
git mv "$ROOT/components/CreateTaskModal.tsx" "$ROOT/components/task/CreateTaskModal.tsx"
git mv "$ROOT/components/CreateTeamModal.tsx" "$ROOT/components/team/CreateTeamModal.tsx"
# DocumentQuickContent + NotesPanel stay flat under components/

# --- Schemas ---
git mv "$ROOT/schemas/project.ts" "$ROOT/schemas/project/project.ts"
git mv "$ROOT/schemas/project-form.ts" "$ROOT/schemas/project/project-form.ts"
git mv "$ROOT/schemas/project-detail-form.ts" "$ROOT/schemas/project/project-detail-form.ts"
git mv "$ROOT/schemas/task.ts" "$ROOT/schemas/task/task.ts"
git mv "$ROOT/schemas/task-form.ts" "$ROOT/schemas/task/task-form.ts"
git mv "$ROOT/schemas/task-detail-form.ts" "$ROOT/schemas/task/task-detail-form.ts"
git mv "$ROOT/schemas/team.ts" "$ROOT/schemas/team/team.ts"
git mv "$ROOT/schemas/team-form.ts" "$ROOT/schemas/team/team-form.ts"
git mv "$ROOT/schemas/team-detail-form.ts" "$ROOT/schemas/team/team-detail-form.ts"
git mv "$ROOT/schemas/team-member-form.ts" "$ROOT/schemas/team/team-member-form.ts"
git mv "$ROOT/schemas/document.ts" "$ROOT/schemas/document/document.ts"
git mv "$ROOT/schemas/note.ts" "$ROOT/schemas/note/note.ts"
git mv "$ROOT/schemas/note-form.ts" "$ROOT/schemas/note/note-form.ts"

echo "git mv complete."
echo "Next: python3 01_frontend_code/scripts/apply_projects_import_fixes.py"
echo "Then: git add -A && git commit -m 'refactor(projects): domain subfolders via git mv + import fixes'"
echo "Then: cd 01_frontend_code && npm run lint && npm run typecheck"
