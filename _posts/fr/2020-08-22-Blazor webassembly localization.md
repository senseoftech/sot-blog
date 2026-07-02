---
layout: post
title:  "Intégrer des capacités multilingues dans vos applications Blazor WebAssembly"
date:   2020-08-22 00:00:00
author: AClerbois
lang: fr
ref: blazor-localization
image: /images/posts/flags.jpg
comments: true
tags: [.net core, blazor, webassembly, multilingual ]
---

Dans cet article, nous allons aborder la possibilité d'ajouter des capacités multilingues à votre application Blazor WebAssembly.

<!--more-->

La [documentation de Microsoft](https://docs.microsoft.com/en-us/aspnet/core/blazor/globalization-localization?view=aspnetcore-3.1#blazor-webassembly) nous indique que la langue utilisée dans votre application repose sur la préférence de langue de l'utilisateur dans le navigateur.


> Cette information est renvoyée par les fonctions Javascript :
> ```js
> navigator.language   //"en-US"
> navigator.languages  //["en-US", "zh-CN", "ja-JP"]
> ```

Si vous travaillez dans un contexte où vos utilisateurs utilisent un ordinateur sur lequel le choix de la langue du navigateur est défini par les administrateurs de l'infrastructure, cela peut rapidement nuire à l'expérience utilisateur que vous essayez de mettre en place.

Voici les différentes étapes pour mettre en place la sélection de la langue dans vos applications Blazor WebAssembly.

## 1. Indiquer à votre application qu'elle est multilingue

Vous devez ajouter des packages NuGet pour activer les capacités de localisation :

* ```Microsoft.AspNetCore.Localization```
* ```Microsoft.Extensions.Localization```

Si vous utilisez Visual Studio, vous pouvez recourir à l'outil NuGet Package.

Sinon, vous pouvez modifier votre fichier csproj en ajoutant ces lignes :

```xml
<ItemGroup>
    <!-- Other dependencies-->
    <PackageReference Include="Microsoft.AspNetCore.Localization" Version="2.2.0" />
    <PackageReference Include="Microsoft.Extensions.Localization" Version="3.1.7" />  
    <!-- These versions are the latest at the writing post time -->
</ItemGroup>
```

Dans la section using de votre fichier ```program.cs```, vous pouvez insérer ces instructions using :

```csharp
using System.Globalization;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.JSInterop;
```

Une fois insérées, vous devez enregistrer le middleware de localisation et récupérer la culture courante du navigateur en effectuant un appel d'interop Javascript.

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

Dans cet exemple, j'utilise des fichiers de ressources traduits basés sur l'approche resx. Plus de détails sur [Microsoft Docs](https://docs.microsoft.com/en-us/aspnet/core/fundamentals/localization?view=aspnetcore-3.1#resource-files).

Vous pouvez améliorer votre expérience de traduction dans Visual Studio à l'aide de l'[extension Resx Manager](https://marketplace.visualstudio.com/items?itemName=TomEnglert.ResXManager).

## 2. Inclure la fonction d'interop Javascript

Afin de rendre votre appel d'interop disponible, vous devez ajouter dans votre ```index.html```, ou là où vous stockez vos méthodes Javascript statiques, une méthode permettant de récupérer ou de définir la façon dont la culture de votre application est stockée. Vous pouvez ajouter le code suivant pour y parvenir :

```js
window.blazorCulture = {
    get: () => window.localStorage['BlazorCulture'],
    set: (value) => window.localStorage['BlazorCulture'] = value
};
```

> pssst : n'oubliez pas d'encapsuler cela avec des balises ```<script></script>``` si vous ajoutez cette instruction dans un fichier HTML.

## 3. Permettre à votre utilisateur de changer de langue

Quelque part dans votre application, dans un fichier ```.razor```, vous devez ajouter l'instruction suivante pour permettre à votre utilisateur de changer de langue :

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

Les codes utilisés dans le tableau supportedCultures sont basés sur la [rfc5646](https://tools.ietf.org/html/rfc5646).

## 4. Traduire votre vue Blazor et passer votre application au niveau supérieur

Une fois que vous avez configuré tout ce qui précède et créé le fichier de ressources de votre application, vous pouvez commencer à localiser votre vue.

Pour ce faire, nous utiliserons [```IStringLocalizer```](https://docs.microsoft.com/en-us/dotnet/api/microsoft.extensions.localization.istringlocalizer) ou [```IStringLocalizer<T>```](https://docs.microsoft.com/en-us/dotnet/api/microsoft.extensions.localization.istringlocalizer-1), car [```IHtmlLocalizer```](https://docs.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.mvc.localization.ihtmllocalizer), [```IViewLocalizer```](https://docs.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.mvc.localization.iviewlocalizer) et la localisation via les Data Annotations sont des scénarios ASP.NET Core MVC et ne sont pas supportés dans les applications Blazor.

Dans un fichier ```.razor```, nous allons injecter l'objet localizer et utiliser le getter de dictionnaire pour que la magie opère.

```html
@inject IStringLocalizer<Index> localizer
<h1>@localizer["Title"]</h1>
``` 

Dans cet exemple, l'```Index``` passé en argument générique correspond au fichier de ressources.

Lancez votre application et utilisez-la avec la globalisation pour améliorer l'expérience utilisateur.
