#!/usr/bin/env pwsh
<#
.SYNOPSIS
Setup Keycloak realm and OAuth2 client for erp-web
.DESCRIPTION
Creates the erp-platform realm and configures OAuth2 client
#>

param(
    [string]$KeycloakUrl = "http://localhost:8080",
    [string]$AdminUser = "admin",
    [string]$AdminPassword = "admin123"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Keycloak Setup for ERP Platform" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Get Admin Token
Write-Host "Step 1: Authenticating..." -ForegroundColor Yellow
try {
    $tokenUrl = "$KeycloakUrl/realms/master/protocol/openid-connect/token"
    $tokenBody = "client_id=admin-cli&username=$AdminUser&password=$AdminPassword&grant_type=password"
    
    $tokenResponse = Invoke-WebRequest `
        -Uri $tokenUrl `
        -Method POST `
        -ContentType "application/x-www-form-urlencoded" `
        -Body $tokenBody `
        -UseBasicParsing `
        -ErrorAction Stop
    
    $tokenData = $tokenResponse.Content | ConvertFrom-Json
    $accessToken = $tokenData.access_token
    
    if (-not $accessToken) {
        throw "No access token in response"
    }
    
    Write-Host "✅ Successfully authenticated" -ForegroundColor Green
} catch {
    Write-Host "❌ Authentication failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Create Realm
Write-Host ""
Write-Host "Step 2: Creating realm 'erp-platform'..." -ForegroundColor Yellow
try {
    $realmData = @{
        realm = "erp-platform"
        displayName = "ERP Platform"
        enabled = $true
        sslRequired = "external"
        accessTokenLifespan = 300
        accessTokenLifespanForImplicitFlow = 900
        accessCodeLifespan = 60
        accessCodeLifespanLogin = 1800
        actionTokenGeneratedByAdminLifespan = 43200
        actionTokenGeneratedByUserLifespan = 300
    } | ConvertTo-Json

    $realmUrl = "$KeycloakUrl/admin/realms"
    
    $realmResponse = Invoke-WebRequest `
        -Uri $realmUrl `
        -Method POST `
        -ContentType "application/json" `
        -Body $realmData `
        -Headers @{ Authorization = "Bearer $accessToken" } `
        -UseBasicParsing `
        -ErrorAction Stop
    
    Write-Host "✅ Realm 'erp-platform' created" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode -eq 409) {
        Write-Host "⚠️  Realm already exists, continuing..." -ForegroundColor Yellow
    } else {
        Write-Host "❌ Realm creation failed: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

# Step 3: Create OAuth2 Client
Write-Host ""
Write-Host "Step 3: Creating OAuth2 client 'erp-web'..." -ForegroundColor Yellow
try {
    $clientData = @{
        clientId = "erp-web"
        name = "ERP Web Application"
        description = "Next.js frontend for ERP platform"
        enabled = $true
        publicClient = $false
        redirectUris = @(
            "http://localhost:3000/api/auth/callback/keycloak",
            "http://localhost:3000"
        )
        webOrigins = @(
            "http://localhost:3000"
        )
        allowedOrigins = @(
            "http://localhost:3000"
        )
        defaultClientScopes = @(
            "web-origins",
            "profile",
            "email",
            "roles"
        )
        optionalClientScopes = @(
            "address",
            "phone",
            "offline_access"
        )
        directAccessGrantsEnabled = $true
        standardFlowEnabled = $true
        implicitFlowEnabled = $false
        serviceAccountsEnabled = $false
        authorizationServicesEnabled = $false
        attributes = @{
            "saml.assertion.signature" = "false"
            "saml.force.post.binding" = "false"
            "saml_single_logout_service_url_post" = ""
            "saml_single_logout_service_url_redirect" = ""
        }
    } | ConvertTo-Json -Depth 10

    $clientUrl = "$KeycloakUrl/admin/realms/erp-platform/clients"
    
    $clientResponse = Invoke-WebRequest `
        -Uri $clientUrl `
        -Method POST `
        -ContentType "application/json" `
        -Body $clientData `
        -Headers @{ Authorization = "Bearer $accessToken" } `
        -UseBasicParsing `
        -ErrorAction Stop
    
    Write-Host "✅ Client 'erp-web' created" -ForegroundColor Green
} catch {
    Write-Host "❌ Client creation failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 4: Get Client Credentials
Write-Host ""
Write-Host "Step 4: Retrieving client credentials..." -ForegroundColor Yellow
try {
    # First get the client ID
    $clientsUrl = "$KeycloakUrl/admin/realms/erp-platform/clients?clientId=erp-web"
    $clientsResponse = Invoke-WebRequest `
        -Uri $clientsUrl `
        -Method GET `
        -Headers @{ Authorization = "Bearer $accessToken" } `
        -UseBasicParsing `
        -ErrorAction Stop
    
    $clients = $clientsResponse.Content | ConvertFrom-Json
    if ($clients.Count -eq 0) {
        throw "Client not found"
    }
    
    $clientId = $clients[0].id
    $clientSecret = $clients[0].secret
    
    Write-Host "✅ Client credentials retrieved" -ForegroundColor Green
    Write-Host ""
    Write-Host "Client ID: $clientId" -ForegroundColor Cyan
    Write-Host "Client Secret: $clientSecret" -ForegroundColor Cyan
} catch {
    Write-Host "⚠️  Could not retrieve credentials: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Step 5: Create a test user
Write-Host ""
Write-Host "Step 5: Creating test user 'testuser'..." -ForegroundColor Yellow
try {
    $userData = @{
        username = "testuser"
        email = "test@example.com"
        firstName = "Test"
        lastName = "User"
        emailVerified = $true
        enabled = $true
        credentials = @(
            @{
                type = "password"
                value = "testuser123"
                temporary = $false
            }
        )
    } | ConvertTo-Json -Depth 10

    $userUrl = "$KeycloakUrl/admin/realms/erp-platform/users"
    
    $userResponse = Invoke-WebRequest `
        -Uri $userUrl `
        -Method POST `
        -ContentType "application/json" `
        -Body $userData `
        -Headers @{ Authorization = "Bearer $accessToken" } `
        -UseBasicParsing `
        -ErrorAction Stop
    
    Write-Host "✅ Test user 'testuser' created (password: testuser123)" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode -eq 409) {
        Write-Host "⚠️  Test user already exists" -ForegroundColor Yellow
    } else {
        Write-Host "⚠️  Could not create test user: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Keycloak Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Admin Console: http://localhost:8080/admin/master/console/" -ForegroundColor Cyan
Write-Host "Realm: erp-platform" -ForegroundColor Cyan
Write-Host "Client: erp-web" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test User: testuser / testuser123" -ForegroundColor Cyan
Write-Host ""
