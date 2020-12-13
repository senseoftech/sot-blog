---
layout: post
title:  "Step-by-step way to generate a PFX for ApplePay"
date:   2020-01-09 10:00:00
categories: certificate
author: AClerbois
github_repo_username: aclerbois
github_repo : aclerbois
comments: true
image: /images/posts/trust.jpg
tags: [apple, certificate, dns]
---

One of the project I had at Ingenico ePayments, I should integrate ApplePay as a new payment method supported by the new Ingenico api. 
During the integration of ApplePay, we need to generate certificates to authentify our server. 

<!--more-->

## 0. Requierements

For this tuto, you should [OpenSsl](https://www.openssl.org/) installed. If you are on Windows, you cna dowload it or use Windows SubSystem Linux.

## 1. Generates private key and csr
The first step is to generate the private key and the CSR. The security algorithm required by Apple is RSA:2048 bits.

This is the command line to generate the private key and CSR : 

```console 
openssl req -nodes -newkey rsa:2048 -sha256 -keyout certificate.key -out certificate.csr
```

## 2. Generate the certificate on Apple Developer portal. 

When you are logged in the Apple Portal, in the identifiers, select merchant Ids and select your merchant or create a new one. 

You have the choice to create a certificate for **Apple Pay Processing Certificate** or **Apple Pay Merchant Identify Certificate**

![Merchant Id configuration page](/images/posts/apple-pay-cert-00.png)

I select to create a new certificate for **Apple Pay Processing Certificate** by clicking on **Create certificate**

![Merchant Id configuration page](/images/posts/apple-pay-cert-01.png)

Unlike the other procedure, here you need to clarify if the target market will touch China.

![Merchant Id configuration page](/images/posts/apple-pay-cert-02.png)

After this step, you can upload the file generate before (Step 1)

![Merchant Id configuration page](/images/posts/apple-pay-cert-03.png)

Once it upload, you can download the certificate generate based on you key provided. 

![Merchant Id configuration page](/images/posts/apple-pay-cert-04.png)

Keep the file downloaded, we're gonna need it for the final stage.

## 3. Generates the PFX files :

Once you have private key and certifcate generate from ApplePay, we can start to generate PFX. 

```console 

openssl x509 -inform der -in merchant_id.cer -out certificate.pem

openssl pkcs12 -export -inkey certificate.key -in certificate.pem -name Adrien_Clerbois -out certificate.pfx
```

During the second operation, you should set a password to protect your pfx. Don't forget it!

## 4. Configure HTTP Client to use the PFX generated.

In your ASP.NET application, you can add a specific HttpClient to use the certificate that  we created in the Step 3.

In this example, we add the certificate in the project and we copy the file to the build directory.

```csharp
      services
             .AddHttpClient<IApplePayClient, ApplePayClient>("ApplePay")
             .ConfigurePrimaryHttpMessageHandler(
                 (serviceProvider) =>
                 {
                     // Retrieve the certificate
                     var certificate = LoadCertificateFromDisk("path_to_cetificate", "password set on step 3");

                     var handler = new HttpClientHandler();
                     handler.ClientCertificates.Clear();
                     handler.ClientCertificates.Add(certificate);
                     handler.SslProtocols = SslProtocols.Tls12;

                     handler.ServerCertificateCustomValidationCallback += (a, b, c, d) => true;

                     return handler;
                 });
                 
...
        private X509Certificate2 LoadCertificateFromDisk(string path, string password)
        {
            try
            {
                return new X509Certificate2(path, password, X509KeyStorageFlags.Exportable);
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException($"Failed to load Apple Pay merchant certificate file from '{options.MerchantCertificateFileName}'.", ex);
            }
        }
...
```
