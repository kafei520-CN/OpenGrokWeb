$ErrorActionPreference = 'Stop'
$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$outDir = 'C:\Users\mckafei\Desktop\OpenGrokWeb\.verify'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$profile = Join-Path $outDir 'edge-dom'
New-Item -ItemType Directory -Force -Path $profile | Out-Null
$domFile = Join-Path $outDir 'en-dom.html'
$args = @(
  '--headless=new',
  '--disable-gpu',
  '--virtual-time-budget=4000',
  "--user-data-dir=$profile",
  '--dump-dom',
  'http://127.0.0.1:4173/?lang=en&theme=light'
)
$proc = Start-Process -FilePath $edge -ArgumentList $args -RedirectStandardOutput $domFile -PassThru -Wait -NoNewWindow
$html = Get-Content -Raw $domFile
$checks = @(
  'Three places, the same grok',
  'OpenGrok Plugins',
  'plugins.jetbrains.com/plugin/33923-opengrok-plugins',
  'marketplace.visualstudio.com/items?itemName=kafei520cn.grok-for-vs-code',
  'Download OpenGrok'
)
foreach ($text in $checks) {
  if ($html.Contains($text)) {
    Write-Output "OK $text"
  } else {
    Write-Output "MISSING $text"
  }
}
Write-Output "dom_bytes $($html.Length) exit $($proc.ExitCode)"
