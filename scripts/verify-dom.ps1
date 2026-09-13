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
  'What are we building?',
  'New session',
  'Explore and understand the code',
  'Download OpenGrok',
  'A desktop window for local grok'
)
foreach ($text in $checks) {
  if ($html.Contains($text)) {
    Write-Output "OK $text"
  } else {
    Write-Output "MISSING $text"
  }
}
Write-Output "dom_bytes $($html.Length) exit $($proc.ExitCode)"
