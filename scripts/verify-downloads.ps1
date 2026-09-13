$ErrorActionPreference = 'Stop'
$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$outDir = 'C:\Users\mckafei\Desktop\OpenGrokWeb\.verify'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$profile = Join-Path $outDir 'edge-dl2'
New-Item -ItemType Directory -Force -Path $profile | Out-Null
$domFile = Join-Path $outDir 'dl-dom.html'
$args = @(
  '--headless=new',
  '--disable-gpu',
  '--disable-cache',
  '--virtual-time-budget=8000',
  "--user-data-dir=$profile",
  '--dump-dom',
  'http://127.0.0.1:4173/?lang=zh'
)
$proc = Start-Process -FilePath $edge -ArgumentList $args -RedirectStandardOutput $domFile -PassThru -Wait -NoNewWindow
$html = Get-Content -Raw $domFile
$needles = @(
  'OpenGrok_0.4.0_x64-setup.exe',
  'https://github.com/kafei520-CN/OpenGrok/releases/download/v0.4.0/OpenGrok_0.4.0_x64-setup.exe',
  'https://github.com/kafei520-CN/OpenGrok/releases/download/v0.4.0/OpenGrok_0.4.0_aarch64.dmg',
  'https://github.com/kafei520-CN/OpenGrok/releases/download/v0.4.0/OpenGrok_0.4.0_amd64.AppImage',
  'https://github.com/kafei520-CN/OpenGrok',
  '当前版本 0.4.0'
)
foreach ($text in $needles) {
  if ($html.Contains($text)) {
    Write-Output "OK $text"
  } else {
    Write-Output "MISSING $text"
  }
}
Write-Output "dom_bytes $($html.Length) exit $($proc.ExitCode)"
