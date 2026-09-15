#!/bin/bash
# reorganize-my-work.sh — run from 01_frontend_code/src/modules/my-work/
set -euo pipefail

mkdir -p pages/{attendance,leave,approvals,tasks,bank_details,overview,requests,profile}
mkdir -p components/{attendance,leave,approvals,tasks,bank_details,overview,requests,profile}
mkdir -p hooks/{attendance,leave,approvals,tasks,bank_details,overview,requests,profile}

mv_page() {
  local src="$1" dest="$2"
  if [[ -f "pages/$src" ]]; then
    mkdir -p "pages/$(dirname "$dest")"
    git mv "pages/$src" "pages/$dest" 2>/dev/null || mv "pages/$src" "pages/$dest"
    echo "moved pages/$src → pages/$dest"
  fi
}

mv_page MyWorkOverviewPage.tsx overview/MyWorkOverviewPage.tsx
mv_page MyAttendancePage.tsx attendance/MyAttendancePage.tsx
mv_page MarkAttendancePage.tsx attendance/MarkAttendancePage.tsx
mv_page AttendanceCorrectionsPage.tsx attendance/AttendanceCorrectionsPage.tsx
mv_page AttendanceDetailPage.tsx attendance/AttendanceDetailPage.tsx
mv_page TakeABreakPage.tsx attendance/TakeABreakPage.tsx
mv_page MyLeavePage.tsx leave/MyLeavePage.tsx
mv_page ApplyLeavePage.tsx leave/ApplyLeavePage.tsx
mv_page LeaveDetailPage.tsx leave/LeaveDetailPage.tsx
mv_page MyApprovalsPage.tsx approvals/MyApprovalsPage.tsx
mv_page MyApprovalDetailPage.tsx approvals/MyApprovalDetailPage.tsx
mv_page MyTasksPage.tsx tasks/MyTasksPage.tsx
mv_page MyTaskCreatePage.tsx tasks/MyTaskCreatePage.tsx
mv_page MyTaskDetailPage.tsx tasks/MyTaskDetailPage.tsx
mv_page MyBankDetailsPage.tsx bank_details/MyBankDetailsPage.tsx
mv_page MyRequestsPage.tsx requests/MyRequestsPage.tsx

if [[ -f components/BreakStatusCard.tsx ]]; then
  git mv components/BreakStatusCard.tsx components/attendance/BreakStatusCard.tsx 2>/dev/null \
    || mv components/BreakStatusCard.tsx components/attendance/BreakStatusCard.tsx
fi

echo "My-work moves done. Fix relative imports (../ → ../../) and update routes.tsx."
