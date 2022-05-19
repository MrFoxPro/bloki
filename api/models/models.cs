using Microsoft.AspNetCore.Identity;

interface IDbEntity
{
   int Id { get; set; }
}

interface IPoint
{
   int X { get; set; }
   int Y { get; set; }
}
class Point : IPoint
{
   public int X { get; set; }
   public int Y { get; set; }
}

interface IDimension
{
   int Width { get; set; }
   int Height { get; set; }
}
public class Dimension : IDimension
{
   public int Width { get; set; }
   public int Height { get; set; }
}

public class BlockTransform : IPoint, IDimension
{
   public int X { get; set; }
   public int Y { get; set; }
   public int Width { get; set; }
   public int Height { get; set; }
}
enum BlockType
{
   Text = 1,
   Image,
   Code
}

enum TextBlockType
{
   Title = 1,
   Regular,
   H1,
   H2,
   H3,
   Description,
}
enum TextBlockFontFamily
{
   Roboto,
   Inter
}
public abstract class Block : BlockTransform, IDbEntity
{
   public int Id { get; set; }

   public int DocumentId { get; set; }
}

class TextBlock : Block
{
   public string Value { get; set; } = "";
   public TextBlockType TextType { get; set; } = TextBlockType.Regular;
   public TextBlockFontFamily FontFamily { get; set; } = TextBlockFontFamily.Inter;
}

class ImageBlock : Block
{
   public string? Url { get; set; }
}

class CodeBlock : Block
{
   string Value { get; set; } = "";
}

public class User : IdentityUser<int>
{
   public List<Workspace> Workspaces { get; set; } = new();

   public int SelectedDocumentId { get; set; }
   public int SelectedWorkspaceId { get; set; }

   public Locale Locale { get; set; } = Locale.English;
   public GridRenderMethod GridRenderMethod { get; set; } = GridRenderMethod.Canvas;
}

[GraphQLName("BlokiWorkspace")]
public class Workspace : IDbEntity
{
   public int Id { get; set; }

   public string Title { get; set; } = "WS without title";
   public List<User> Users { get; set; } = new();
   public List<Document> Documents { get; set; } = new();
}

[GraphQLName("BlokiDocument")]
public class Document : IDbEntity
{
   public int Id { get; set; }

   public int WorkspaceId { get; set; }

   public string Title { get; set; } = "Document without title";
   public bool Shared { get; set; } = false;

   [GraphQLIgnore]
   public byte[] Blob { get; set; } = new byte[1024];
   public ICollection<Block> Layout { get; set; } = new Block[0];
   public LayoutOptions LayoutOptions { get; set; } = new();
}

public enum GridRenderMethod
{
   Canvas = 1,
   DOM
}

public enum Locale
{
   Russian = 1,
   Detusch,
   English
}

public class LayoutOptions : ICloneable
{
   public int FGridWidth { get; set; } = 80;
   public int FGridHeight { get; set; } = 150;
   public int MGridWidth { get; set; } = 26;
   public int MGridHeight { get; set; } = 150;
   public int Gap { get; set; } = 4;
   public int Size { get; set; } = 16;

   public bool ShowGridGradient { get; set; } = false;
   public bool ShowResizeAreas { get; set; } = false;

   public object Clone()
   {
      return this.MemberwiseClone();
   }
}

