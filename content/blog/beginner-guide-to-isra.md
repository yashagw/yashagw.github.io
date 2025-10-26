+++
title = "Beginner Guide to IRSA"
date = 2025-10-26
taxonomies = { tags = ["Authentication", "Authorization", "Kubernetes", "AWS"] }
+++

# What is IRSA?

**IAM Roles for Service Accounts (IRSA)** allows Kubernetes pods to securely access AWS services without storing credentials. Instead of using AWS access keys or node-level IAM roles, IRSA enables fine-grained access control at the pod level.

> **Prerequisites**: This guide assumes familiarity with [OIDC basics](https://yashagw.github.io/blog/refresher-to-oidc/) and [AWS OIDC federation](https://yashagw.github.io/blog/aws-with-custom-idp/). If you're new to these concepts, I recommend reading those articles first.

## Why Use IRSA?

- **Security**: No AWS access keys stored in Kubernetes
- **Granularity**: Pod-level permissions instead of node-level
- **Simplicity**: No secret management required

## What We'll Explore

In this guide, you'll learn:

1. **Setup Process**: Step-by-step instructions to configure IRSA from scratch
2. **Technical Deep Dive**: How the authentication flow works internally between Kubernetes and AWS
3. **Security Mechanisms**: The multi-layered validation process that ensures secure access

By the end, you'll understand not just how to implement IRSA, but also why it's secure and how it works under the hood.

---

## Setup Guide

### Step 1: Enable EKS OIDC Provider

Get your cluster's OIDC issuer URL:

```bash
aws eks describe-cluster \
  --name my-cluster \
  --region us-east-1 \
  --query "cluster.identity.oidc.issuer" \
  --output text
```

Register the OIDC provider:

```bash
aws iam create-open-id-connect-provider \
  --url https://oidc.eks.us-east-1.amazonaws.com/id/EXAMPLED539D4633E53DE1B716D3041E \
  --client-id-list sts.amazonaws.com
```

### Step 2: Create IAM Role

Create an IAM role with this trust policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::<AWS_ACCOUNT_ID>:oidc-provider/oidc.eks.us-east-1.amazonaws.com/id/EXAMPLED539D4633E53DE1B716D3041E"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "oidc.eks.us-east-1.amazonaws.com/id/EXAMPLED539D4633E53DE1B716D3041E:sub": "system:serviceaccount:demo:demo-sa",
          "oidc.eks.us-east-1.amazonaws.com/id/EXAMPLED539D4633E53DE1B716D3041E:aud": "sts.amazonaws.com"
        }
      }
    }
  ]
}
```

Attach the AWS permissions your application needs.

### Step 3: Create Service Account

```bash
# Create a namespace for our demo
kubectl create namespace demo

# Create the service account
kubectl create serviceaccount demo-sa -n demo

# Annotate the service account with the IAM role ARN
kubectl annotate serviceaccount \
  -n demo demo-sa \
  eks.amazonaws.com/role-arn=arn:aws:iam::<AWS_ACCOUNT_ID>:role/DemoPodRole
```

### Step 4: Deploy Pod

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: s3-accessor
  namespace: demo
spec:
  serviceAccountName: demo-sa
  containers:
    - name: aws-cli
      image: amazon/aws-cli
      command: ["sh", "-c", "aws s3 ls"]
```

---

## How IRSA Works Internally

### Detailed Authentication Flow

The IRSA process involves both Kubernetes and AWS components working together to provide secure, temporary credentials to pods.

#### Kubernetes Cluster Side

1. **Pod Configuration**: When you deploy a pod with a service account that has the `eks.amazonaws.com/role-arn` annotation, Kubernetes knows this pod needs AWS credentials.

2. **Service Account Token Generation**: The Kubernetes API Server generates a JWT token signed by the cluster's OIDC private key. This token contains:
   - **Subject (sub)**: `system:serviceaccount:<namespace>:<service-account-name>`
   - **Audience (aud)**: `sts.amazonaws.com`
   - **Issuer (iss)**: Your cluster's OIDC issuer URL
   - **Expiration**: Token validity period

3. **Token Mounting**: Kubernetes automatically mounts this JWT token at `/var/run/secrets/kubernetes.io/serviceaccount/token` inside the pod.

4. **Application Request**: When your application needs to make AWS API calls, the AWS SDK automatically detects the mounted token.

#### AWS Side

5. **STS AssumeRoleWithWebIdentity Call**: The AWS SDK sends a request to AWS Security Token Service (STS) using the `AssumeRoleWithWebIdentity` API, including:
   - The JWT token from the mounted volume
   - The IAM role ARN (from the service account annotation)

6. **JWT Signature Verification**: AWS STS performs several security checks:
   - **Fetches Public Keys**: Retrieves the OIDC provider's public keys from the JWKS endpoint
   - **Verifies Signature**: Ensures the JWT was signed by your cluster's OIDC private key
   - **Validates Claims**: Checks token structure and required claims

7. **Trust Policy Validation**: AWS examines the IAM role's trust policy to ensure:
   - The OIDC provider is listed as a trusted entity
   - The token's subject matches the allowed service account
   - The audience claim is correct

8. **Credential Issuance**: If all validations pass, STS issues temporary AWS credentials:
   - Access Key ID
   - Secret Access Key  
   - Session Token
   - Expiration time (typically 1 hour)

9. **AWS Resource Access**: Your application uses these temporary credentials to access AWS resources according to the IAM role's permissions.

### Key Security Validations

During the STS `AssumeRoleWithWebIdentity` call, AWS validates:

- **Signature Verification**: Token must be signed by your cluster's OIDC private key
- **Subject (sub)**: Must match `system:serviceaccount:<namespace>:<service-account-name>`
- **Audience (aud)**: Must be `sts.amazonaws.com`
- **Issuer (iss)**: Must be your cluster's OIDC issuer URL
- **Expiration (exp)**: Token must not be expired
- **Trust Policy**: IAM role must trust your cluster's OIDC provider

This multi-layered validation ensures that only the specific service account in the specific namespace can assume the IAM role, providing fine-grained access control.

---

## Conclusion

IRSA provides secure, pod-level AWS access without managing credentials. It's essential for production Kubernetes workloads that need AWS integration. Start with simple use cases like S3 access and expand from there.
