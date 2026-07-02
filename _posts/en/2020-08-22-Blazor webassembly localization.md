---
layout: post
title:  "Embedding multilingual capabilities in your Blazor WebAssembly applications"
date:   2020-08-22 00:00:00
categories: blazor, webassembly
author: AClerbois
ref: blazor-localization
github_repo_username: aclerbois
github_repo : aclerbois
image: /images/posts/flags.jpg
comments: true
tags: [.net core, blazor, webassembly, multilingual ]
---

In this article we will discuss the possibility of adding multilingual capabilities to your Blazor WebAssembly application.

<!--more-->

[Microsoft's documentation](https://docs.microsoft.com/en-us/aspnet/core/blazor/globalization-localization?view=aspnetcore-3.1#blazor-webassembly) tells us that the language used in your application is based on the user's language preference in the browser.


> This information is returned by the Javascript functions:
> ```js
> navigator.language   //"en-US"
> navigator.languages  //["en-US", "zh-CN", "ja-JP"]
> ```

If you are working in a context where your users use a computer on which the browser language is set by the infrastructure administrators, this can quickly harm the user experience you are trying to set up.

Here are the various steps for setting up language selection in your Blazor WebAssembly applications.

## 1. Tell your application that it is multilingual

You need to add NuGet packages to enable localization capabilities:

* ```Microsoft.AspNetCore.Localization```
* ```Microsoft.Extensions.Localization```

If you are using Visual Studio, you can use the NuGet Package tool.

Otherwise, you can edit your csproj file by adding these lines:

```xml
<ItemGroup>
    <!-- Other dependencies-->
    <PackageReference Include="Microsoft.AspNetCore.Localization" Version="2.2.0" />
    <PackageReference Include="Microsoft.Extensions.Localization" Version="3.1.7" />  
    <!-- These versions are the latest at the writing post time -->
</ItemGroup>
```

In the using section of your ```program.cs``` file, you can insert these using statements:

```csharp
using System.Globalization;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.JSInterop;
```

Once inserted, you need to register the localization middleware and retrieve the current browser culture by invoking a Javascript interop call.

```csharp
 public class Program
{
    public static async Task Main(string[] args)
    {
        // ...
            builder.Services.AddLocalization(opts => { opts.ResourcesPath = "Resources"; });

            var host = builder.Build();
            var jsInterop = host.Services.GetRequiredService<IJSRuntime>();
            var result = await jsInterop.InvokeAsync<string>("blazorCulture.get");
            if (result != null)
            {
                var culture = new CultureInfo(result);
                CultureInfo.DefaultThreadCurrentCulture = culture;
                CultureInfo.DefaultThreadCurrentUICulture = culture;
            }
        // ...
    }
```

In this example, I'm using translated resource files based on the resx approach. More details on [Microsoft Docs](https://docs.microsoft.com/en-us/aspnet/core/fundamentals/localization?view=aspnetcore-3.1#resource-files).

You can enhance your translation experience in Visual Studio using the [Resx Manager extension](https://marketplace.visualstudio.com/items?itemName=TomEnglert.ResXManager).

## 2. Include the Javascript interop function

In order to make your interop call available, you need to add a method in your ```index.html```, or wherever you store your static Javascript methods, to retrieve or set the way your application culture is stored. You can add the following code to make it possible:

```js
window.blazorCulture = {
    get: () => window.localStorage['BlazorCulture'],
    set: (value) => window.localStorage['BlazorCulture'] = value
};
```

> pssst: Don't forget to wrap this in ```<script></script>``` tags if you add this statement in an HTML file.

## 3. Allow your user to change the language

Somewhere in your application, in a ```.razor``` file, you need to add the following statement to allow your user to change the language:

```html
<strong>Culture:</strong>
<select @bind="Culture">
    @foreach (var culture in supportedCultures)
    {
        <option value="@culture">@culture.DisplayName</option>
    }
</select>
```
```csharp
@code {
    private CultureInfo[] supportedCultures = new[]
    {
        // French language
        new CultureInfo("fr"),
        // English language
        new CultureInfo("en"),
        // Dutch language
        new CultureInfo("nl"),
    };

    private CultureInfo Culture
    {
        get => CultureInfo.CurrentCulture;
        set
        {
            if (CultureInfo.CurrentCulture != value)
            {
                var js = (IJSInProcessRuntime)JSRuntime;
                js.InvokeVoid("blazorCulture.set", value.Name);

                Nav.NavigateTo(Nav.Uri, forceLoad: true);
            }
        }
    }
}
```

The codes used in the supportedCultures array are based on [rfc5646](https://tools.ietf.org/html/rfc5646).

## 4. Translate your Blazor view and take your application to the next level

Once you have configured everything above and created your application resource file, you can start localizing your view.

To do so, we will use [```IStringLocalizer```](https://docs.microsoft.com/en-us/dotnet/api/microsoft.extensions.localization.istringlocalizer) or [```IStringLocalizer<T>```](https://docs.microsoft.com/en-us/dotnet/api/microsoft.extensions.localization.istringlocalizer-1), because [```IHtmlLocalizer```](https://docs.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.mvc.localization.ihtmllocalizer), [```IViewLocalizer```](https://docs.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.mvc.localization.iviewlocalizer), and Data Annotations localization are ASP.NET Core MVC scenarios and are not supported in Blazor apps.

In a ```.razor``` file, we will inject the localizer object and use the dictionary getter to make the magic happen.

```html
@inject IStringLocalizer<Index> localizer
<h1>@localizer["Title"]</h1>
``` 

In this example, the ```Index``` passed as the generic argument is the resource file.

Run your application and use it with globalization to improve the user experience.