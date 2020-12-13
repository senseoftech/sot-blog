---
layout: post
title:  ".NET - Portrait Image read as landscape image"
date:   2020-10-06 00:00:00
image: /images/posts/photographer.jpg
tags: [.net core, image ]
---

Portrait photos taken by an SLR camera do not have the length and width dimensions that reflect the portrait photo.

In one of the projects I'm developing, the aim is to display an online shop of professional photography for events.

Once the photographer injects the photos into the backoffice platform, the platform is lightened and a watermark is added. 

<!--more-->

So far nothing very difficult using the 
[SkiaSharp library](https://docs.microsoft.com/en-us/dotnet/api/skiasharp?view=skiasharp-1.68.2&WT.mc_id=WD-MVP-5001937)

But a few days ago the photographer discovered portrait photography and the client opened a ticket to inform me that the photos are not displayed in the right direction and that it would be important to keep the rotation.

I started off naively with a : 

```csharp
// Object from library : [Image.FromFile method](https://docs.microsoft.com/en-us/dotnet/api/system.drawing.image.fromfile?view=dotnet-plat-ext-3.1&WT.mc_id=WD-MVP-5001937)
var image = Image.FromFile("best-picture-ever.jpg");
```

And make an extrapolation to determine if the picture is portrait or not by : 


```csharp
public bool IsPortrait(Image image){
    return image.Height > image.Width;
}
```

Happy with my long seconds of programming, I decided to test. I know how to test it is doubtful.

And I did the right thing! After you start the machine nothing happens as it should. I get the height size which corresponds to the width size and vice versa.

Dubitative, I will see the properties of the image in the photo but I can see that the height is larger than the length. I attach a breakpoint in Visual Studio and there it is the opposite. 

My brain went boom :D

Looking for a little bit, I thought, how can I get the size that is in the metas information of the file? Why, I don't have the same information as in the file?

By scraping a little in the image properties 

```csharp
var image = Image.FromFile("photo.jpg");
foreach (var propertyItem in image.PropertyItems)
{
    // read properties
}
```

I discover the existence of the EXIF (thank you Communities): 

> Exchangeable image file format (officially Exif, according to JEIDA/JEITA/CIPA specifications) is a standard that specifies the formats for images, sound, and ancillary tags used by digital cameras (including smartphones), scanners and other systems handling image and sound files recorded by digital cameras.
Source : [Wikipedia](https://en.wikipedia.org/wiki/Exif)

---

The site [exiftoolg.org](https://exiftool.org/TagNames/EXIF.html) lists the standards and more specifically the content I am interested in, namely guidance (274).

| Tag ID | Tag Name | Writable | Group | Values / Notes |
|-------|-----------|----------|--------|----------------|
| ... | |  |  |  |
| 0x0112 | Orientation | int16u | IFD0  | 1 = Horizontal (normal) <br>2 = Mirror horizontal <br>3 = Rotate 180<br>4 = Mirror vertical<br>5 = Mirror horizontal and rotate 270 CW<br>6 = Rotate 90 CW<br>7 = Mirror horizontal and rotate 90 CW<br>8 = Rotate 270 CW |
| ... | |  |  |  |

Finaly, I discover the library [MetadataExtractor](https://www.nuget.org/packages/MetadataExtractor/?WT.mc_id=WD-MVP-500193). This is very helpful to navigate through the properties of a file. 

I developed two methods, one to determine which rotation operation I need to do on the picture and another one to make the rotation. 

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