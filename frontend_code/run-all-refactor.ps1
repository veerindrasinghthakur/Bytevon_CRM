# ====================================================================
# PHASE 2: STRICT AUTOMATED REFACTORING ENGINE (HOOKS, CSS & FORMS ONLY)
# ====================================================================
$ErrorActionPreference = "Stop"

# Force OpenCode engine runner to bypass strict TLS/SSL certificate barriers
$env:NODE_TLS_REJECT_UNAUTHORIZED = "0"

# 1. Base Paths Configuration
$BaseDocPath = "Z:\bytevon extra\Bytevon_frontend\bytevon_documentation"
$ModulesRoot = "Z:\bytevon extra\Bytevon_frontend\bytevon_documentation\frontend_code\src\modules"
$ReportOutputDir = "Z:\bytevon extra\Bytevon_frontend\bytevon_documentation\frontend_code\Optimization_Reports"
$GlobalErrorLogPath = "Z:\bytevon extra\Bytevon_frontend\bytevon_documentation\frontend_code\GLOBAL_REFACTOR_ERRORS.log"

# Initialize or reset the single unified global error log file before running
New-Item -ItemType File -Path $GlobalErrorLogPath -Force | Out-Null
$LogHeader = @"
====================================================================
GLOBAL REFACTOR WORKFLOW ERROR LOG
Execution Initiated: $(Get-Date)
Target Restrictions: Hooks, CSS, and Form Validations Only
====================================================================
"@
Set-Content -Path $GlobalErrorLogPath -Value $LogHeader

# 2. Target Sibling Modules List
$Modules = @(
    "admin", "approvals", "auth", "dashboard", "my-work", 
    "notifications", "payroll", "profile", "projects", "sales", "workforce"
)

# 3. Diagnostic Network Helper Function
function Test-SystemEnvironment {
    try {
        $PingTest = Test-Connection -ComputerName "8.8.8.8" -Count 1 -Quiet -ErrorAction SilentlyContinue
        if (-not $PingTest) { return "OFFLINE" }
    } catch {
        return "OFFLINE_EXCEPTION"
    }
    return "HEALTHY"
}

# 4. ntfy Notification Sender
function Send-NtfyNotification {
    param ([string]$Message, [string]$Title = "OpenCode Refactor", [string]$Priority = "3", [string]$Tags = "hammer")
    $Uri = "https://ntfy.sh"
    $Headers = @{ "Title" = $Title; "Priority" = $Priority; "Tags" = $Tags }
    try {
        Invoke-RestMethod -Uri $Uri -Method Post -Body $Message -Headers $Headers -ContentType "text/plain; charset=utf-8" -ErrorAction SilentlyContinue
    } catch {}
}

Write-Host "=== STARTING RESTRICTED REFACTORING ENGINE ===" -ForegroundColor Green
Send-NtfyNotification -Title "Strict Refactor Started" -Message "Applying changes strictly to Hooks, CSS, and Form Validations." -Priority "4" -Tags "play_button"

# 5. Core Refactoring Loop
try {
    foreach ($Mod in $Modules) {
        $ModPath = Join-Path $ModulesRoot $Mod
        $ReportPath = Join-Path $ReportOutputDir "${Mod}_OPTIMIZATION_REPORT.md"
        
        # Guard Clause: Verify both the module folder AND its specific report exist
        if (-not (Test-Path $ModPath)) {
            Write-Host "[Skip] Module folder missing for: $Mod" -ForegroundColor Yellow
            continue
        }
        if (-not (Test-Path $ReportPath)) {
            Write-Host "[Skip] Optimization blueprint file missing for: ${Mod}_OPTIMIZATION_REPORT.md" -ForegroundColor Yellow
            continue
        }
        
        Write-Host "`n--------------------------------------------------" -ForegroundColor Cyan
        Write-Host "REFACTORING MODULE: [$Mod]" -ForegroundColor Cyan
        Write-Host "Reading Blueprint: $ReportPath" -ForegroundColor Gray
        Write-Host "--------------------------------------------------" -ForegroundColor Cyan
        
        Send-NtfyNotification -Title "Module Scope Lock" -Message "Fixing hooks, CSS, and forms for module: [$Mod]..." -Priority "3" -Tags "lock"
        
        # Read the content of the local module markdown report directly into memory
        $ReportContent = Get-Content -Path $ReportPath -Raw
        
        # Navigate directly into the module folder to completely lock context window scope
        Set-Location $ModPath
        
        $RefactorPrompt = @"
CRITICAL BOUNDARY RULES:
1. You must ONLY fix items related to:
   - **Custom Hook Refactoring** (extracting logic to hooks, fixing hardcoded query keys, replacing navigate() with safeNavigate()).
   - **CSS/Style fixes** (replacing hardcoded hex colors, spacing, or inline sizes with global design tokens/CSS variables like var(--color-*)).
   - **Form Validation** (replacing manual useState inputs with React Hook Form + Zod schema configurations).
2. DO NOT perform any other optimizations or code cleanup mentioned in the file (like removing orphan files, component restructuring, or dead pages). We will handle those later.
3. DO NOT touch, open, or modify any files inside the global shared directories or components folder. All modifications must happen strictly to files located inside the current directory branch.
4. Do not commit your changes using git. Update the files directly on the local disk.

--- TARGET CONFIGURATION CHECKLIST FOR THIS RUN ---
$ReportContent
"@

        # 6. Fallback and API Resiliency Handler
        $MaxAttempts = 3
        $Attempt = 0
        $ExecutionSuccess = $false
        $LastCollectedError = ""
        
        while (-not $ExecutionSuccess -and $Attempt -lt $MaxAttempts) {
            $Attempt++
            $Status = Test-SystemEnvironment
            
            if ($Status -ne "HEALTHY") {
                Write-Host "[Network Flakiness] Connection dropped or running slow. Sleeping for 20 seconds..." -ForegroundColor Yellow
                Start-Sleep -Seconds 20
                $Attempt-- 
                continue
            }
            
            try {
                Write-Host "[Attempt $Attempt/$MaxAttempts] Executing OpenCode strict refactoring sequence..." -ForegroundColor Yellow
                
                # Execute the build agent command inline safely
                & opencode run --agent build $RefactorPrompt
                
                $ExecutionSuccess = $true
                Write-Host "[Success] Finished processing restricted optimizations for [$Mod]." -ForegroundColor Green
                
            } catch {
                # Store the error details in memory
                $LastCollectedError = $_.Exception.ToString()
                Write-Host "[CLI Run Error Encountered in $Mod]" -ForegroundColor Red
                
                if ($Attempt -lt $MaxAttempts) {
                    Write-Host "Cooling down API rate limit thresholds. Retrying module execution sequence in 30 seconds..." -ForegroundColor Yellow
                    Start-Sleep -Seconds 30
                } else {
                    Write-Host "[Bypass] Module [$Mod] failed repeatedly. Appending crash log to master record..." -ForegroundColor Red
                    
                    # Append structured crash information to the single global file
                    $ModuleErrorLog = @"

--------------------------------------------------------------------
FAILED MODULE: [$Mod]
Timestamp: $(Get-Date)
Attempts Made: $Attempt
--------------------------------------------------------------------
$LastCollectedError
====================================================================
"@
                    Add-Content -Path $GlobalErrorLogPath -Value $ModuleErrorLog
                    
                    Send-NtfyNotification -Title "Module Refactor Bypassed" -Message "Module [$Mod] failed. Error appended to GLOBAL_REFACTOR_ERRORS.log" -Priority "4" -Tags "warning"
                }
            }
        }
    }

    # Reset Terminal Scope
    Set-Location $BaseDocPath
    Write-Host "`n=== ALL MODULE BLUEPRINTS PROCESSED ===" -ForegroundColor Green
    Write-Host "[Manual Review Phase Active] Inspect your modified code files via git diff before staging." -ForegroundColor Yellow
    Send-NtfyNotification -Title "Refactor Run Complete" -Message "Refactoring cycle completed. Review GLOBAL_REFACTOR_ERRORS.log for failures." -Priority "5" -Tags "tada"

} catch {
    Write-Host "`n[FATAL RUNTIME STOP ENCOUNTERED]" -ForegroundColor Red
    $FatalErrorMsg = $_.Exception.ToString()
    Write-Host $FatalErrorMsg -ForegroundColor Yellow
    
    # Append catastrophic execution crash details to the single log before closing out
    Add-Content -Path $GlobalErrorLogPath -Value "`n`nCRITICAL RUNTIME EXCEPTION HIT:`n$FatalErrorMsg"
    Send-NtfyNotification -Title "Refactor Engine Crashed" -Message "Critical engine error logged to global error tracker." -Priority "5" -Tags "rotating_light"
}
