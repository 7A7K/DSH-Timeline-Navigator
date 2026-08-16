# Uninstall Timeline Navigator. Source is kept by default for safe rollback.

[CmdletBinding()]
param(
    [string]$DshHome = $env:DSH_HOME,
    [string]$Profile = 'web',
    [switch]$RemoveSource
)

$ErrorActionPreference = 'Stop'
$plugin = '@deepseek-ai/dsh-client-ui-timeline-navigator'
if (-not $DshHome) { $DshHome = Join-Path $env:USERPROFILE '.dsh' }
$pluginDir = Join-Path $DshHome "plugins\$plugin"
$linkPath = Join-Path $DshHome "profiles\node_modules\$plugin"
$patchFile = Join-Path $DshHome "profiles\$Profile\cordis.patch.yml"

if (Test-Path -LiteralPath $linkPath) {
    $item = Get-Item -LiteralPath $linkPath -Force
    if ($item.LinkType) { [IO.Directory]::Delete($linkPath) }
    else { Remove-Item -LiteralPath $linkPath -Recurse -Force }
}

if (Test-Path -LiteralPath $patchFile) {
    $content = Get-Content -LiteralPath $patchFile -Raw
    $pattern = '(?m)^[ \t]*-[ \t]*insert:[ \t]*\r?\n[ \t]*-[ \t]*id:[ \t]*ui-timeline-navigator[ \t]*\r?\n[ \t]*name:[ \t]*''@deepseek-ai/dsh-client-ui-timeline-navigator''[ \t]*\r?\n?'
    $next = $content -replace $pattern, ''
    if ($next -ne $content) { Set-Content -LiteralPath $patchFile -Value $next -Encoding UTF8 }
}

if ($RemoveSource -and (Test-Path -LiteralPath $pluginDir)) {
    Remove-Item -LiteralPath $pluginDir -Recurse -Force
    Write-Host "Removed source: $pluginDir" -ForegroundColor Yellow
} else {
    Write-Host "Source kept at $pluginDir (use -RemoveSource only when you are sure)." -ForegroundColor DarkGray
}

Write-Host 'Timeline Navigator uninstalled. Reload the DSH Web UI.' -ForegroundColor Green

