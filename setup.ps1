# ============================================================
# Bean and Brew - Windows Setup Script
# Double-click setup.cmd to run, or:
#   PowerShell -ExecutionPolicy Bypass -File setup.ps1
# ============================================================

# Allow this script to run even if called directly via right-click
try { Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force } catch {}

$ErrorActionPreference = "Continue"

function Print-Header {
    Clear-Host
    Write-Host ""
    Write-Host "  ================================================" -ForegroundColor DarkYellow
    Write-Host "        Bean and Brew - Windows Setup" -ForegroundColor Yellow
    Write-Host "  ================================================" -ForegroundColor DarkYellow
    Write-Host ""
}

function Print-Step($msg)    { Write-Host "  >> $msg" -ForegroundColor Cyan }
function Print-Success($msg) { Write-Host "  OK $msg" -ForegroundColor Green }
function Print-Warning($msg) { Write-Host "  !! $msg" -ForegroundColor Yellow }
function Print-Error($msg)   { Write-Host "  XX $msg" -ForegroundColor Red }
function Print-Info($msg)    { Write-Host "     $msg" -ForegroundColor Gray }
function Print-Blank         { Write-Host "" }

function Refresh-Path {
    $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" +
                [System.Environment]::GetEnvironmentVariable("PATH", "User")
}

# -- Step 1: Check / Install Node.js ---------------------------
function Install-Node {
    Print-Step "Checking Node.js..."
    $node = Get-Command node -ErrorAction SilentlyContinue
    if ($node) {
        Print-Success "Node.js already installed: $(node --version)"
        return
    }

    # Try winget first (available on Windows 10/11)
    $winget = Get-Command winget -ErrorAction SilentlyContinue
    if ($winget) {
        Print-Step "Installing Node.js via winget..."
        winget install --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements --silent
        Refresh-Path
    } else {
        Print-Warning "Node.js not found. Downloading installer..."
        $nodeUrl = "https://nodejs.org/dist/v20.15.1/node-v20.15.1-x64.msi"
        $installer = "$env:TEMP\node-installer.msi"
        try {
            Invoke-WebRequest -Uri $nodeUrl -OutFile $installer -UseBasicParsing
        } catch {
            Print-Error "Failed to download Node.js installer."
            Print-Info "Please install manually from https://nodejs.org then re-run this script."
            Pause; exit 1
        }
        Print-Step "Installing Node.js (this may take a minute)..."
        Start-Process msiexec.exe -ArgumentList "/i `"$installer`" /quiet /norestart" -Wait
        Refresh-Path
    }

    # Verify it actually works in this session
    $node = Get-Command node -ErrorAction SilentlyContinue
    if (-not $node) {
        Print-Error "Node.js was installed but 'node' is not in PATH yet."
        Print-Info "Please close this window and re-run setup.cmd - Windows needs a fresh shell to pick up the new PATH."
        Pause; exit 1
    }
    Print-Success "Node.js installed: $(node --version)"
}

# -- Step 2: Check / Install PostgreSQL ------------------------
function Install-Postgres {
    Print-Step "Checking PostgreSQL..."

    $psql = Get-Command psql -ErrorAction SilentlyContinue
    if ($psql) {
        Print-Success "PostgreSQL already in PATH"
        return
    }

    # Search common install locations and add to PATH
    foreach ($pgBase in @("C:\Program Files\PostgreSQL", "C:\Program Files (x86)\PostgreSQL")) {
        if (Test-Path $pgBase) {
            $versions = Get-ChildItem $pgBase -Directory | Sort-Object Name -Descending
            foreach ($ver in $versions) {
                $binPath = "$pgBase\$($ver.Name)\bin"
                if (Test-Path "$binPath\psql.exe") {
                    $env:PATH += ";$binPath"
                    Print-Success "PostgreSQL found at $binPath"
                    return
                }
            }
        }
    }

    # Not found - try winget first, then fall back to direct download
    $winget = Get-Command winget -ErrorAction SilentlyContinue
    $pgInstalled = $false
    if ($winget) {
        # Try version-pinned IDs first, then the generic one — the available ID varies by winget catalog
        $pgWingetIds = @("PostgreSQL.PostgreSQL.17", "PostgreSQL.PostgreSQL.16", "PostgreSQL.PostgreSQL")
        foreach ($pgId in $pgWingetIds) {
            Print-Step "Installing PostgreSQL via winget ($pgId)..."
            winget install --id $pgId --exact --accept-source-agreements --accept-package-agreements `
                --override "--mode unattended --superpassword postgres --serverport 5432" | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Print-Success "PostgreSQL installed via winget"
                $pgInstalled = $true
                break
            }
        }
        if (-not $pgInstalled) {
            Print-Warning "winget install failed for all known package IDs, falling back to direct download..."
        }
    }

    if (-not $pgInstalled) {
        Print-Warning "PostgreSQL not found. Downloading installer (~300 MB)..."
        # Try to get the latest installer URL directly from the EDB download page
        $pgUrl = $null
        try {
            $wr = Invoke-WebRequest -Uri "https://www.enterprisedb.com/downloads/postgres-postgresql-downloads" `
                                    -UseBasicParsing -TimeoutSec 15
            $pgUrl = ($wr.Links.href | Where-Object { $_ -match "windows-x64\.exe$" -and $_ -match "get\.enterprisedb\.com" }) |
                     Select-Object -First 1
        } catch {}

        if (-not $pgUrl) {
            # Versioned fallback — more stable than a file-ID URL
            $pgUrl = "https://get.enterprisedb.com/postgresql/postgresql-17.4-1-windows-x64.exe"
            Print-Warning "Could not auto-detect installer URL, using bundled fallback."
        }

        $installer = "$env:TEMP\pg-installer.exe"
        try {
            Print-Info "Downloading from: $pgUrl"
            Invoke-WebRequest -Uri $pgUrl -OutFile $installer -UseBasicParsing
        } catch {
            Print-Error "Failed to download PostgreSQL installer."
            Print-Info "Please download and install manually from:"
            Print-Info "  https://www.postgresql.org/download/windows/"
            Print-Info "Set the superuser password to 'postgres', then re-run setup.cmd."
            Pause; exit 1
        }
        Print-Step "Installing PostgreSQL silently..."
        Start-Process $installer -ArgumentList "--mode unattended --superpassword postgres --serverport 5432" -Wait
    }

    # Refresh PATH and search again
    Refresh-Path
    foreach ($pgBase in @("C:\Program Files\PostgreSQL", "C:\Program Files (x86)\PostgreSQL")) {
        if (Test-Path $pgBase) {
            $versions = Get-ChildItem $pgBase -Directory | Sort-Object Name -Descending
            foreach ($ver in $versions) {
                $binPath = "$pgBase\$($ver.Name)\bin"
                if (Test-Path "$binPath\psql.exe") {
                    $env:PATH += ";$binPath"
                    Print-Success "PostgreSQL installed"
                    break
                }
            }
        }
    }

    # Wait for the PostgreSQL Windows service to become ready (up to 60 s)
    Print-Step "Waiting for PostgreSQL service to start..."
    $waited = 0
    while ($waited -lt 60) {
        $svc = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue | Where-Object { $_.Status -eq "Running" }
        if ($svc) { Print-Success "PostgreSQL service is running"; break }
        Start-Sleep -Seconds 2
        $waited += 2
    }
    if ($waited -ge 60) {
        Print-Warning "PostgreSQL service did not start within 60 s."
        Print-Info "If the next step fails, open Windows Services, find 'postgresql-x64-*' and click Start."
    }
}

# -- Step 3: Setup .env file -----------------------------------
function Setup-Env {
    Print-Step "Configuring environment..."
    $envPath = "backend\.env"
    if (-not (Test-Path $envPath)) {
        Copy-Item "backend\.env.example" $envPath
    }
    Print-Blank
    Write-Host "  Enter your PostgreSQL superuser password" -ForegroundColor White
    Write-Host "  (Press Enter to use the default: 'postgres')" -ForegroundColor Gray
    Write-Host "  Password: " -ForegroundColor Gray -NoNewline
    $pgPassword = Read-Host
    if ([string]::IsNullOrWhiteSpace($pgPassword)) { $pgPassword = "postgres" }

    $jwtSecret     = -join ((65..90)+(97..122)+(48..57) | Get-Random -Count 40 | ForEach-Object {[char]$_})
    $refreshSecret = -join ((65..90)+(97..122)+(48..57) | Get-Random -Count 40 | ForEach-Object {[char]$_})

    $envContent = Get-Content $envPath -Raw
    $envContent = $envContent -replace "DATABASE_URL=.*",       "DATABASE_URL=postgresql://postgres:${pgPassword}@localhost:5432/brewedtrue"
    $envContent = $envContent -replace "JWT_SECRET=.*",         "JWT_SECRET=${jwtSecret}"
    $envContent = $envContent -replace "JWT_REFRESH_SECRET=.*", "JWT_REFRESH_SECRET=${refreshSecret}"
    Set-Content $envPath $envContent -NoNewline:$false
    Print-Success "Environment configured"
    return $pgPassword
}

# -- Step 4: Create database -----------------------------------
function Create-Database($pgPassword) {
    Print-Step "Creating database brewedtrue..."
    $env:PGPASSWORD = $pgPassword
    $exists = psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='brewedtrue'" 2>$null
    if ($exists -eq "1") {
        Print-Success "Database brewedtrue already exists"
        return
    }
    psql -U postgres -c "CREATE DATABASE brewedtrue;" 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Print-Error "Could not connect to PostgreSQL."
        Print-Info "Make sure PostgreSQL is running (search 'Services' in the Start menu, find postgresql and click Start)."
        Print-Info "If your password is not 'postgres', re-run setup.cmd and enter the correct password."
        Pause; exit 1
    }
    Print-Success "Database brewedtrue created"
}

# -- Step 5: Install dependencies ------------------------------
function Install-Dependencies {
    Print-Step "Installing backend dependencies..."
    Push-Location backend
    $out = npm install 2>&1
    if ($LASTEXITCODE -ne 0) {
        Pop-Location
        Print-Error "Backend npm install failed:"
        $out | ForEach-Object { Print-Info $_ }
        Pause; exit 1
    }
    Pop-Location
    Print-Success "Backend dependencies ready"

    Print-Step "Installing frontend dependencies..."
    Push-Location frontend
    $out = npm install 2>&1
    if ($LASTEXITCODE -ne 0) {
        Pop-Location
        Print-Error "Frontend npm install failed:"
        $out | ForEach-Object { Print-Info $_ }
        Pause; exit 1
    }
    Pop-Location
    Print-Success "Frontend dependencies ready"
}

# -- Step 6: Seed database -------------------------------------
function Seed-Database {
    Print-Step "Seeding database with admin user and products..."
    Push-Location backend
    node src/db/seed.js
    $exitCode = $LASTEXITCODE
    Pop-Location
    if ($exitCode -ne 0) {
        Print-Error "Database seeding failed. Check the error above."
        Pause; exit 1
    }
    Print-Success "Database seeded"
}

# -- Step 7: Start servers -------------------------------------
function Start-Servers {
    Print-Blank
    Write-Host "  ================================================" -ForegroundColor DarkYellow
    Write-Host "        Starting Bean and Brew!" -ForegroundColor Yellow
    Write-Host "  ================================================" -ForegroundColor DarkYellow
    Print-Blank
    Write-Host "  Backend  ->  http://localhost:4000" -ForegroundColor Cyan
    Write-Host "  Frontend ->  http://localhost:5173" -ForegroundColor Cyan
    Print-Blank
    Write-Host "  Admin credentials:" -ForegroundColor White
    Write-Host "    Email:    admin@brewedtrue.com" -ForegroundColor Gray
    Write-Host "    Password: Admin1234!" -ForegroundColor Gray
    Print-Blank
    Write-Host "  Two terminal windows will open for the servers." -ForegroundColor DarkGray
    Write-Host "  Close them to stop the app." -ForegroundColor DarkGray
    Print-Blank

    $root = $PWD.Path

    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; npm run dev"
    Start-Sleep -Seconds 4   # give backend time to connect to DB

    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; npm run dev"
    Start-Sleep -Seconds 8   # give Vite time to compile before opening browser

    Start-Process "http://localhost:5173"
    Print-Success "Done! Browser opening at http://localhost:5173"
    Print-Blank
}

# -- MAIN ------------------------------------------------------
Print-Header
Install-Node
Print-Blank
Install-Postgres
Print-Blank
$pgPass = Setup-Env
Print-Blank
Create-Database $pgPass
Print-Blank
Install-Dependencies
Print-Blank
Seed-Database
Print-Blank
Start-Servers

Write-Host "  Press any key to close this window..." -ForegroundColor DarkGray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
