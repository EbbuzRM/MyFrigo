<#
.SYNOPSIS
    Configura le variabili d'ambiente per la Edge Function 'send-expiration-notifications'.

.DESCRIPTION
    Questo script genera due secret casuali per la Edge Function e guida l'utente
    nella configurazione dalla dashboard Supabase.

    Secret generati:
    1. JWT_SECRET - Secret per la firma dei token JWT (UUID v4)
    2. WEBHOOK_SECRET - Secret per la verifica dei webhook (password casuale 32 char)

.NOTES
    Progetto Supabase: tfhjupcybietwzmnpwfh
    Dashboard Functions: https://supabase.com/dashboard/project/tfhjupcybietwzmnpwfh/functions
#>

[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

# Colori per l'output
$ColorTitle    = "Cyan"
$ColorStep     = "Yellow"
$ColorInfo     = "Green"
$ColorWarn     = "Red"
$ColorSecret   = "White"
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

function Write-Secret {
    param([string]$Name, [string]$Value)
    Write-Host "  $Name = " -NoNewline -ForegroundColor $ColorInfo
    Write-Host "$Value" -ForegroundColor $ColorSecret
}

function Write-Success {
    param([string]$Text)
    Write-Host "  [OK] $Text" -ForegroundColor $ColorInfo
}

# ============================================================
# INTRO
# ============================================================
Write-Title "Setup Edge Function Secrets"

Write-Step "Generazione secret per la Edge Function"
Write-Info "Edge Function: send-expiration-notifications"
Write-Info ""
Write-Info "Verranno generati due secret casuali:"
Write-Info "  1. JWT_SECRET - Per la firma dei token JWT"
Write-Info "  2. WEBHOOK_SECRET - Per la verifica dei webhook"
Write-Info ""

# ============================================================
# GENERAZIONE SECRET
# ============================================================
Write-Title "Secret Generati"

# Genera JWT_SECRET come UUID v4
$jwtSecret = [System.Guid]::NewGuid().ToString()

# Genera WEBHOOK_SECRET come password casuale di 32 caratteri con 8 caratteri non alfanumerici
try {
    Add-Type -AssemblyName System.Web
    $webhookSecret = [System.Web.Security.Membership]::GeneratePassword(32, 8)
} catch {
    # Fallback se System.Web non è disponibile (es. .NET Core senza System.Web)
    Write-Info "System.Web non disponibile, uso fallback per generazione password..."
    $chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+[]{}|;:,.<>?"
    $random = New-Object System.Random
    $webhookSecret = -join (1..32 | ForEach-Object { $chars[$random.Next(0, $chars.Length)] })
}

Write-Secret "JWT_SECRET" $jwtSecret
Write-Secret "WEBHOOK_SECRET" $webhookSecret

# ============================================================
# COPIA NEGLI APPUNTI
# ============================================================
Write-Title "Copia negli Appunti"

$clipboardContent = @"
JWT_SECRET=$jwtSecret
WEBHOOK_SECRET=$webhookSecret
"@

try {
    $clipboardContent | Set-Clipboard
    Write-Success "I secret sono stati copiati negli appunti!"
    Write-Info "Puoi incollarli direttamente nella dashboard Supabase."
} catch {
    Write-Warn "Impossibile copiare negli appunti. Copia manualmente i valori sopra."
}

# ============================================================
# ISTRUZIONI PER LA CONFIGURAZIONE
# ============================================================
Write-Title "Configurazione nella Dashboard Supabase"

Write-Step "Segui questi passaggi:"
Write-Info ""
Write-Info "1. Apri la pagina delle Edge Functions:"
Write-Link "https://supabase.com/dashboard/project/tfhjupcybietwzmnpwfh/functions"
Write-Info ""
Write-Info "2. Seleziona la funzione 'send-expiration-notifications'"
Write-Info ""
Write-Info "3. Vai alla sezione 'Secrets' o 'Environment Variables'"
Write-Info ""
Write-Info "4. Aggiungi le seguenti variabili:"
Write-Info ""
Write-Info "   Nome: JWT_SECRET"
Write-Info "   Valore: $jwtSecret"
Write-Info ""
Write-Info "   Nome: WEBHOOK_SECRET"
Write-Info "   Valore: $webhookSecret"
Write-Info ""
Write-Info "5. Salva le modifiche"
Write-Info ""
Write-Info "6. (Opzionale) Se usi la CLI Supabase, puoi anche eseguire:"
Write-Info ""
Write-Info "   supabase secrets set JWT_SECRET=$jwtSecret"
Write-Info "   supabase secrets set WEBHOOK_SECRET=$webhookSecret"
Write-Info ""

# ============================================================
# SALVATAGGIO OPZIONALE
# ============================================================
Write-Title "Salvataggio Locale (Opzionale)"

Write-Warn "ATTENZIONE: Non salvare mai questi secret nel codice o nel git history!"
Write-Info ""
Write-Info "Se vuoi salvare una copia locale sicura per riferimento:"

$saveLocally = Read-Host "Vuoi salvare i secret in un file .env.edge-function (aggiunto a .gitignore)? (y/N)"

if ($saveLocally -eq "y" -or $saveLocally -eq "Y") {
    $envFile = Join-Path $PSScriptRoot ".." ".env.edge-function"

    if (Test-Path $envFile) {
        Write-Warn "Il file .env.edge-function esiste già."
        $overwrite = Read-Host "Vuoi sovrascriverlo? (y/N)"
        if ($overwrite -ne "y" -and $overwrite -ne "Y") {
            Write-Info "File non sovrascritto."
        } else {
            $envContent = @"
# Edge Function Secrets - send-expiration-notifications
# QUESTO FILE NON DEVE ESSERE COMMITTATO NEL GIT HISTORY!
# Aggiunto a .gitignore automaticamente.

JWT_SECRET=$jwtSecret
WEBHOOK_SECRET=$webhookSecret
"@
            $envContent | Set-Content $envFile -Encoding UTF8
            Write-Success "Secret salvati in: $envFile"
        }
    } else {
        $envContent = @"
# Edge Function Secrets - send-expiration-notifications
# QUESTO FILE NON DEVE ESSERE COMMITTATO NEL GIT HISTORY!
# Aggiunto a .gitignore automaticamente.

JWT_SECRET=$jwtSecret
WEBHOOK_SECRET=$webhookSecret
"@
        $envContent | Set-Content $envFile -Encoding UTF8
        Write-Success "Secret salvati in: $envFile"

        # Aggiungi a .gitignore se non già presente
        $gitignoreFile = Join-Path $PSScriptRoot ".." ".gitignore"
        if (Test-Path $gitignoreFile) {
            $gitignoreContent = Get-Content $gitignoreFile -Encoding UTF8
            if ($gitignoreContent -notcontains ".env.edge-function") {
                "`n# Edge function secrets (generated by Setup-EdgeFunctionSecrets.ps1)" | Add-Content $gitignoreFile -Encoding UTF8
                ".env.edge-function" | Add-Content $gitignoreFile -Encoding UTF8
                Write-Success "Aggiunto .env.edge-function a .gitignore"
            }
        }
    }
} else {
    Write-Info "File non creato. Ricorda di configurare i secret nella dashboard Supabase."
}

# ============================================================
# VERIFICA
# ============================================================
Write-Title "Verifica"

Write-Step "Per verificare che i secret siano configurati correttamente:"
Write-Info ""
Write-Info "1. Dalla dashboard Supabase, vai alla pagina della funzione"
Write-Link "https://supabase.com/dashboard/project/tfhjupcybietwzmnpwfh/functions"
Write-Info ""
Write-Info "2. Controlla che le variabili JWT_SECRET e WEBHOOK_SECRET siano presenti"
Write-Info ""
Write-Info "3. Puoi testare la funzione con:"
Write-Info ""
Write-Info "   curl -X POST \`
Write-Info "     https://tfhjupcybietwzmnpwfh.functions.supabase.co/send-expiration-notifications \`
Write-Info "     -H 'Authorization: Bearer <JWT_TOKEN>' \`
Write-Info "     -H 'Content-Type: application/json'"
Write-Info ""

Write-Title "Setup completato!"
Write-Info "Ricorda: questi secret sono sensibili. Non condividerli mai."
Write-Info "Se vengono compromessi, rigenera nuovi secret e aggiorna la configurazione."
