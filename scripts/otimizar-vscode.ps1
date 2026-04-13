param(
    [switch]$Deep,
    [int]$KeepWorkspaceCount = 1,
    [int]$KeepChatSessions = 5
)

$ErrorActionPreference = 'SilentlyContinue'

function Get-FolderSizeMB {
    param([string]$Path)

    if (-not (Test-Path -LiteralPath $Path)) { return 0 }
    $sum = (Get-ChildItem -LiteralPath $Path -Recurse -Force -File | Measure-Object -Property Length -Sum).Sum
    if ($null -eq $sum) { $sum = 0 }
    return [math]::Round(($sum / 1MB), 2)
}

function Clear-FolderContent {
    param([string]$Path)

    if (Test-Path -LiteralPath $Path) {
        Get-ChildItem -LiteralPath $Path -Force | Remove-Item -Recurse -Force
    }
}

$codeRoot = Join-Path $env:APPDATA 'Code'
if (-not (Test-Path -LiteralPath $codeRoot)) {
    Write-Host 'VS Code profile nao encontrado em %APPDATA%\Code.' -ForegroundColor Red
    exit 1
}

if ($KeepWorkspaceCount -lt 1) { $KeepWorkspaceCount = 1 }
if ($KeepChatSessions -lt 0) { $KeepChatSessions = 0 }

$targets = @(
    'Cache',
    'CachedData',
    'Code Cache',
    'GPUCache',
    'DawnCache',
    'Service Worker\CacheStorage',
    'Service Worker\ScriptCache',
    'logs',
    'User\History',
    'CachedExtensionVSIXs'
)

$stats = @()
foreach ($relative in $targets) {
    $full = Join-Path $codeRoot $relative
    $before = Get-FolderSizeMB -Path $full
    Clear-FolderContent -Path $full
    $after = Get-FolderSizeMB -Path $full

    $stats += [pscustomobject]@{
        Item   = $relative
        AntesMB = $before
        DepoisMB = $after
        GanhoMB = [math]::Round(($before - $after), 2)
    }
}

$deepSummary = @()
if ($Deep) {
    $workspaceStorage = Join-Path $codeRoot 'User\workspaceStorage'
    if (Test-Path -LiteralPath $workspaceStorage) {
        $workspaceDirs = Get-ChildItem -LiteralPath $workspaceStorage -Directory -Force | Sort-Object LastWriteTime -Descending
        $toKeep = $workspaceDirs | Select-Object -First $KeepWorkspaceCount
        $toDelete = $workspaceDirs | Select-Object -Skip $KeepWorkspaceCount

        foreach ($dir in $toDelete) {
            Remove-Item -LiteralPath $dir.FullName -Recurse -Force
        }

        $deepSummary += [pscustomobject]@{
            Acao = 'Workspaces removidos'
            Valor = ($toDelete | Measure-Object).Count
        }

        foreach ($dir in $toKeep) {
            $chatPath = Join-Path $dir.FullName 'chatSessions'
            if (Test-Path -LiteralPath $chatPath) {
                $chatFiles = Get-ChildItem -LiteralPath $chatPath -File -Force | Sort-Object LastWriteTime -Descending
                $chatDelete = $chatFiles | Select-Object -Skip $KeepChatSessions
                foreach ($file in $chatDelete) {
                    Remove-Item -LiteralPath $file.FullName -Force
                }

                $deepSummary += [pscustomobject]@{
                    Acao = "Chats removidos em $($dir.Name)"
                    Valor = ($chatDelete | Measure-Object).Count
                }
            }

            $stateBackup = Join-Path $dir.FullName 'state.vscdb.backup'
            if (Test-Path -LiteralPath $stateBackup) {
                Remove-Item -LiteralPath $stateBackup -Force
                $deepSummary += [pscustomobject]@{
                    Acao = "Backup removido em $($dir.Name)"
                    Valor = 1
                }
            }
        }
    }
}

$totalBefore = [math]::Round((($stats | Measure-Object -Property AntesMB -Sum).Sum), 2)
$totalAfter = [math]::Round((($stats | Measure-Object -Property DepoisMB -Sum).Sum), 2)
$totalGain = [math]::Round(($totalBefore - $totalAfter), 2)

Write-Host ''
Write-Host '===== OTIMIZACAO VS CODE =====' -ForegroundColor Cyan
Write-Host "Modo profundo: $Deep"
Write-Host ''
$stats | Sort-Object GanhoMB -Descending | Format-Table -AutoSize

if ($Deep -and $deepSummary.Count -gt 0) {
    Write-Host ''
    Write-Host 'Acoes do modo profundo:' -ForegroundColor Yellow
    $deepSummary | Format-Table -AutoSize
}

Write-Host ''
Write-Host "Total antes:  $totalBefore MB"
Write-Host "Total depois: $totalAfter MB"
Write-Host "Ganho total:  $totalGain MB" -ForegroundColor Green
Write-Host ''
Write-Host 'Recomendacao: reinicie o VS Code para consolidar a limpeza.' -ForegroundColor Magenta
