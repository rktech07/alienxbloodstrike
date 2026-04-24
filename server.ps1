$port = 8080
$dir  = $PSScriptRoot
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "Server running at http://localhost:$port/"

$mimeTypes = @{
    ".html" = "text/html"
    ".js"   = "application/javascript"
    ".css"  = "text/css"
    ".json" = "application/json"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".gif"  = "image/gif"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
    ".woff" = "font/woff"
    ".woff2"= "font/woff2"
    ".ttf"  = "font/ttf"
    ".webp" = "image/webp"
}

try {
    while ($listener.IsListening) {
        $ctx  = $listener.GetContext()
        $req  = $ctx.Request
        $res  = $ctx.Response
        $path = $req.Url.LocalPath
        $res.AddHeader("Access-Control-Allow-Origin","*")
        $res.AddHeader("Access-Control-Allow-Methods","GET, POST, OPTIONS")
        $res.AddHeader("Access-Control-Allow-Headers","Content-Type")

        if ($req.HttpMethod -eq "OPTIONS") {
            $res.StatusCode = 204
            $res.Close()
            continue
        }

        if ($req.HttpMethod -eq "POST" -and $path -eq "/save-config") {
            try {
                $reader  = New-Object System.IO.StreamReader($req.InputStream)
                $body    = $reader.ReadToEnd()
                $reader.Close()
                $cfgPath = Join-Path $dir "config.json"
                [System.IO.File]::WriteAllText($cfgPath, $body, [System.Text.Encoding]::UTF8)
                $bytes = [System.Text.Encoding]::UTF8.GetBytes('{"ok":true}')
                $res.ContentType     = "application/json"
                $res.ContentLength64 = $bytes.Length
                $res.OutputStream.Write($bytes, 0, $bytes.Length)
            } catch {
                $errMsg = $_.Exception.Message
                $bytes  = [System.Text.Encoding]::UTF8.GetBytes("{`"ok`":false,`"error`":`"$errMsg`"}")
                $res.StatusCode      = 500
                $res.ContentType     = "application/json"
                $res.ContentLength64 = $bytes.Length
                $res.OutputStream.Write($bytes, 0, $bytes.Length)
            }
            $res.Close()
            continue
        }

        if ($path -eq "/") { $path = "/index.html" }
        $localPath = Join-Path $dir $path.TrimStart("/").Replace("/","\")

        if (-not (Test-Path $localPath -PathType Leaf) -and (Test-Path "$localPath.html" -PathType Leaf)) {
            $localPath = "$localPath.html"
        }

        if (Test-Path $localPath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($localPath).ToLower()
            $res.ContentType = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { "application/octet-stream" }
            $bytes = [System.IO.File]::ReadAllBytes($localPath)
            $res.ContentLength64 = $bytes.Length
            $res.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $res.StatusCode  = 404
            $bytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $res.ContentLength64 = $bytes.Length
            $res.OutputStream.Write($bytes, 0, $bytes.Length)
        }
        $res.Close()
    }
} finally {
    $listener.Stop()
}
