# Install or update the Timeline Navigator plugin.
#
# Local checkout:
#   .\install.ps1 -Source (Get-Location).Path
# GitHub checkout:
#   .\install.ps1 -Source 'https://github.com/<owner>/<repo>' -Version v0.3.5

[CmdletBinding()]
param(
    [string]$Source = $PSScriptRoot,
    [string]$Version = 'latest',
    [string]$DshHome = $env:DSH_HOME,
    [string]$Profile = 'web'
)

$ErrorActionPreference = 'Stop'
$plugin = '@deepseek-ai/dsh-client-ui-timeline-navigator'
if (-not $DshHome) { $DshHome = Join-Path $env:USERPROFILE '.dsh' }
if (-not (Test-Path -LiteralPath $DshHome)) { throw "DSH home not found: $DshHome" }

$pluginsDir = Join-Path $DshHome 'plugins'
$pluginDir = Join-Path $pluginsDir $plugin
$nodeModules = Join-Path $DshHome 'profiles\node_modules'
$linkPath = Join-Path $nodeModules $plugin
$patchFile = Join-Path $DshHome "profiles\$Profile\cordis.patch.yml"
$staging = Join-Path $pluginsDir ".timeline-navigator-staging-$([guid]::NewGuid().ToString('N'))"
$downloadedZip = $null
$sourceDir = $null

try {
    New-Item -ItemType Directory -Force -Path $pluginsDir, $nodeModules, (Split-Path $linkPath -Parent), (Split-Path $patchFile -Parent) | Out-Null

    if ($Source -match '^https?://') {
        Write-Warning 'Fallback installer downloads source code from GitHub over HTTPS and does not verify a signature or SHA-256 hash.'
        Write-Warning 'Prefer: dsh plugin --profile web add github:7A7K/DSH-Timeline-Navigator. If using this script, pin -Version to an exact release tag and review the source first.'
        $repo = $Source.TrimEnd('/')
        if ($repo -match '\.git$') { $repo = $repo.Substring(0, $repo.Length - 4) }
        if ($repo -notmatch '^https://github\.com/[^/]+/[^/]+$') {
            throw "GitHub HTTPS repository URL expected: $Source"
        }

        $ref = $Version
        if ($Version -eq 'main') {
            Write-Warning 'The main branch is mutable. Use -Version latest or an exact tag such as v0.3.5 for a reproducible install.'
        }
        if ($Version -eq 'latest') {
            $repoPath = $repo -replace '^https://github\.com/', ''
            $release = Invoke-RestMethod -Uri "https://api.github.com/repos/$repoPath/releases/latest" -Headers @{ 'User-Agent' = 'DSH-Timeline-Navigator-installer' }
            $ref = [string]$release.tag_name
            if (-not $ref) { throw "Could not resolve the latest GitHub release for $repo" }
            Write-Host "Resolved latest release tag: $ref" -ForegroundColor DarkGray
        }

        $refType = if ($ref -match '^v?\d+\.\d+\.\d+(?:[-+].*)?$') { 'tags' } else { 'heads' }
        $downloadedZip = Join-Path $pluginsDir ".timeline-navigator-$([guid]::NewGuid().ToString('N')).zip"
        $archive = "$repo/archive/refs/$refType/$ref.zip"
        Write-Host "Downloading $archive" -ForegroundColor Cyan
        Invoke-WebRequest -Uri $archive -OutFile $downloadedZip -UseBasicParsing
        New-Item -ItemType Directory -Force -Path $staging | Out-Null
        Expand-Archive -LiteralPath $downloadedZip -DestinationPath $staging -Force
        Remove-Item -LiteralPath $downloadedZip -Force
        $downloadedZip = $null
        $sourceDir = (Get-ChildItem -LiteralPath $staging -Directory | Select-Object -First 1).FullName
    } else {
        $sourceDir = (Resolve-Path -LiteralPath $Source).Path
    }

    if (-not (Test-Path -LiteralPath (Join-Path $sourceDir 'lib\client.js'))) {
        throw "Source does not contain lib\client.js: $sourceDir. Run npm run bundle first."
    }

    # Keep the source under DSH_HOME so a temporary checkout cannot leave a
    # dangling junction after cleanup or reboot.
    if (([IO.Path]::GetFullPath($sourceDir).TrimEnd('\')) -ne ([IO.Path]::GetFullPath($pluginDir).TrimEnd('\'))) {
        if (Test-Path -LiteralPath $pluginDir) {
            $backup = "$pluginDir.backup-$((Get-Date).ToString('yyyyMMdd-HHmmss'))"
            Move-Item -LiteralPath $pluginDir -Destination $backup
            Write-Host "Previous source kept at $backup" -ForegroundColor DarkGray
        }
        New-Item -ItemType Directory -Force -Path (Split-Path $pluginDir -Parent) | Out-Null
        Copy-Item -LiteralPath $sourceDir -Destination $pluginDir -Recurse -Force
    }

    if (Test-Path -LiteralPath $linkPath) {
        $existing = Get-Item -LiteralPath $linkPath -Force
        if ($existing.LinkType) { [IO.Directory]::Delete($linkPath) }
        else { Remove-Item -LiteralPath $linkPath -Recurse -Force }
    }
    New-Item -ItemType Junction -Path $linkPath -Target $pluginDir | Out-Null

    $entry = "- insert:`n    - id: ui-timeline-navigator`n      name: '$plugin'"
    if (-not (Test-Path -LiteralPath $patchFile)) {
        Set-Content -LiteralPath $patchFile -Value ($entry + "`n") -Encoding UTF8
    } else {
        $content = Get-Content -LiteralPath $patchFile -Raw
        if ($content -notmatch '(?m)^\s*-\s+id:\s*ui-timeline-navigator\s*$') {
            $base = ($content -replace '(?s)\[\s*\]\s*$', '').TrimEnd()
            $next = if ($base) { $base + "`n`n" + $entry + "`n" } else { $entry + "`n" }
            Set-Content -LiteralPath $patchFile -Value $next -Encoding UTF8
        }
    }

    Write-Host 'Timeline Navigator installed.' -ForegroundColor Green
    Write-Host 'Reload http://127.0.0.1:3080/ (restart the dsh web process if the old bundle remains).' -ForegroundColor Yellow
} finally {
    if (Test-Path -LiteralPath $staging) { Remove-Item -LiteralPath $staging -Recurse -Force }
    if ($downloadedZip -and (Test-Path -LiteralPath $downloadedZip)) { Remove-Item -LiteralPath $downloadedZip -Force }
}
