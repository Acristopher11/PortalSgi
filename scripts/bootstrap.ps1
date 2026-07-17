#!/usr/bin/env pwsh
# SgiPortal Bootstrap Script
# Purpose: Initialize development environment with all tools and dependencies
# Usage: .\scripts\bootstrap.ps1

param(
	[switch]$SkipNodeDeps = $false,
	[switch]$SkipEngram = $false,
	[switch]$SkipGentleAI = $false,
	[switch]$OnlyRefreshPath = $false
)

# ============================================================================
# COLOR OUTPUT FUNCTIONS
# ============================================================================
function Write-Step { param([string]$msg); Write-Host "`n[STEP]" -ForegroundColor Cyan -NoNewline; Write-Host " $msg" }
function Write-Success { param([string]$msg); Write-Host "`n[OK]" -ForegroundColor Green -NoNewline; Write-Host " $msg" }
function Write-Warning { param([string]$msg); Write-Host "`n[WARN]" -ForegroundColor Yellow -NoNewline; Write-Host " $msg" }
function Write-Error { param([string]$msg); Write-Host "`n[ERROR]" -ForegroundColor Red -NoNewline; Write-Host " $msg" }

# ============================================================================
# HELPERS
# ============================================================================
function Test-CommandExists {
	param([string]$cmd)
	$null = Get-Command $cmd -ErrorAction SilentlyContinue
	return $?
}

function Invoke-Command-Safe {
	param([string]$cmd, [string]$desc)
	Write-Step "Running: $desc"
	Invoke-Expression $cmd
	if ($LASTEXITCODE -ne 0) {
		Write-Error "Failed: $desc (exit code $LASTEXITCODE)"
		return $false
	}
	Write-Success "$desc"
	return $true
}

# ============================================================================
# MAIN
# ============================================================================
Write-Host "+----------------------------------------------------------------+" -ForegroundColor Magenta
Write-Host "|        SgiPortal Bootstrap - Development Environment          |" -ForegroundColor Magenta
Write-Host "|                   React 19 + Vite + TypeScript                |" -ForegroundColor Magenta
Write-Host "+----------------------------------------------------------------+" -ForegroundColor Magenta

# Check if we're in the SgiPortal directory
$projectRoot = Get-Location
if (-not (Test-Path "package.json")) {
	Write-Error "package.json not found. Are you in the SgiPortal directory?"
	exit 1
}

Write-Success "Project root: $projectRoot"

# ============================================================================
# 1. REFRESH PATH (Critical for newly installed tools)
# ============================================================================
if ($OnlyRefreshPath) {
	Write-Step "Refreshing PATH from environment"
	$env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")
	Write-Success "PATH refreshed"
	exit 0
}

Write-Step "Refreshing PATH (phase 1)"
$env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")

# ============================================================================
# 2. VERIFY REQUIRED TOOLS
# ============================================================================
Write-Step "Verifying required tools"

$tools = @{
	"node"  = "Node.js"
	"npm"   = "npm"
	"git"   = "Git"
}

foreach ($tool in $tools.Keys) {
	if (Test-CommandExists $tool) {
		$version = & $tool --version 2>&1 | Select-Object -First 1
		Write-Success "$($tools[$tool]): $version"
	} else {
		Write-Warning "$($tools[$tool]) not found in PATH. Please install it first."
	}
}

# ============================================================================
# 3. NODE DEPENDENCIES
# ============================================================================
if (-not $SkipNodeDeps) {
	Write-Step "Installing Node dependencies"
	Invoke-Command-Safe "npm install --no-save" "npm install"
	if ($LASTEXITCODE -eq 0) {
		Write-Success "Node dependencies installed"
	} else {
		Write-Error "Failed to install Node dependencies"
		exit 1
	}
} else {
	Write-Warning "Skipping Node dependencies (--SkipNodeDeps flag set)"
}

# ============================================================================
# 4. TYPESCRIPT CHECK & BUILD
# ============================================================================
Write-Step "Verifying TypeScript configuration"
Invoke-Command-Safe "npm run type:check" "TypeScript type check"

Write-Step "Building project (Vite)"
Invoke-Command-Safe "npm run build" "Vite build"

# ============================================================================
# 5. LINTING
# ============================================================================
Write-Step "Running ESLint"
Invoke-Command-Safe "npm run lint" "ESLint check"

# ============================================================================
# 6. GO TOOLCHAIN (for Engram)
# ============================================================================
if (-not $SkipEngram) {
	Write-Step "Checking Go installation"
	if (Test-CommandExists "go") {
		$goVersion = & go version
		Write-Success "Go installed: $goVersion"
	} else {
		Write-Warning "Go not found. Engram compilation skipped. Install Go via: winget install GoLang.Go"
	}

	# Check if Engram binary exists
	$engramPath = "$env:USERPROFILE\go\bin\engram.exe"
	if (Test-Path $engramPath) {
		$engramVersion = & $engramPath version 2>&1 | Select-Object -First 1
		Write-Success "Engram available: $engramVersion"
	} else {
		Write-Warning "Engram binary not found at $engramPath"
		Write-Step "To install Engram:"
		Write-Host "  1. Clone repo: git clone https://github.com/Gentleman-Programming/engram.git" -ForegroundColor Yellow
		Write-Host "  2. Build: cd engram && go build -o engram.exe ./cmd/engram" -ForegroundColor Yellow
		Write-Host "  3. Copy: copy engram.exe $env:USERPROFILE\go\bin\" -ForegroundColor Yellow
	}
} else {
	Write-Warning "Skipping Engram check (--SkipEngram flag set)"
}

# ============================================================================
# 7. GENTLE-AI VERIFICATION
# ============================================================================
if (-not $SkipGentleAI) {
	Write-Step "Checking Gentle-AI installation"
	if (Test-CommandExists "gentle-ai") {
		$gentleAIVersion = & gentle-ai --version 2>&1 | Select-Object -First 1
		Write-Success "Gentle-AI installed: $gentleAIVersion"
	} else {
		Write-Warning "Gentle-AI not found. Install via: scoop install gentle-ai"
		Write-Step "If Scoop not installed:"
		Write-Host "  1. Install Scoop: iwr -useb get.scoop.sh | iex" -ForegroundColor Yellow
		Write-Host "  2. Add bucket: scoop bucket add gentleman https://github.com/Gentleman-Programming/scoop-bucket" -ForegroundColor Yellow
		Write-Host "  3. Install: scoop install gentle-ai" -ForegroundColor Yellow
	}
} else {
	Write-Warning "Skipping Gentle-AI check (--SkipGentleAI flag set)"
}

# ============================================================================
# 8. PAC CLI VERIFICATION
# ============================================================================
Write-Step "Checking Power Platform CLI"
if (Test-CommandExists "pac") {
	$pacVersion = & pac --version 2>&1 | Select-Object -First 1
	Write-Success "PAC CLI installed: $pacVersion"
	Write-Step "To verify PAC auth status:"
	Write-Host "  pac auth list" -ForegroundColor Cyan
} else {
	Write-Warning "PAC CLI not found. Install via: dotnet tool install -g Microsoft.PowerApps.CLI.Tool"
}

# ============================================================================
# 9. UV VERIFICATION (For gentle-ai)
# ============================================================================
Write-Step "Checking uv (Python package manager)"
if (Test-CommandExists "uv") {
	$uvVersion = & uv --version 2>&1 | Select-Object -First 1
	Write-Success "uv installed: $uvVersion"
} else {
	Write-Warning "uv not found. Install via: winget install --id astral-sh.uv"
}

# ============================================================================
# 10. GIT STATUS
# ============================================================================
Write-Step "Checking Git status"
$gitStatus = & git status --short
if ([string]::IsNullOrWhiteSpace($gitStatus)) {
	Write-Success "Git working directory clean"
} else {
	Write-Warning "Git working directory has uncommitted changes:"
	Write-Host $gitStatus -ForegroundColor Yellow
}

# ============================================================================
# 11. AGENT STRUCTURE VERIFICATION
# ============================================================================
Write-Step "Verifying .agent/ structure"
$agentFiles = @(
	".agent\agent.md",
	".agent\teams.md",
	".agent\registry\react-vite.md",
	".agent\memory\.gitkeep"
)

foreach ($file in $agentFiles) {
	if (Test-Path $file) {
		Write-Success "$file OK"
	} else {
		Write-Warning "$file missing (run: git add .agent/ && git commit -m 'chore(agent): add .agent structure')"
	}
}

# ============================================================================
# FINAL SUMMARY
# ============================================================================
Write-Host "`n+----------------------------------------------------------------+" -ForegroundColor Green
Write-Host "|                   BOOTSTRAP COMPLETE!                          |" -ForegroundColor Green
Write-Host "+----------------------------------------------------------------+" -ForegroundColor Green

Write-Host "`nNext Steps:" -ForegroundColor Cyan
Write-Host "  1. Start dev server:       npm run dev" -ForegroundColor White
Write-Host "  2. Run tests:               npm run test" -ForegroundColor White
Write-Host "  3. Commit changes:          git add . && git commit -m 'chore(...): description'" -ForegroundColor White
Write-Host "  4. View agent context:     cat .agent/agent.md" -ForegroundColor White
Write-Host "  5. Query Engram memory:    engram search 'topic'" -ForegroundColor White
Write-Host "  6. Check SDD pipeline:     cat .agent/teams.md" -ForegroundColor White

Write-Host "`n🔗 Useful Commands:" -ForegroundColor Cyan
Write-Host "  npm run type:check          # TypeScript validation" -ForegroundColor White
Write-Host "  npm run lint --fix          # Auto-fix ESLint errors" -ForegroundColor White
Write-Host "  npm run test -- --ui        # Vitest UI" -ForegroundColor White
Write-Host "  npm run coverage            # Test coverage report" -ForegroundColor White
Write-Host "  gentle-ai generate-spec     # Generate feature spec" -ForegroundColor White
Write-Host "  engram stats                # View Engram memory usage" -ForegroundColor White
Write-Host "  pac auth list               # Check Power Platform auth" -ForegroundColor White

Write-Host "`n✨ Happy Coding! 🚀" -ForegroundColor Magenta
