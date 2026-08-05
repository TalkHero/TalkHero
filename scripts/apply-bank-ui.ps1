$ErrorActionPreference = "Stop"

$listPath = ".\components\adventure\CampaignMissionList.tsx"
$pagePath = ".\app\(dashboard)\adventure\[campaign]\[mission]\page.tsx"

if (-not (Test-Path -LiteralPath $listPath)) {
  throw "Не знайдено $listPath"
}

if (-not (Test-Path -LiteralPath $pagePath)) {
  throw "Не знайдено $pagePath"
}

$list = Get-Content -LiteralPath $listPath -Raw

if ($list -notmatch "\bLandmark\b") {
  $list = $list -replace "(\s+Hotel,\r?\n)", "`$1  Landmark,`r`n"
}

if ($list -notmatch "bank:\s*Landmark") {
  if ($list -match "const ICONS = \[") {
    $list = $list -replace "const ICONS = \[[\s\S]*?\];", @'
const ICONS_BY_SLUG = {
  "coffee-shop": Coffee,
  underground: TrainFront,
  hotel: Hotel,
  airport: Plane,
  restaurant: Coffee,
  supermarket: Coffee,
  bank: Landmark,
} as const;
'@

    $list = $list -replace "const Icon =\s*ICONS\[index\] \?\?\s*Coffee;", @'
const Icon =
  ICONS_BY_SLUG[
    mission.slug as keyof typeof ICONS_BY_SLUG
  ] ?? Coffee;
'@
  }
}

Set-Content -LiteralPath $listPath -Value $list -Encoding utf8

$page = Get-Content -LiteralPath $pagePath -Raw

if ($page -notmatch "\bLandmark\b") {
  $page = $page -replace "(\s+Hotel,\r?\n)", "`$1  Landmark,`r`n"
}

if ($page -notmatch "bank:\s*Landmark") {
  $page = $page -replace "(\s+airport:\s*Plane,\r?\n)", @'
$1  restaurant: Coffee,
  supermarket: Coffee,
  bank: Landmark,
'@
}

Set-Content -LiteralPath $pagePath -Value $page -Encoding utf8

Write-Host "Bank UI додано успішно." -ForegroundColor Green
