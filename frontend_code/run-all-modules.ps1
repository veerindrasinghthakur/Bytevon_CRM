# ====================================================================
# OPENCODE OVERNIGHT AUTOMATION SCRIPT WITH NTFY ALERTS
# ====================================================================
$ErrorActionPreference = "Stop"

# 1. Base Paths Configuration
$BaseDocPath = "Z:\bytevon extra\Bytevon_frontend\bytevon_documentation\frontend_code"
$ModulesRoot = "Z:\bytevon extra\Bytevon_frontend\bytevon_documentation\frontend_code\src\modules"

# 2. Target Sibling Modules (Mapped exactly to your directory list)
$Modules = @(
    "admin", 
    "approvals", 
    "auth", 
    "dashboard", 
    "my-work", 
    "notifications", 
    "payroll", 
    "profile", 
    "projects", 
    "sales", 
    "workforce"
)

# 3. ntfy Notification Helper Function
function Send-NtfyNotification {
    param (
        [string]$Message,
        [string]$Title = "OpenCode Automation",
        [string]$Priority = "3", # 3 = Default, 4 = High, 5 = Max
        [string]$Tags = "gear"
    )
    $Uri = "https://ntfy.sh"
    $Headers = @{
        "Title"    = $Title
        "Priority" = $Priority
        "Tags"     = $Tags
    }
    try {
        Invoke-RestMethod -Uri $Uri -Method Post -Body $Message -Headers $Headers -ContentType "text/plain; charset=utf-8" -ErrorAction SilentlyContinue
    } catch {
        Write-Host "[ntfy Error] Failed to dispatch remote alert." -ForegroundColor DarkGray
    }
}

# 4. Explicit Prompt Definitions
$AnalysisPrompt = @"
Perform a static codebase analysis on this specific module folder. Do not write any code yet. 
Generate a markdown file named 'MODULE_VERIFICATION_REPORT.md' in the root of this module folder. 
The report must follow this exact template structure:
# Module Verification Report: [Module Name]
## 1. Action Required Summary
### Pages Needing Refactoring
- [List files, extract logic to custom hooks, replace inline strings with global ROUTES, replace hardcoded hex colors with CSS variables, find manual useState forms]
### Hooks Needing Refactoring
- [List files, find hardcoded query keys, find local compute logic to replace with API fields, find direct navigate() to replace with safeNavigate()]
## 2. Orphan Files Identified
- [List unused/unimported components or dead pages]
## 3. Form & Type Violations
- [List files using manual useState instead of React Hook Form + Zod, and flag any instances of 'any' type]
"@

$FixPrompt = @"
Read the 'MODULE_VERIFICATION_REPORT.md' file located in your current folder. 
Systematically fix every single non-compliance item, type violation, component extraction, and hardcoded value noted in Sections 1, 2, and 3. 
Ensure code compiles cleanly, use React Hook Form + Zod for forms, and use proper TypeScript types instead of 'any'.
"@

Write-Host "=== STARTING OVERNIGHT BATCH PROCESSING ===" -ForegroundColor Green
Send-NtfyNotification -Title "OpenCode Run Started" -Message "Overnight batch execution has begun for modules: $($Modules -join ', ')." -Priority "4" -Tags "clapper"

# 5. Processing Loop
try {
    foreach ($Mod in $Modules) {
        $ModPath = Join-Path $ModulesRoot $Mod
        
        if (Test-Path $ModPath) {
            Write-Host "`n--------------------------------------------------" -ForegroundColor Cyan
            Write-Host "PROCESSING MODULE: [$Mod]" -ForegroundColor Cyan
            Write-Host "Path: $ModPath" -ForegroundColor Gray
            Write-Host "--------------------------------------------------" -ForegroundColor Cyan
            
            Send-NtfyNotification -Title "Module Progress" -Message "Analyzing and patching module: [$Mod]..." -Priority "3" -Tags "hourglass_flowing_sand"
            
            # Change directory to the target module folder
            Set-Location $ModPath
            
            # --- PHASE 1: ANALYSIS ---
            Write-Host "[Phase 1/2] Running Codebase Compliance Analysis..." -ForegroundColor Yellow
            & opencode run --agent build $AnalysisPrompt
            
            # Verify the report was written
            $ReportFile = Join-Path $ModPath "MODULE_VERIFICATION_REPORT.md"
            if (Test-Path $ReportFile) {
                Write-Host "[Success] Report generated successfully." -ForegroundColor Green
            } else {
                Write-Host "[Warning] Report was not written by the agent." -ForegroundColor Red
            }
            
            # --- PHASE 2: AUTOMATED FIXES ---
            Write-Host "[Phase 2/2] Executing automated refactoring from report..." -ForegroundColor Yellow
            & opencode run --agent build $FixPrompt
            
            # --- PHASE 3: ISOLATE CHANGES ---
            Write-Host "[Checkpoint] Staging and committing changes for $Mod..." -ForegroundColor Gray
            & git add .
            & git commit -m "auto(opencode): completed analysis and fixes for module-$Mod"
            
            Send-NtfyNotification -Title "Module Success" -Message "Successfully completed and committed changes for [$Mod]!" -Priority "3" -Tags "white_check_mark"
            
        } else {
            Write-Host "[Skip] Module folder '$Mod' not found at $ModPath" -ForegroundColor Red
            Send-NtfyNotification -Title "Module Skipped" -Message "Folder path for module [$Mod] was missing." -Priority "2" -Tags "warning"
        }
    }

    # Return to original documentation path
    Set-Location $BaseDocPath
    Write-Host "`n=== ALL MODULES COMPLETED SUCCESSFULLY ===" -ForegroundColor Green
    Send-NtfyNotification -Title "Overnight Run Complete" -Message "All specified frontend modules have been successfully analysed and refactored!" -Priority "5" -Tags "tada,party_popper"

} catch {
    Write-Host "`n[FATAL ERROR] Script execution halted." -ForegroundColor Red
    Write-Error $_
    Send-NtfyNotification -Title "Script Crashed!" -Message "The overnight run stopped unexpectedly: $($_.Exception.Message)" -Priority "5" -Tags "x,rotating_light"
}
