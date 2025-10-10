+++
title = "Refresher to OIDC"
date = 2025-10-10
taxonomies = { tags = ["Authentication", "Authorization", "Security"] }
+++

## What is OIDC?

OpenID Connect (OIDC) is an identity layer built on top of OAuth 2.0 that enables clients to verify the identity of end-users based on the authentication performed by an authorization server. It provides a simple way to obtain basic profile information about users in an REST-like manner.

OIDC extends OAuth 2.0 with an ID Token (JWT) that contains user identity information, making it easier for applications to authenticate users without handling passwords directly. It's widely used for single sign-on (SSO) and federated identity across web and mobile applications.

**Official Specification:** [OpenID Connect Core 1.0 (RFC)](https://openid.net/specs/openid-connect-core-1_0.html)

## What is Identity Provider (IdP)

Service that authenticates users and issues identity tokens (e.g., Keycloak, Okta, Google).

## Auth Flow

```text
User                     Client App                      Identity Provider (IDP)
  |                          |                                   |
  |----(1) Request login --->|                                   |
  |                          |                                   |
  |                          | ----(2) Redirect to Auth URL ---->|
  |                          |                                   |
  |                          | <----(2) Show Login Screen -------|
  |                          |                                   |
  |                          | <---(3) Redirect with Auth Code --|
  |                          |                                   |
  |                          | --(4) Exchange Code for Tokens -->|
  |                          |                                   |
  |                          | <---(4) Return ID & Access Token--|
  |                          |                                   |
  |                          | ----(5) Validate ID Token ------->|
  |                          |                                   |
  |                          | ---(6) (Optional) Call UserInfo ->|
  |                          |                                   |
  |                          | <----(6) Return User Profile -----|
  |                          |                                   |
  ----(7) Grant Access ----->|                                   |
  |                          |                                   |
```

## Important IDP Endpoints

### 1. Authorization Endpoint
- The client app redirects the user's browser here to start login.
- The IDP shows the login screen, collects credentials, and asks for consent.
- If successful, it returns an **authorization code** (a temporary one-time code).

### 2. Token Endpoint
- The client app exchanges the authorization code for tokens via a backend call.
- The IDP returns:
    - **ID Token** (JWT containing user identity claims)
    - **Access Token** (to access protected resources, optional)
    - **Refresh Token** (to renew tokens without re-login, optional)

### 3. UserInfo Endpoint
- The client app can request additional user info using the access token.
- Returns profile details like name, email, and picture.

### 4. JWKS Endpoint
- Publishes the IDP's public keys for verifying token signatures.
- Enables clients to verify tokens were signed by the trusted IDP and not tampered with.

## How Token Verification Works

When the client app receives an ID Token, it performs these checks before trusting the user:

### 1. Signature Verification
- Fetches public keys from the JWKS endpoint.
- Verifies the token's signature to ensure it's genuine.

### 2. Claims Validation
- Checks `iss` (issuer) to confirm the IDP.
- Checks `aud` (audience) to confirm the token is meant for the client.
- Checks `exp` (expiration) to ensure the token is valid.
- Checks `iat` (issued at) for token freshness.

### 3. Token Structure
- Validates the token format and required claims.

## Authorization Request URL

```plaintext
https://idp.example.com/oauth2/authorize?
  response_type=code&         # What type of response is expected (it could be code or id)
  client_id=CLIENT_ID&        # Client app’s unique ID
  redirect_uri=https://clientapp.com/callback&   # Where to send user after login
  scope=openid profile email&  # What user info your app needs
  state=xyz123&               # Random value to prevent CSRF attacks & link                                      request-response
  nonce=abc789                # Random value to prevent replay attacks on ID 
```


### Important Params

**State** – Protecting the Login Request
- **Purpose:** Stops **Cross-Site Request Forgery (CSRF)** attacks.
- The client sends a random `state` value when starting login.
- When the IDP redirects back, it includes the same `state`.
- The client checks if it matches → ensures the response belongs to the same request.

**Nonce** – Protecting the Token
- **Purpose:** Stops **replay attacks** on ID Tokens.
- The client sends a random `nonce`.
- The IDP puts it **inside the ID Token**.
- The client verifies the `nonce` inside the token matches what it sent → ensures the token is fresh and not reused.

### Common OIDC Scopes

- **`openid`** - Required for OIDC, enables ID token issuance
- **`profile`** - Basic profile info (name, picture, etc.)
- **`email`** - User's email address
- **`address`** - User's physical address
- **`phone`** - User's phone number

## Security Best Practices

1. **Always use HTTPS** for all OIDC communications
2. **Validate redirect URIs** - only allow pre-registered URLs
3. **Use PKCE** (Proof Key for Code Exchange) for public clients
4. **Implement proper token storage** - secure, httpOnly cookies preferred
5. **Set appropriate token lifetimes** - balance security vs UX
6. **Monitor for suspicious activity** - unusual login patterns, token abuse