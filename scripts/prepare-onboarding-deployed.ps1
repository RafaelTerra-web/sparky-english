param([Parameter(Mandatory=$true)][string]$Deployment)
$ErrorActionPreference='Stop'
if ($Deployment -notmatch '^https://sparky-english-[a-z0-9]+-rafaelterra-webs-projects\.vercel\.app$') { throw 'Unexpected deployment URL' }
$assetIds = @('welcome','name','age','mascot','level','beforeName','afterName','fallback')
foreach ($level in @('a1','a2','b1','b2','c1','c2')) { foreach ($position in @(11,12)) { $assetIds += "placement-v1-$level-$position" } }
$reviewDir=Join-Path $PWD '.voice-qa/onboarding'
New-Item -ItemType Directory -Force -Path $reviewDir | Out-Null
$manifest=@()
foreach($id in $assetIds){
 $metadataPath=Join-Path $reviewDir "$id.json"
 & npx vercel curl "/api/onboarding/prepare?id=$id" --deployment $Deployment -- --request POST --header '@.env.onboarding-header.local' --silent --show-error --output $metadataPath
 if($LASTEXITCODE -ne 0){throw "Generation failed: $id"}
 $entry=Get-Content -Raw -LiteralPath $metadataPath | ConvertFrom-Json
 if(!$entry.sha256){throw "Generation failed: $id — $($entry.error)"}
 & npx vercel curl "/audio/onboarding/$id.wav" --deployment $Deployment -- --silent --show-error --output (Join-Path $reviewDir "$id.wav")
 if($LASTEXITCODE -ne 0){throw "Download failed: $id"}
 $actual=(Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $reviewDir "$id.wav")).Hash.ToLowerInvariant()
 if($actual -ne $entry.sha256){throw "Hash mismatch: $id"}
 $manifest += $entry
 Write-Output "Verified $id ($($entry.bytes) bytes)"
}
$manifest | ConvertTo-Json -Depth 5 | Set-Content -Encoding utf8 -LiteralPath 'src/lib/onboarding-audio-manifest.json'
