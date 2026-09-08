param([Parameter(Mandatory=$true)][string]$Deployment)
$ErrorActionPreference='Stop'
if($Deployment -notmatch '^https://sparky-english-[a-z0-9]+-rafaelterra-webs-projects\.vercel\.app$'){throw 'Unexpected URL'}
$ids=@('contractions','articles-sound','iron','polite-no','actually','linking','disagree','focus','hedges','repair','irony','scope')
New-Item -ItemType Directory -Force '.voice-qa/tips' | Out-Null
$manifest=@()
foreach($id in $ids){foreach($mascot in @('sparky','pinky')){
 $name="$id-$mascot"
 npx vercel curl "/api/tip-audio/prepare?id=$id&mascot=$mascot" --deployment $Deployment -- --request POST --header '@.env.onboarding-header.local' --silent --show-error --output ".voice-qa/tips/$name.json"
 if($LASTEXITCODE -ne 0){throw "Request failed: $name"}
 $entry=Get-Content -Raw ".voice-qa/tips/$name.json" | ConvertFrom-Json
 if(!$entry.sha256){throw "Generation failed: $name"}
 npx vercel curl $entry.url --deployment $Deployment -- --silent --show-error --output ".voice-qa/tips/$name.wav"
 if((Get-FileHash ".voice-qa/tips/$name.wav" -Algorithm SHA256).Hash.ToLowerInvariant() -ne $entry.sha256){throw "Hash failed: $name"}
 $manifest+=$entry
 Write-Output "Verified $name"
}}
$manifest | ConvertTo-Json -Depth 5 | Set-Content src/lib/content/tip-audio-manifest.json
