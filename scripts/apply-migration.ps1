# Apply a SQL migration to Supabase via the Management API.
# Splits on the "-- =====" section markers so each block is small enough
# for the API's request-size limit.
#
# Usage:
#   .\scripts\apply-migration.ps1 -File "supabase\migrations\APPLY_THESE_NEXT.sql"

param(
  [Parameter(Mandatory = $true)] [string] $File,
  [string] $Ref = "hoqtyaebrfcsjlwbonts",
  [string] $Pat = $env:SUPABASE_PAT
)

if (-not $Pat) {
  Write-Error "Provide -Pat or set `$env:SUPABASE_PAT"
  exit 1
}

$sql = Get-Content -LiteralPath $File -Raw
if (-not $sql) {
  Write-Error "Empty file: $File"
  exit 1
}

# Split heuristic: blank-line-separated paragraphs. A 'paragraph' is a
# logical SQL chunk. We then re-coalesce adjacent paragraphs until we hit
# a soft cap of ~6,000 chars per request.
$paragraphs = $sql -split "(?ms)(?:\r?\n){2,}"
$batches = @()
$cur = ""
$cap = 6000
foreach ($p in $paragraphs) {
  $trimmed = $p.Trim()
  if (-not $trimmed) { continue }
  if (($cur.Length + $trimmed.Length + 2) -gt $cap -and $cur.Length -gt 0) {
    $batches += $cur
    $cur = ""
  }
  if ($cur.Length -gt 0) { $cur += "`n`n" }
  $cur += $trimmed
}
if ($cur.Length -gt 0) { $batches += $cur }

Write-Host ("Total: {0} batches, source {1} chars" -f $batches.Count, $sql.Length)

$uri = "https://api.supabase.com/v1/projects/$Ref/database/query"
$ok = 0; $fail = 0
for ($i = 0; $i -lt $batches.Count; $i++) {
  $b = $batches[$i]
  $body = @{ query = $b } | ConvertTo-Json -Compress -Depth 5
  try {
    $r = Invoke-WebRequest -Uri $uri -Method POST `
      -Headers @{"Authorization"="Bearer $Pat"; "User-Agent"="rai-tool"} `
      -Body $body -ContentType "application/json" -UseBasicParsing -TimeoutSec 60 -EA Stop
    $ok++
    Write-Host ("  [{0,2}/{1}] OK   {2} bytes" -f ($i+1), $batches.Count, $b.Length)
  } catch {
    $fail++
    $errBody = ""
    if ($_.Exception.Response) {
      try { $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream()); $errBody = $reader.ReadToEnd() } catch {}
    }
    Write-Host ("  [{0,2}/{1}] FAIL {2} bytes -- {3}" -f ($i+1), $batches.Count, $b.Length, $errBody)
    Write-Host ("       First 200 chars: {0}" -f $b.Substring(0, [Math]::Min(200, $b.Length)))
  }
}
Write-Host ("Done: $ok succeeded, $fail failed")
exit ([int]($fail -gt 0))
