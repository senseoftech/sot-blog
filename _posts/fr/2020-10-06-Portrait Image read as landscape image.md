---
layout: post
title:  ".NET - Une image portrait lue comme une image paysage"
date:   2020-10-06 00:00:00
author: AClerbois
lang: fr
ref: portrait-image
image: /images/posts/photographer.jpg
tags: [.net core, image ]
level: 200
---

Les photos en portrait prises par un appareil reflex n'ont pas des dimensions de hauteur et de largeur qui reflètent une photo en portrait.

Dans l'un des projets que je développe, l'objectif est d'afficher une boutique en ligne de photographie professionnelle pour des événements.

Une fois que le photographe uploade les photos dans la plateforme de back office, la plateforme les allège et ajoute un filigrane.

<!--more-->

Jusqu'ici, rien de très difficile en utilisant la
[bibliothèque SkiaSharp](https://docs.microsoft.com/en-us/dotnet/api/skiasharp?view=skiasharp-1.68.2&WT.mc_id=WD-MVP-5001937)

Mais il y a quelques jours, le photographe a découvert la photographie en portrait et le client a ouvert un ticket pour m'informer que les photos ne s'affichaient pas dans le bon sens et qu'il serait important de conserver la rotation.

J'ai commencé naïvement par un :

```csharp
// Object from library : [Image.FromFile method](https://docs.microsoft.com/en-us/dotnet/api/system.drawing.image.fromfile?view=dotnet-plat-ext-3.1&WT.mc_id=WD-MVP-5001937)
var image = Image.FromFile("best-picture-ever.jpg");
```

Puis j'ai fait une supposition pour déterminer si l'image est en portrait ou non avec :


```csharp
public bool IsPortrait(Image image){
    return image.Height > image.Width;
}
```

Content de mes longues secondes de programmation, j'ai décidé de tester. J'avais le pressentiment que le résultat était douteux.

Et j'avais raison ! Une fois la machine lancée, rien ne se passe comme prévu. J'obtiens la hauteur, qui correspond à la largeur, et vice versa.

Perplexe, je suis allé consulter les propriétés de l'image de la photo, et je pouvais voir que la hauteur était plus grande que la largeur. Je place un breakpoint dans Visual Studio et là, c'est l'inverse.

Mon cerveau a fait boom :D

En cherchant un peu, je me suis demandé : comment récupérer la taille stockée dans les métadonnées du fichier ? Et pourquoi n'ai-je pas la même information que dans le fichier ?

En fouillant un peu dans les propriétés de l'image

```csharp
var image = Image.FromFile("photo.jpg");
foreach (var propertyItem in image.PropertyItems)
{
    // read properties
}
```

J'ai découvert l'existence de l'EXIF (merci les communautés) :

> Exchangeable image file format (officiellement Exif, selon les spécifications JEIDA/JEITA/CIPA) est un standard qui spécifie les formats des images, des sons et des tags annexes utilisés par les appareils photo numériques (y compris les smartphones), les scanners et les autres systèmes manipulant des fichiers image et son enregistrés par des appareils photo numériques.
Source : [Wikipedia](https://en.wikipedia.org/wiki/Exif)

---

Le site [exiftool.org](https://exiftool.org/TagNames/EXIF.html) répertorie les standards et, plus précisément, le contenu qui m'intéresse, à savoir l'orientation (274).

| Tag ID | Tag Name | Writable | Group | Values / Notes |
|-------|-----------|----------|--------|----------------|
| ... | |  |  |  |
| 0x0112 | Orientation | int16u | IFD0  | 1 = Horizontal (normal) <br>2 = Mirror horizontal <br>3 = Rotate 180<br>4 = Mirror vertical<br>5 = Mirror horizontal and rotate 270 CW<br>6 = Rotate 90 CW<br>7 = Mirror horizontal and rotate 90 CW<br>8 = Rotate 270 CW |
| ... | |  |  |  |

Finalement, j'ai découvert la bibliothèque [MetadataExtractor](https://www.nuget.org/packages/MetadataExtractor/?WT.mc_id=WD-MVP-500193). Elle est très utile pour naviguer à travers les propriétés d'un fichier.

J'ai développé deux méthodes, une pour déterminer quelle opération de rotation je dois effectuer sur l'image, et une autre pour réaliser la rotation.

```csharp
/// <summary>
/// Retrieve the rotate flip type to apply to the modified picture
/// </summary>
/// <param name="path">Original picture</param>
/// <returns>Nullabe RotateFlipType</returns>
private RotateFlipType? ComputeRotateFlipType(string path)
{
    IEnumerable<MetadataExtractor.Directory> directories = ImageMetadataReader.ReadMetadata(path);
    var orientation = directories
        .OfType<ExifIfd0Directory>()
        .FirstOrDefault()
        ?.GetObject(ExifDirectoryBase.TagOrientation) as ushort?;

    if (orientation != null)
    {
        // Values provided by Standard EXIF : https://exiftool.org/TagNames/EXIF.html
        switch (orientation)
        {
            // 1 = Horizontal(normal)
            case 1: return RotateFlipType.RotateNoneFlipNone;
            // 2 = Mirror horizontal
            case 2: return RotateFlipType.RotateNoneFlipX;
            // 3 = Rotate 180
            case 3: return RotateFlipType.Rotate180FlipNone;
            // 4 = Mirror vertical
            case 4: return RotateFlipType.RotateNoneFlipY;
            // 5 = Mirror horizontal and rotate 270 CW
            case 5: return RotateFlipType.Rotate270FlipX;
            // 6 = Rotate 90 CW
            case 6: return RotateFlipType.Rotate90FlipNone;
            // 7 = Mirror horizontal and rotate 90 CW
            case 7: return RotateFlipType.Rotate90FlipX;
            // 8 = Rotate 270 CW
            case 8: return RotateFlipType.Rotate270FlipNone;
        }
    }
    return null;
}

/// <summary>
/// Rotate the modified picture based on the orientation property of the original picture
/// </summary>
/// <param name="inputPath">Original picture path</param>
/// <param name="outputPath">Modified picture path</param>
private void RotationWhenTransformationIsRequired(string inputPath, string outputPath)
{
    var rotationDegree = ComputeRotateFlipType(inputPath);
    if (rotationDegree.HasValue && rotationDegree.Value != RotateFlipType.RotateNoneFlipNone)
    {
        var bitmap = (Bitmap)Bitmap.FromFile(outputPath);
        bitmap.RotateFlip(rotationDegree.Value);
        using var stream = new FileStream(outputPath, FileMode.Create, FileAccess.Write);
        bitmap.Save(stream, ImageFormat.Jpeg);
    }
}
```
