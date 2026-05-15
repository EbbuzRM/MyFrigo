<#
.SYNOPSIS
    Configura EAS Secrets per tutti i profili del progetto Expo/React Native.

.DESCRIPTION
    Questo script configura le variabili d'ambiente come EAS Secrets per i profili:
    - release-apk
    - production
    - preview

    Richiede EAS CLI installato globalmente: npm install -g eas-cli
    Richiede autenticazione EAS: eas login

.NOTES
    Le secret saranno disponibili nei build EAS ma NON nel desarrollo locale.
    Per lo sviluppo locale, usa il file .env.
#>

[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

# Colori per l'output
$ColorTitle    = "Cyan"
$ColorStep     = "Yellow"
$ColorInfo     = "Green"
$ColorWarn     = "Red"
$ColorSuccess  = "Green"
$ColorError    = "Red"

function Write-Title {
    param([string]$Text)
    Write-Host "`n========================================" -ForegroundColor $ColorTitle
    Write-Host "  $Text" -ForegroundColor $ColorTitle
    Write-Host "========================================`n" -ForegroundColor $ColorTitle
}

function Write-Step {
    param([string]$Text)
    Write-Host "[STEP] $Text" -ForegroundColor $ColorStep
}

function Write-Info {
    param([string]$Text)
    Write-Host "  $Text" -ForegroundColor $ColorInfo
}

function Write-Warn {
    param([string]$Text)
    Write-Host "  [!] $Text" -ForegroundColor $ColorWarn
}

function Write-Success {
    param([string]$Text)
    Write-Host "  [OK] $Text" -ForegroundColor $ColorSuccess
}

function Write-Error {
    param([string]$Text)
    Write-Host "  [ERR] $Text" -ForegroundColor $ColorError
}

# ============================================================
# CHECK PREREQUISITI
# ============================================================
Write-Title "Setup EAS Secrets"

Write-Step "Verifica prerequisiti..."

# Controlla EAS CLI
$easInstalled = $null
try {
    $easInstalled = Get-Command eas -ErrorAction SilentlyContinue
} catch {
    $easInstalled = $null
}

if (-not $easInstalled) {
    Write-Warn "EAS CLI non trovato!"
    Write-Info "Installa EAS CLI con: npm install -g eas-cli"
    Write-Info ""
    $continue = Read-Host "Vuoi provare a installarlo ora? (y/N)"
    if ($continue -eq "y" -or $continue -eq "Y") {
        Write-Info "Installazione di eas-cli..."
        npm install -g eas-cli
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Installazione fallita. Installa manualmente e riprova."
            exit 1
        }
        Write-Success "EAS CLI installato con successo."
    } else {
        exit 1
    }
} else {
    Write-Success "EAS CLI trovato."
}

# Controlla autenticazione EAS
Write-Info "Verifica autenticazione EAS..."
$authCheck = eas whoami 2>&1
if ($LASTEXITCODE -ne 0 -or $authCheck -match "Not logged in") {
    Write-Warn "Non sei autenticato con EAS."
    Write-Info "Esegui: eas login"
    Write-Info ""
    $continue = Read-Host "Vuoi eseguire eas login ora? (y/N)"
    if ($continue -eq "y" -or $continue -eq "Y") {
        eas login
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Autenticazione fallita. Esegui 'eas login' manualmente e riprova."
            exit 1
        }
    } else {
        exit 1
    }
} else {
    Write-Success "Autenticato come: $authCheck"
}

# ============================================================
# RACCOLTA CHIAVI
# ============================================================
Write-Title "Inserimento Chiavi"

Write-Info "Inserisci le chiavi reali del tuo progetto."
Write-Info "Queste verranno configurate come EAS Secrets per TUTTI i profili."
Write-Info ""

$supabaseUrl = Read-Host "EXPO_PUBLIC_SUPABASE_URL"
if ([string]::IsNullOrWhiteSpace($supabaseUrl)) {
    Write-Warn "Supabase URL è obbligatorio."
    exit 1
}

$supabaseAnon = Read-Host "EXPO_PUBLIC_SUPABASE_ANON_KEY"
if ([string]::IsNullOrWhiteSpace($supabaseAnon)) {
    Write-Warn "Supabase Anon Key è obbligatoria."
    exit 1
}

$oneSignalId = Read-Host "EXPO_PUBLIC_ONESIGNAL_APP_ID (lascia vuoto se non usato)"

$ocrApiKey = Read-Host "EXPO_PUBLIC_OCR_SPACE_API_KEY (lascia vuoto se non usato)"

# ============================================================
# CONFIGURAZIONE SECRETS
# ============================================================
Write-Title "Configurazione EAS Secrets"

$profiles = @("release-apk", "production", "preview")

# Definisci le secret da configurare
$secrets = @{
    "EXPO_PUBLIC_SUPABASE_URL" = $supabaseUrl.Trim()
    "EXPO_PUBLIC_SUPABASE_ANON_KEY" = $supabaseAnon.Trim()
}

if ($oneSignalId -and $oneSignalId.Trim() -ne "") {
    $secrets["EXPO_PUBLIC_ONESIGNAL_APP_ID"] = $oneSignalId.Trim()
}

if ($ocrApiKey -and $ocrApiKey.Trim() -ne "") {
    $secrets["EXPO_PUBLIC_OCR_SPACE_API_KEY"] = $ocrApiKey.Trim()
}

$totalSteps = $profiles.Count * $secrets.Count
$currentStep = 0
$successCount = 0
$failCount = 0

foreach ($profile in $profiles) {
    Write-Step "Profilo: $profile"
    Write-Info "-----------------------------------"

    foreach ($kv in $secrets.GetEnumerator()) {
        $currentStep++
        $name = $kv.Key
        $value = $kv.Value
        $maskedValue = if ($value.Length -gt 8) {
            $value.Substring(0, 4) + "..." + $value.Substring($value.Length - 4)
        } else {
            "***"
        }

        Write-Host "  [$currentStep/$totalSteps] Configurazione $name = $maskedValue" -NoNewline

        try {
            $output = eas secret:push --scope project --name $name --value $value --profile $profile 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host " [OK]" -ForegroundColor $ColorSuccess
                $successCount++
            } else {
                Write-Host " [FALLITO]" -ForegroundColor $ColorError
                Write-Info "  Output: $output"
                $failCount++
            }
        } catch {
            Write-Host " [ERRORE]" -ForegroundColor $ColorError
            Write-Info "  Errore: $_"
            $failCount++
        }
    }
    Write-Info ""
}

# ============================================================
# RIEPILOGO
# ============================================================
Write-Title "Riepilogo Configurazione"

Write-Info "Profili configurati: $($profiles -join ', ')"
Write-Info "Secret configurate:"
foreach ($kv in $secrets.GetEnumerator()) {
    $maskedValue = if ($kv.Value.Length -gt 8) {
        $kv.Value.Substring(0, 4) + "..." + $kv.Value.Substring($kv.Value.Length - 4)
    } else {
        "***"
    }
    Write-Info "  - $($kv.Key) = $maskedValue"
}
Write-Info ""
Write-Info "Risultati: $successCount configurate con successo, $failCount fallite"
Write-Info ""

if ($failCount -gt 0) {
    Write-Warn "Alcune secret non sono state configurate correttamente."
    Write-Info "Verifica l'output sopra per i dettagli degli errori."
    Write-Info "Puoi riprovare eseguendo nuovamente questo script."
} else {
    Write-Success "Tutte le secret sono state configurate con successo!"
    Write-Info ""
    Write-Info "Per verificare le secret configurate, esegui:"
    Write-Info "  eas secret:list"
    Write-Info ""
    Write-Info "Le secret sono ora disponibili nei build EAS per i profili:"
    foreach ($p in $profiles) {
        Write-Info "  - $p"
    }
}

Write-Title "Setup completato!"
