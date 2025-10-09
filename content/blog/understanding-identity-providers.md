+++
title = "Understanding Identity Providers (IdP)"
date = 2025-10-09
description = "A comprehensive guide to Identity Providers, authentication flows, and token verification"
taxonomies = { tags = ["Authentication", "Authorization", "Security"] }
+++

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
  response_type=code    # or "id_token" for implicit
  &client_id=CLIENT_ID
  &redirect_uri=https://clientapp.com/callback
  &scope=openid%20profile%20email
  &state=RANDOM_STATE
  &nonce=RANDOM_NONCE
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
