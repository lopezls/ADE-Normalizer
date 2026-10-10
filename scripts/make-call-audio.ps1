# Makes synthetic two-voice audio from a call script file (content/scripts/<name>.json).
# The script's "voices" say which Windows voice plays which speaker. All speech is fictional.
# Run from the project root:
#   powershell -File scripts/make-call-audio.ps1 john-smith-call
# Output: public/demo/<name>.wav (16 kHz, 16-bit, mono)
param([Parameter(Mandatory = $true)][string]$Name)
Add-Type -AssemblyName System.Speech

$root = Split-Path -Parent $PSScriptRoot
$script = Get-Content (Join-Path $root "content/scripts/$Name.json") -Raw | ConvertFrom-Json
$outDir = Join-Path $root "public/demo"
New-Item -ItemType Directory -Force $outDir | Out-Null
$tmp = Join-Path $env:TEMP "ade-call-audio-$Name"
New-Item -ItemType Directory -Force $tmp | Out-Null

$format = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(16000, [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen, [System.Speech.AudioFormat.AudioChannel]::Mono)
$voices = @{ pharmacist = $script.voices.pharmacist; patient = $script.voices.patient }

# Reads the raw PCM bytes out of a wav file by finding its "data" chunk.
function Get-Pcm([string]$path) {
  $b = [System.IO.File]::ReadAllBytes($path)
  $i = 12
  while ($i -lt $b.Length - 8) {
    $id = [System.Text.Encoding]::ASCII.GetString($b, $i, 4)
    $len = [BitConverter]::ToInt32($b, $i + 4)
    if ($id -eq "data") { return $b[($i + 8)..($i + 7 + $len)] }
    $i += 8 + $len
  }
  throw "no data chunk in $path"
}

$pcm = New-Object System.IO.MemoryStream
$gap = New-Object byte[] (16000 * 2 * 0.9)   # 0.9 s between turns so each turn is clearly separate

foreach ($line in $script.lines) {
  $file = Join-Path $tmp ("line-{0:D2}.wav" -f $line.turn)
  $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
  $synth.SelectVoice($voices[$line.speaker])
  $synth.Rate = -1   # a touch slower than default, easier to follow from a phone speaker
  $synth.SetOutputToWaveFile($file, $format)
  $synth.Speak($line.text)
  $synth.Dispose()
  $bytes = Get-Pcm $file
  $pcm.Write($bytes, 0, $bytes.Length)
  $pcm.Write($gap, 0, $gap.Length)
}

# Wrap the joined audio in a wav header.
$data = $pcm.ToArray()
$out = New-Object System.IO.MemoryStream
$w = New-Object System.IO.BinaryWriter($out)
$w.Write([System.Text.Encoding]::ASCII.GetBytes("RIFF")); $w.Write([int](36 + $data.Length))
$w.Write([System.Text.Encoding]::ASCII.GetBytes("WAVEfmt ")); $w.Write([int]16); $w.Write([int16]1); $w.Write([int16]1)
$w.Write([int]16000); $w.Write([int]32000); $w.Write([int16]2); $w.Write([int16]16)
$w.Write([System.Text.Encoding]::ASCII.GetBytes("data")); $w.Write([int]$data.Length); $w.Write($data)
$w.Flush()
$target = Join-Path $outDir "$Name.wav"
[System.IO.File]::WriteAllBytes($target, $out.ToArray())
"{0}  {1:N1} MB  {2:N0} s" -f $target, ($data.Length / 1MB), ($data.Length / 32000)
