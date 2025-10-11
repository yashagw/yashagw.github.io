+++
title = "AWS Authentication with Custom Identity Provider (OIDC)"
date = 2025-10-11
taxonomies = { tags = ["AWS", "Authentication", "OIDC", "Security", "IAM"] }
+++

## Introduction

Imagine you have an AWS account and your company already uses Google Workspace, Okta, or Auth0 for employee authentication. Instead of creating separate AWS IAM users for each employee (which becomes a nightmare to manage), you want your employees to use their existing company credentials to access AWS resources.

This is exactly what AWS OIDC federation enables. AWS supports federated authentication using OpenID Connect (OIDC) with external Identity Providers (IDPs). This allows you to authenticate users through your existing identity system and grant them temporary AWS credentials without managing separate AWS users.

**What you'll learn**: How to set up OIDC federation so your employees can use their company credentials (Google, Okta, Auth0, etc.) to access AWS resources without creating individual AWS accounts.

**Prerequisites**:
- OIDC-compliant Identity Provider (IDP) like Okta, Auth0, Google Workspace, or Keycloak
- AWS CLI configured with appropriate permissions
- Basic understanding of OIDC and JWT tokens

## Registering Custom IDP in AWS IAM

Before registering your IDP in AWS, you need to configure your Identity Provider (IDP) to work with AWS:

- **Configure your IDP**
    - From your IDP (identity system like Okta, Auth0, or Keycloak), you need to get the **IDP issuer URL**.
    - Example: `https://idp.example.com` (must have `.well-known/openid-configuration` and JWKS endpoints).
    - You also need to **register AWS as a client** in your IDP and get the **Client ID** for it.
    - The Client ID identifies your application to the IDP.
    - When your IDP issues a JWT token, it includes this Client ID as the `aud` (audience) claim.

- **Register in AWS**
```bash
aws iam create-open-id-connect-provider \
  --url https://idp.example.com \
  --client-id-list aws-access-client \
  --thumbprint-list <CA_CERT_THUMBPRINT>
```

AWS now knows your IDP and will only trust tokens issued by it.

## Auth Flow

1. **User logs in to the Custom IDP**
    - The user authenticates against your external Identity Provider (e.g., Okta, Keycloak, Auth0).
    - The IDP returns an **ID Token (JWT)** that proves the user's identity.
2. **User calls AWS STS with the token**
    - The user sends this ID Token to AWS STS using the API `AssumeRoleWithWebIdentity`.
    - You must specify the role you want to assume using `--role-arn`.

    ```bash
    aws sts assume-role-with-web-identity \
    --role-arn arn:aws:iam::<AWS_ACCOUNT_ID>:role/MyOIDCRole \
    --role-session-name ExampleSession \
    --web-identity-token file://idp_token.jwt \
    --duration-seconds 3600
    ```

3. **AWS validates the token and trust policy**
    
    3.1 **AWS checks the token**
        - AWS uses the OIDC provider configuration (which you registered in IAM) to get the public keys from the IDP.
        - AWS checks:
            - Token signature (is it issued by trusted IDP?)
            - Token claims (`aud`, `sub`, `iss`, `exp`)
    
    3.2 **AWS checks the IAM Role Trust Policy**
        - AWS looks at the role's trust policy to see if this token is allowed to assume the role.
        - The trust policy says: "Allow anyone to assume this role if they have a token from this specific IDP with these specific claims."
        
    Example trust policy:
    ```json
    {
        "Version": "2012-10-17",
        "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
            "Federated": "arn:aws:iam::<account_id>:oidc-provider/idp.example.com"
            },
            "Action": "sts:AssumeRoleWithWebIdentity",
            "Condition": {
            "StringEquals": {
                "idp.example.com:aud": "aws-access-client",
                "idp.example.com:sub": "user-123"
            }
            }
        }
        ]
    }
    ```
        
    **What this means**: "Allow `AssumeRoleWithWebIdentity` if the token comes from `idp.example.com` AND the token's `aud` claim equals `aws-access-client` AND the token's `sub` claim equals `user-123`."
        
    **Other examples**:
    - **All users**: `"idp.example.com:sub": "*"` (any user from this IDP)
    - **Group-based**: `"idp.example.com:sub": "group:developers:*"` (any user in developers group)
    - **Custom claims**: `"idp.example.com:custom:department": "engineering"` (users with engineering department claim)

4. **AWS returns temporary credentials**
    - If the token and trust policy are valid, AWS returns short-lived AWS credentials
    
## AWS STS Response

**Response example**:
```json
{
  "Credentials": {
    "AccessKeyId": "ASIAIOSFODNN7EXAMPLE",
    "SecretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    "SessionToken": "FwoGZXIvYXdzEBYaD...",
    "Expiration": "2025-01-10T12:00:00Z"
  }
}
```

## Benefits

- **Centralized identity management**: Use existing IDP
- **Enhanced security**: Temporary credentials with automatic expiration  
- **Reduced overhead**: No need to manage AWS IAM users
- **Flexible authorization**: Leverage IDP's group and attribute management
