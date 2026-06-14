param(
  [string]$Root = "C:\projects\JiZhanTuWei_3.8.3ts\build\web-mobile",
  [int]$Port = 8080
)

$ErrorActionPreference = "Stop"
$rootPath = (Resolve-Path -LiteralPath $Root).Path
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://127.0.0.1:$Port/")
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Serving $rootPath at http://localhost:$Port/"

$types = @{
  ".html" = "text/html; charset=utf-8"
  ".js" = "application/javascript; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
  ".css" = "text/css; charset=utf-8"
  ".png" = "image/png"
  ".jpg" = "image/jpeg"
  ".jpeg" = "image/jpeg"
  ".webp" = "image/webp"
  ".ico" = "image/x-icon"
  ".wasm" = "application/wasm"
  ".bin" = "application/octet-stream"
  ".bundle" = "application/octet-stream"
  ".ttf" = "font/ttf"
}

while ($listener.IsListening) {
  $context = $listener.GetContext()
  try {
    $relative = [Uri]::UnescapeDataString($context.Request.Url.AbsolutePath.TrimStart("/"))
    if ([string]::IsNullOrWhiteSpace($relative)) {
      $relative = "index.html"
    }

    $candidate = [System.IO.Path]::GetFullPath((Join-Path $rootPath $relative))
    if (-not $candidate.StartsWith($rootPath, [System.StringComparison]::OrdinalIgnoreCase)) {
      $context.Response.StatusCode = 403
      $context.Response.Close()
      continue
    }

    if (-not [System.IO.File]::Exists($candidate)) {
      $context.Response.StatusCode = 404
      $bytes = [System.Text.Encoding]::UTF8.GetBytes("Not found")
      $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
      $context.Response.Close()
      continue
    }

    $ext = [System.IO.Path]::GetExtension($candidate).ToLowerInvariant()
    $context.Response.ContentType = if ($types.ContainsKey($ext)) { $types[$ext] } else { "application/octet-stream" }
    $bytes = [System.IO.File]::ReadAllBytes($candidate)
    $context.Response.ContentLength64 = $bytes.Length
    $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    $context.Response.Close()
  } catch {
    try {
      $context.Response.StatusCode = 500
      $bytes = [System.Text.Encoding]::UTF8.GetBytes($_.Exception.Message)
      $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
      $context.Response.Close()
    } catch {}
  }
}
