#!/usr/bin/env pwsh
<#
.SYNOPSIS
Automated Keycloak setup for ERP Platform
.DESCRIPTION
Creates realm, client, and users via Keycloak REST API
.EXAMPLE
.\setup-keycloak-automated.ps1 -Verbose
#>

param(
    [string]$KeycloakUrl = "http://localhost:8080",
    [string]$AdminUsername = "admin",
    [string]$AdminPassword = "admin123",
    [switch]$Verbose
)

function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Error { Write-Host $args -ForegroundColor Red }

# Test connection
Write-Info "Testing Keycloak connection..."
try {
    $null = Invoke-WebRequest -Uri "$KeycloakUrl/realms/master/.well-known/openid-configuration" -UseBasicParsing -ErrorAction Stop
    Write-Success "[OK] Keycloak is accessible"
} catch {
    Write-Error "[ERROR] Cannot connect to Keycloak at $KeycloakUrl"
    exit 1
}

# Get admin token with retry logic
Write-Info "Getting admin token (attempt 1/3)..."
$tokenResponse = $null
$retries = 0

while ($tokenResponse -eq $null -and $retries -lt 3) {
    try {
        $response = Invoke-WebRequest `
            -Uri "$KeycloakUrl/realms/master/protocol/openid-connect/token" `
            -Method POST `
            -ContentType "application/x-www-form-urlencoded" `
            -Body "client_id=admin-cli&username=$AdminUsername&password=$AdminPassword&grant_type=password" `
            -UseBasicParsing `
            -ErrorAction Stop
        
        $tokenResponse = $response.Content | ConvertFrom-Json
        Write-Success "[OK] Authentication successful"
        break
    } catch {
        $retries++
        if ($retries -lt 3) {
            Write-Warning "Attempt $retries failed, retrying in 2 seconds..."
            Start-Sleep -Seconds 2
        } else {
            Write-Error "[ERROR] Authentication failed after 3 attempts"
            Write-Error "Error: $($_.Exception.Message)"
            exit 1
        }
    }
}

$accessToken = $tokenResponse.access_token

# Helper function for API calls
function Invoke-KeycloakAPI {
    param(
        [string]$Endpoint,
        [string]$Method = "GET",
        [object]$Body = $null
    )
    
    $headers = @{
        Authorization = "Bearer $accessToken"
        "Content-Type" = "application/json"
    }
    
    $params = @{
        Uri = "$KeycloakUrl$Endpoint"
        Method = $Method
        Headers = $headers
        UseBasicParsing = $true
        ErrorAction = "Stop"
    }
    
    if ($Body) {
        $params.Body = if ($Body -is [string]) { $Body } else { $Body | ConvertTo-Json -Depth 10 }
    }
    
    Invoke-WebRequest @params
}

# Create realm
Write-Info "Creating realm 'erp-platform'..."
$realmExists = $false
try {
    $response = Invoke-KeycloakAPI -Endpoint "/admin/realms/erp-platform" -Method "GET"
    Write-Warning "[SKIP] Realm already exists, skipping creation"
    $realmExists = $true
} catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
        try {
            $realmBody = @{
                realm = "erp-platform"
                displayName = "ERP Platform"
                enabled = $true
                sslRequired = "external"
                accessTokenLifespan = 300
            }
            
            $response = Invoke-KeycloakAPI -Endpoint "/admin/realms" -Method "POST" -Body $realmBody
            Write-Success "[OK] Realm created"
        } catch {
            Write-Error "[ERROR] Failed to create realm: $($_.Exception.Message)"
            exit 1
        }
    }
}

# Create client
Write-Info "Creating OAuth2 client 'erp-web'..."
try {
    $clientBody = @{
        clientId = "erp-web"
        name = "ERP Web Application"
        description = "Next.js frontend for ERP platform"
        enabled = $true
        publicClient = $false
        redirectUris = @(
            "http://localhost:3000/api/auth/callback/keycloak",
            "http://localhost:3000"
        )
        webOrigins = @("http://localhost:3000")
        directAccessGrantsEnabled = $true
        standardFlowEnabled = $true
        implicitFlowEnabled = $false
    }
    
    $response = Invoke-KeycloakAPI -Endpoint "/admin/realms/erp-platform/clients" -Method "POST" -Body $clientBody
    Write-Success "[OK] Client created"
} catch {
    if ($_.Exception.Response.StatusCode -eq 409) {
        Write-Warning "[SKIP] Client already exists, skipping creation"
    } else {
        Write-Error "[ERROR] Failed to create client: $($_.Exception.Message)"
        exit 1
    }
}

# Get client details
Write-Info "Retrieving client credentials..."
try {
    $response = Invoke-KeycloakAPI -Endpoint "/admin/realms/erp-platform/clients?clientId=erp-web" -Method "GET"
    $clients = $response.Content | ConvertFrom-Json
    
    if ($clients.Count -eq 0) {
        Write-Error "[ERROR] Client not found"
        exit 1
    }
    
    $client = $clients[0]
    $clientId = $client.id
    
    Write-Success "[OK] Client details retrieved"
    Write-Info "Client UUID: $clientId"
} catch {
    Write-Error "[ERROR] Failed to get client details: $($_.Exception.Message)"
    exit 1
}

# Get client secret
Write-Info "Retrieving client secret..."
try {
    $response = Invoke-KeycloakAPI -Endpoint "/admin/realms/erp-platform/clients/$clientId/client-secret" -Method "GET"
    $secret = ($response.Content | ConvertFrom-Json).value
    Write-Success "[OK] Client secret retrieved"
} catch {
    Write-Warning "[WARN] Could not retrieve client secret: $($_.Exception.Message)"
    $secret = "[NOT_FOUND]"
}

# Create test user
Write-Info "Creating test user 'testuser'..."
try {
    $userBody = @{
        username = "testuser"
        email = "test@example.com"
        firstName = "Test"
        lastName = "User"
        emailVerified = $true
        enabled = $true
    }
    
    $response = Invoke-KeycloakAPI -Endpoint "/admin/realms/erp-platform/users" -Method "POST" -Body $userBody
    $userId = $response.Headers.Location.Split('/')[-1]
    
    Write-Success "[OK] Test user created with ID: $userId"
    
    # Set password
    Write-Info "Setting password for testuser..."
    $passwordBody = @{
        type = "password"
        value = "testuser123"
        temporary = $false
    }
    
    $response = Invoke-KeycloakAPI -Endpoint "/admin/realms/erp-platform/users/$userId/reset-password" -Method "PUT" -Body $passwordBody
    Write-Success "[OK] Password set"
} catch {
    if ($_.Exception.Response.StatusCode -eq 409) {
        Write-Warning "[SKIP] Test user already exists"
    } else {
        Write-Warning "[WARN] Could not create test user: $($_.Exception.Message)"
    }
}

# Summary
Write-Host ""
Write-Success "=========================================="
Write-Success "   Keycloak Setup Complete!"
Write-Success "=========================================="
Write-Host ""
Write-Info "Configuration Details:"
Write-Host "  Keycloak URL: $KeycloakUrl"
Write-Host "  Admin Console: $KeycloakUrl/admin/master/console/"
Write-Host "  Realm: erp-platform"
Write-Host "  Client: erp-web"
Write-Host "  Client Secret: $secret"
Write-Host ""
Write-Info "Test User Credentials:"
Write-Host "  Username: testuser"
Write-Host "  Password: testuser123"
Write-Host ""
Write-Info "Next Steps:"
Write-Host "  1. Create .env.local in erp-web with the client secret"
Write-Host "  2. Install NextAuth: npm install next-auth"
Write-Host "  3. Create auth route handlers"
Write-Host "" 
Write-Info "Documentation: See KEYCLOAK_OAUTH_SETUP.md for detailed NextAuth integration"
Write-Host ""

# Save credentials to file
$credsFile = "keycloak-credentials.json"
@{
    keycloakUrl = $KeycloakUrl
    realm = "erp-platform"
    clientId = "erp-web"
    clientSecret = $secret
    testUser = @{
        username = "testuser"
        password = "testuser123"
    }
} | ConvertTo-Json | Out-File -FilePath $credsFile -Encoding UTF8

Write-Success "Credentials saved to $credsFile (add to .gitignore)"
