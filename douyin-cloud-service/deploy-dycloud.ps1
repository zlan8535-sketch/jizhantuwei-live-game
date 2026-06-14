param(
    [string]$AppId = "tt02d6746b9cb2fc0e10",
    [string]$Env = "dev",
    [string]$ServiceName = "jizhantuwei-live-svc",
    [string]$Tag = ("jztw-live-callback-{0}" -f (Get-Date -Format "yyyyMMdd-HHmmss"))
)

$ErrorActionPreference = "Stop"

Set-Location $PSScriptRoot

if (-not (Get-Command dycloud -ErrorAction SilentlyContinue)) {
    throw "dycloud CLI not found. Install @open-dy/cloud-cli or use Douyin Cloud Git deployment in the web console."
}

dycloud login
dycloud env:switch --app-id $AppId --env $Env
dycloud container:build --service-name $ServiceName
dycloud container:push --service-name $ServiceName --tag $Tag --remark "deploy JiZhanTuWei live callback service"
dycloud container:deploy --service-name $ServiceName --tag $Tag --note "deploy JiZhanTuWei live callback service" --service-size 1 --no-confirm

Write-Host "Deployed $ServiceName with tag $Tag"
