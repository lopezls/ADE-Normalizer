# Makes synthetic audio of Demo Call 1 with two Windows voices (pharmacist = David, patient = Zira).
# Run from the project root:  powershell -File scripts/make-demo-audio.ps1
# Output: public/demo/demo-call-1.wav (16 kHz, 16-bit, mono). All speech is fictional.
Add-Type -AssemblyName System.Speech

$root = Split-Path -Parent $PSScriptRoot
$script = Get-Content (Join-Path $root "content/scripts/demo-call-1.json") -Raw | ConvertFrom-Json
$outDir = Join-Path $root "public/demo"
New-Item -ItemType Directory -Force $outDir | Out-Null
$tmp = Join-Path $env:TEMP "ade-demo-audio"
New-Item -ItemType Directory -Force $tmp | Out-Null

$format = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(16000, [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen, [System.Speech.AudioFormat.AudioChannel]::Mono)
$voices = @{ pharmacist = "Microsoft David Desktop"; patient = "Microsoft Zira Desktop" }

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
$silence = New-Object byte[] (16000 * 2 * 0.6)   # 0.6 s between turns

foreach ($line in $script.lines) {
  $file = Join-Path $tmp ("line-{0:D2}.wav" -f $line.turn)
  $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
  $synth.SelectVoice($voices[$line.speaker])
  $synth.Rate = 0
  $synth.SetOutputToWaveFile($file, $format)
  $synth.Speak($line.text)
  $synth.Dispose()
  $bytes = Get-Pcm $file
  $pcm.Write($bytes, 0, $bytes.Length)
  $pcm.Write($silence, 0, $silence.Length)
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
$target = Join-Path $outDir "demo-call-1.wav"
[System.IO.File]::WriteAllBytes($target, $out.ToArray())
"{0}  {1:N1} MB  {2:N0} s" -f $target, ($data.Length / 1MB), ($data.Length / 32000)
