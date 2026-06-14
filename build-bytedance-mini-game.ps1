param(
  [string]$ProjectPath = "C:\projects\JiZhanTuWei_3.8.3ts",
  [string]$CocosExe = "C:\CocosCreator\3.8.3\CocosCreator.exe",
  [string]$AppId = "tt02d6746b9cb2fc0e10",
  [int]$TimeoutSeconds = 600
)

$ErrorActionPreference = "Stop"

$start = Get-Date
$buildArgs = @(
  "--project", $ProjectPath,
  "--build", "platform=bytedance-mini-game;debug=false;outputName=bytedance-mini-game;taskName=bytedance-mini-game;appid=$AppId"
)

& $CocosExe @buildArgs

$logDir = Join-Path $ProjectPath "temp\builder\log"
$deadline = (Get-Date).AddSeconds($TimeoutSeconds)
$log = $null

while ((Get-Date) -lt $deadline) {
  $log = Get-ChildItem $logDir -Filter "bytedance-mini-game*.log" -ErrorAction SilentlyContinue |
    Where-Object { $_.LastWriteTime -ge $start.AddMinutes(-1) } |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

  if ($log) {
    $text = Get-Content -LiteralPath $log.FullName -Raw
    if ($text -match "build success") {
      break
    }
    if ($text -match "Build Failed|error TS|SyntaxError|Exception") {
      throw "ByteDance mini game build failed. See $($log.FullName)"
    }
  }

  Start-Sleep -Seconds 3
}

if (-not $log) {
  throw "Timed out waiting for ByteDance mini game build log."
}

$finalText = Get-Content -LiteralPath $log.FullName -Raw
if ($finalText -notmatch "build success") {
  throw "Timed out waiting for ByteDance mini game build success. See $($log.FullName)"
}

$projectConfigPath = Join-Path $ProjectPath "build\bytedance-mini-game\project.config.json"
if (-not (Test-Path -LiteralPath $projectConfigPath)) {
  throw "Missing project.config.json at $projectConfigPath"
}

$projectConfig = Get-Content -LiteralPath $projectConfigPath -Raw | ConvertFrom-Json
$projectConfig.appid = $AppId
$projectConfig | ConvertTo-Json -Depth 20 -Compress | Set-Content -LiteralPath $projectConfigPath -Encoding UTF8

Write-Host "ByteDance mini game build ready:"
Write-Host "  AppId: $AppId"
Write-Host "  Output: $(Join-Path $ProjectPath 'build\bytedance-mini-game')"
Write-Host "  Log: $($log.FullName)"
