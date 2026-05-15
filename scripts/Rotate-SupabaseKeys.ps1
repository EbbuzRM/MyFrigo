<#
.SYNOPSIS
    Guida interattiva per la rotazione delle chiavi Supabase esposte nel git history.

.DESCRIPTION
    Questo script non ruota automaticamente le chiavi (richiederebbe API key di management Supabase).
    Fornisce invece una guida passo-passo all'utente per:
    1. Ruotare le chiavi dalla dashboard Supabase
    2. Aggiornare il file .env con le nuove chiavi
    3. Aggiornare .env.example se necessario

.NOTES
    Progetto Supabase: tfhjupcybietwzmnpwfh
    Dashboard: https://supabase.com/dashboard/project/tfhjupcybietwzmnpwfh/settings/api
#>

[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

# Colori per l'output
$ColorTitle    = "Cyan"
$ColorStep     = "Yellow"
$ColorInfo     = "Green"
$ColorWarn     = "Red"
$ColorPrompt   = "White"
$ColorLink     = "Magenta"

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

function Write-Link {
    param([string]$Text)
    Write-Host "  >> $Text" -ForegroundColor $ColorLink
}

# ============================================================
# INTRO
# ============================================================
Write-Title "Rotazione Chiavi Supabase"

Write-Step "Perché è necessaria questa rotazione?"
Write-Info "Le chiavi Supabase sono state esposte nel git history."
Write-Info "Anche se rimosse dai file attuali, rimangono accessibili"
Write-Info "a chiunque abbia accesso alla cronologia dei commit."
Write-Info ""
Write-Info "È necessario ruotarle (generarne di nuove) e invalidare le vecchie."

# ============================================================
# STEP 1: Istruzioni per la rotazione
# ============================================================
Write-Title "Step 1: Ruota le chiavi dalla Dashboard"

Write-Step "Segui questi passaggi nella dashboard Supabase:"
Write-Info ""
Write-Info "1. Apri la pagina delle API Keys del progetto:"
Write-Link "https://supabase.com/dashboard/project/tfhjupcybietwzmnpwfh/settings/api"
Write-Info ""
Write-Info "2. Nella sezione 'Project API keys':"
Write-Info "   - Trova la chiave 'anon' / 'public'"
Write-Info "   - Clicca su 'Regenerate' o 'Rotate'"
Write-Info "   - Conferma la rotazione"
Write-Info ""
Write-Info "3. Copia la NUOVA chiave anon/public generata"
Write-Info ""
Write-Info "4. (Opzionale ma consigliato) Ruota anche la service_role key"
Write-Info "   se è stata esposta, ma NON condividerla mai nel client!"
Write-Info ""

Write-Warn "IMPORTANTE: Dopo la rotazione, le vecchie chiavi saranno invalidate."
Write-Warn "Tutte le app che usano le vecchie chiavi smetteranno di funzionare."
Write-Warn "Assicurati di aggiornare .env e le EAS Secrets immediatamente dopo."

# ============================================================
# STEP 2: Inserimento nuove chiavi
# ============================================================
Write-Title "Step 2: Inserisci le nuove chiavi"

Write-Info "Inserisci le nuove chiavi ottenute dalla dashboard Supabase."
Write-Info "Lascia vuoto per saltare un campo (non verrà modificato)."
Write-Info ""

# Leggi il file .env se esiste
$envFile = Join-Path $PSScriptRoot ".." ".env"
$envExampleFile = Join-Path $PSScriptRoot ".." ".env.example"

$envContent = @{}
$envLines = @()

if (Test-Path $envFile) {
    $envLines = Get-Content $envFile -Encoding UTF8
    foreach ($line in $envLines) {
        if ($line -match '^([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            $envContent[$key] = $value
        }
    }
    Write-Info "File .env trovato con $($envContent.Count) variabili."
} else {
    Write-Warn "File .env non trovato. Verrà creato uno nuovo."
}

# Chiedi le nuove chiavi
$newSupabaseUrl = Read-Host "Nuovo EXPO_PUBLIC_SUPABASE_URL (o Invio per mantenere)"
$newSupabaseAnon = Read-Host "Nuovo EXPO_PUBLIC_SUPABASE_ANON_KEY (o Invio per mantenere)"

# ============================================================
# STEP 3: Aggiorna .env
# ============================================================
Write-Title "Step 3: Aggiornamento file .env"

$updated = $false

if ($newSupabaseUrl -and $newSupabaseUrl.Trim() -ne "") {
    $envContent["EXPO_PUBLIC_SUPABASE_URL"] = $newSupabaseUrl.Trim()
    $updated = $true
    Write-Info "EXPO_PUBLIC_SUPABASE_URL aggiornato."
}

if ($newSupabaseAnon -and $newSupabaseAnon.Trim() -ne "") {
    $envContent["EXPO_PUBLIC_SUPABASE_ANON_KEY"] = $newSupabaseAnon.Trim()
    $updated = $true
    Write-Info "EXPO_PUBLIC_SUPABASE_ANON_KEY aggiornato."
}

if (-not $updated) {
    Write-Warn "Nessuna nuova chiave inserita. Nessun file è stato modificato."
    Write-Info "Quando avrai le nuove chiavi, aggiorna manualmente il file .env:"
    Write-Info "  EXPO_PUBLIC_SUPABASE_URL=<nuovo_url>"
    Write-Info "  EXPO_PUBLIC_SUPABASE_ANON_KEY=<nuova_key>"
    exit 0
}

# Ricostruisci il file .env
$newLines = @()
$updatedKeys = @{}

foreach ($line in $envLines) {
    if ($line -match '^([^#][^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        if ($envContent.ContainsKey($key)) {
            $newLines += "$key=$($envContent[$key])"
            $updatedKeys[$key] = $true
        } else {
            $newLines += $line
        }
    } else {
        $newLines += $line
    }
}

# Aggiungi chiavi nuove che non esistevano prima
foreach ($kv in $envContent.GetEnumerator()) {
    if (-not $updatedKeys.ContainsKey($kv.Key)) {
        $newLines += "$($kv.Key)=$($kv.Value)"
    }
}

# Salva .env
$newLines | Set-Content $envFile -Encoding UTF8
Write-Info "File .env aggiornato con successo: $envFile"

# ============================================================
# STEP 4: Aggiorna .env.example
# ============================================================
Write-Title "Step 4: Aggiornamento file .env.example"

if (Test-Path $envExampleFile) {
    Write-Info "Il file .env.example esiste già."
    Write-Info "Verifica che contenga le variabili:"
    Write-Info "  EXPO_PUBLIC_SUPABASE_URL="
    Write-Info "  EXPO_PUBLIC_SUPABASE_ANON_KEY="
    Write-Info ""

    $updateExample = Read-Host "Vuoi aggiornare .env.example con placeholder vuoti? (y/N)"
    if ($updateExample -eq "y" -or $updateExample -eq "Y") {
        $exampleLines = Get-Content $envExampleFile -Encoding UTF8
        $newExampleLines = @()
        $exampleUpdatedKeys = @{}

        foreach ($line in $exampleLines) {
            if ($line -match '^([^#][^=]+)=(.*)$') {
                $key = $matches[1].Trim()
                if ($key -like "EXPO_PUBLIC_SUPABASE_*") {
                    $newExampleLines += "$key="
                    $exampleUpdatedKeys[$key] = $true
                } else {
                    $newExampleLines += $line
                }
            } else {
                $newExampleLines += $line
            }
        }

        # Aggiungi chiavi mancanti
        if (-not $exampleUpdatedKeys.ContainsKey("EXPO_PUBLIC_SUPABASE_URL")) {
            $newExampleLines += "EXPO_PUBLIC_SUPABASE_URL="
        }
        if (-not $exampleUpdatedKeys.ContainsKey("EXPO_PUBLIC_SUPABASE_ANON_KEY")) {
            $newExampleLines += "EXPO_PUBLIC_SUPABASE_ANON_KEY="
        }

        $newExampleLines | Set-Content $envExampleFile -Encoding UTF8
        Write-Info "File .env.example aggiornato: $envExampleFile"
    }
} else {
    Write-Info "File .env.example non trovato. Creazione di un nuovo file..."
    $exampleContent = @'
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=

# OneSignal
EXPO_PUBLIC_ONESIGNAL_APP_ID=

# OCR Space
EXPO_PUBLIC_OCR_SPACE_API_KEY=
'@
    $exampleContent | Set-Content $envExampleFile -Encoding UTF8
    Write-Info "File .env.example creato: $envExampleFile"
}

# ============================================================
# STEP 5: Prossimi passi
# ============================================================
Write-Title "Step 5: Prossimi passi"

Write-Step "Dopo aver aggiornato .env, devi anche:"
Write-Info ""
Write-Info "1. Aggiornare le EAS Secrets (usa scripts/Setup-EASSecrets.ps1):"
Write-Link "https://supabase.com/dashboard/project/tfhjupcybietwzmnpwfh/settings/api"
Write-Info ""
Write-Info "2. Eseguire un nuovo build dell'app con le nuove chiavi"
Write-Info ""
Write-Info "3. Rimuovere le vecchie chiavi dal git history (opzionale ma consigliato):"
Write-Info "   git filter-branch --tree-filter 'sed -i ...' -- --all"
Write-Info "   OPPURE usa BFG Repo-Cleaner: https://rtyley.github.io/bfg-repo-cleaner/"
Write-Info ""

Write-Title "Rotazione completata!"
Write-Info "Ricorda: le vecchie chiavi sono ora invalidate."
Write-Info "Assicurati che tutti gli ambienti siano aggiornati."
