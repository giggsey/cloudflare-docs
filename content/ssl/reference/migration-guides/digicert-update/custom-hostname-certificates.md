---
pcx_content_type: reference
title: SSL for SaaS
weight: 3
layout: wide
meta:
    title: SSL for SaaS certificates - DigiCert migration guide
---

# SSL for SaaS

Starting on **September 7, 2023**, new Cloudflare accounts will not have the option to choose DigiCert as a certificate authority (CA) for [SSL for SaaS certificates](/cloudflare-for-platforms/cloudflare-for-saas/security/certificate-management/).

On **October 18, 2023**, Cloudflare will stop using DigiCert as an issuing certificate authority (CA) for new SSL for SaaS certificates. This will not affect existing SSL for SaaS certificates.

{{<Aside type="warning">}}

The SSL for SaaS renewals offboarding has been postponed and started gradually rolling out on November 1, 2023.

{{</Aside>}}

On **November 1, 2023**, Cloudflare will stop using DigiCert as the CA for SSL for SaaS certificate renewals. This will not affect existing SSL for SaaS certificates, but only certificate renewals.

The default CA - for API orders that do not specify `certificate_authority` - and the CA used for certificate renewals will shift to either Let's Encrypt or Google Trust Services.

{{<Aside type="warning">}}

{{<render file="_digicert-caa-warning.md">}}

{{</Aside>}}

## Summary of changes

This table provides a summary of the differences between DigiCert and our other CAs.

{{<table-wrap>}}
| Area | DigiCert | Other CAs | Actions required |
| --- | --- | --- | --- |
| Domain Control <br/> Validation (DCV) | To get a certificate issued for a wildcard custom hostname, one TXT DCV record is required to complete Domain Control Validation. | To get a certificate issued for a wildcard custom hostname, two TXT DCV records will be required to complete validation. | [Wildcard custom hostnames](#wildcard-custom-hostnames) will require additional DCV tokens. [Non-wildcard custom hostnames](#non-wildcard-custom-hostnames) will automatically renew as long as the hostname is proxying through Cloudflare. |
| API | Customers can choose `“digicert”` as the issuing CA when using the [custom hostnames API](/api/operations/custom-hostname-for-a-zone-create-custom-hostname). | Customers can only choose `“lets_encrypt”` or `“google”` when using the [custom hostnames API](/api/operations/custom-hostname-for-a-zone-create-custom-hostname). | If you are currently using DigiCert as the issuing CA when creating custom hostnames, [switch your integration](#update-values) to use Let’s Encrypt or Google. |
| DCV Methods | CNAME and Email DCV are available. | CNAME and Email DCV will be deprecated. Customers will be required to use [HTTP](/cloudflare-for-platforms/cloudflare-for-saas/security/certificate-management/issue-and-validate/validate-certificates/http/) or [TXT](/cloudflare-for-platforms/cloudflare-for-saas/security/certificate-management/issue-and-validate/validate-certificates/txt/) DCV. | When certificates come up for renewal that are using CNAME or Email DCV, Cloudflare will automatically choose HTTP DCV as the default method for non-wildcard custom hostnames and TXT DCV for wildcard custom hostnames. |
| Validity period | Custom hostname certificates have a 1 year validity period. | Custom hostnames certificates will have a 90 day validity period. | If you are using [wildcard custom hostnames](#wildcard-custom-hostnames), your customers will need to place DCV tokens at their DNS provider more frequently. [Non-wildcard custom hostname certificates](#non-wildcard-custom-hostnames) will automatically renew, as long as the hostname is actively proxying through Cloudflare. Cloudflare will handle the renewals at a more frequent rate. |
{{</table-wrap>}}

## Domain Control Validation (DCV) updates

CNAME and Email DCV will be deprecated on **October 18, 2023**, requiring customers to use either [HTTP](/cloudflare-for-platforms/cloudflare-for-saas/security/certificate-management/issue-and-validate/validate-certificates/http/), [Delegated DCV](/cloudflare-for-platforms/cloudflare-for-saas/security/certificate-management/issue-and-validate/validate-certificates/delegated-dcv/), or [TXT](/cloudflare-for-platforms/cloudflare-for-saas/security/certificate-management/issue-and-validate/validate-certificates/txt/) DCV.

Also, the maximum validity period for certificates will be decreased from 1 year to 90 days. This means that certificates will be renewed - and require DCV - more frequently.

## Required actions

### Before October 18, 2023

If your system integrates with the Cloudflare for SaaS API to [create custom hostnames](/api/operations/custom-hostname-for-a-zone-create-custom-hostname), you will need to update:

- The value sent in the `"certificate_authority"` field under the SSL object. Your integration should either use Google Trust Services (`"google"`) or Let's Encrypt (`"lets_encrypt"`).
- The value sent in the `"method"` field under the SSL object. Your integration should either use [`"http"`](/cloudflare-for-platforms/cloudflare-for-saas/security/certificate-management/issue-and-validate/validate-certificates/http/) (only available for [non-wildcard hostnames](#non-wildcard-custom-hostnames)) or [`"txt"`](/cloudflare-for-platforms/cloudflare-for-saas/security/certificate-management/issue-and-validate/validate-certificates/txt/).

### Before November 1, 2023

We recommend that you migrate all your current custom hostnames away from DigiCert before November 1, 2023. This will give you the control to migrate custom hostnames to the new system in a controlled manner instead of having Cloudflare manage the offboarding when the certificates come up for renewal.

#### Identify certificates

To identify certificates that are coming up for renewal, set up [notifications](/notifications/notification-available/#ssltls) for **SSL for SaaS Custom Hostnames Alert** events.

You can also send a [GET](/api/operations/custom-hostname-for-a-zone-list-custom-hostnames) request to the API and look for certificates with a `ssl_status` of `pending_validation` and a `certificate_authority` of `digicert` within the SSL object.

To find wildcard custom hostnames specifically that are using DigiCert certificates, send a [GET](/api/operations/custom-hostname-for-a-zone-list-custom-hostnames) request and include `?certificate_authority=digicert&wildcard=true` in the request parameter.

#### Update values

You should [update](/cloudflare-for-platforms/cloudflare-for-saas/security/certificate-management/issue-and-validate/issue-certificates/) the following values:

- **Certificate Authority**: When you update this value, it will immediately reissue the certificate. Cloudflare will continue serving the previous certificate until the new one is validated. If the certificate was previously using DigiCert and you do not update this value, Cloudflare will choose the issuing CA upon renewal.
    - *Dashboard*: Update the value for **SSL certificate authority** to either be **Let's Encrypt** or **Google Trust Services**.
    - *API*: Update the value sent in the `"certificate_authority"` field under the SSL object to either be `"lets_encrypt"` or `"google"`.

    {{<Aside type="note">}}
 If you update the certificate authority for a wildcard custom hostname to use Let's Encrypt or Google Trust Services, you will now need to add [two DCV tokens](#wildcard-custom-hostnames) for it to validate.
    {{</Aside>}}

- **DCV Method**: You can only update this value when your certificate is up for renewal. If your certificate was previously using **Email** or **CNAME** validation and you do not update this value, Cloudflare will automatically set your DCV method to **TXT** or **HTTP** when the custom hostname comes up for renewal. We will use **HTTP** validation for non-wildcard custom hostname renewals and TXT-based DCV for wildcard custom hostname renewals.
    - *Dashboard*: Update the value for **Certificate validation method** to either be [HTTP Validation](/cloudflare-for-platforms/cloudflare-for-saas/security/certificate-management/issue-and-validate/validate-certificates/http/) (only available for [non-wildcard custom hostnames](#non-wildcard-custom-hostnames)) or [TXT Validation](/cloudflare-for-platforms/cloudflare-for-saas/security/certificate-management/issue-and-validate/validate-certificates/txt/).
    - *API*: Update the value sent in the `"method"` field under the SSL object to either be [`"http"`](/cloudflare-for-platforms/cloudflare-for-saas/security/certificate-management/issue-and-validate/validate-certificates/http/) (only available for [non-wildcard custom hostnames](#non-wildcard-custom-hostnames)) or [`"txt"`](/cloudflare-for-platforms/cloudflare-for-saas/security/certificate-management/issue-and-validate/validate-certificates/txt/).


{{<Aside type="note">}}

After your DigiCert certificate is renewed, the API will return a new certificate pack ID.

{{</Aside>}}

---

### Non-wildcard custom hostnames

For non-wildcard hostnames, you can use HTTP DCV to automatically perform DCV as long as the custom hostname is proxying traffic through Cloudflare. Cloudflare will complete DCV on the hostname's behalf by serving the [HTTP token](/cloudflare-for-platforms/cloudflare-for-saas/security/certificate-management/issue-and-validate/validate-certificates/http/).

If your hostname is using another validation method, you will need to [update](/api/operations/custom-hostname-for-a-zone-edit-custom-hostname) the `"method"` field in the SSL object to be `"http"`.

If the custom hostname is not proxying traffic through Cloudflare, then the custom hostname domain owner will need to add the TXT or HTTP DCV token for the new certificate to validate and issue. As the SaaS provider, you will be responsible for sharing this token with the custom hostname domain owner.

### Wildcard custom hostnames

{{<render file="_wildcard-hostname-reqs.md" productFolder="cloudflare-for-platforms" >}}

{{<render file="_update-dcv-method.md" productFolder="cloudflare-for-platforms" >}}

{{<render file="_txt-validation_preamble.md" productFolder="cloudflare-for-platforms" >}}
<br/>

{{<tabs labels="API | Dashboard">}}
{{<tab label="api" no-code="true">}}

{{<render file="_txt-validation_api.md" productFolder="cloudflare-for-platforms" >}}

{{</tab>}}

{{<tab label="dashboard" no-code="true">}}

{{<render file="_txt-validation_dashboard.md" productFolder="cloudflare-for-platforms" >}}

{{</tab>}}
{{</tabs>}}

{{<render file="_txt-validation_post.md" productFolder="cloudflare-for-platforms" >}}

#### Actions required

As the SaaS provider, you will be responsible for sharing these DCV tokens with your customers. Let’s Encrypt DCV tokens are valid for 7 days and Google Trust Services tokens are valid for 14 days. We recommend that you make this clear to your customers, so that they add the tokens in a timely manner. If your customers take longer than the token validity period to add the record then you will need to fetch updated tokens and share those in order for the certificate to validate and issue.

Once your customer has added these tokens, the certificate status will change to **Active**. Cloudflare will periodically check if the DCV tokens have been placed according to the [certificate validation schedule](/ssl/edge-certificates/changing-dcv-method/validation-backoff-schedule/). Once your customer has added the records, you can make a no-change call to the custom hostnames API to restart the validation schedule for a specific hostname.