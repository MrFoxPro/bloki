using static System.IO.Path;

public static class Initial
{
   public static readonly LayoutOptions DefaultLayoutOptions = new()
   {
      FGridWidth = 80,
      FGridHeight = 150,
      MGridWidth = 26,
      MGridHeight = 150,
      Gap = 4,
      Size = 16,
      ShowGridGradient = false,
      ShowResizeAreas = false
   };

   public static readonly Document TutorialDocument = new()
   {
      Id = -1,
      Title = "Tutorial",
      Shared = false,
      Layout = new Block[]
       {
            new TextBlock
            {
                FontFamily = TextBlockFontFamily.Inter,
                TextType = TextBlockType.Title,
                Value = "All your creativity in one place",
                X = 35,
                Y = 2,
                Width = 19,
                Height = 6
            },
            new TextBlock
            {
                FontFamily = TextBlockFontFamily.Inter,
                TextType = TextBlockType.Regular,
                Value = "Bloki is an interactive block editor in which you can create anything you want whether it's a math homework or work",
                Width = 26,
                Height = 11,
                X = 3,
                Y = 8
            },
            new ImageBlock
            {
                Url = null,
                X = 27,
                Y = 94,
                Width = 26,
                Height = 11
            },
            new ImageBlock
            {
                Url = "/static/images/UUftVyl.png",
                X = 64,
                Y = 61,
                Width = 13,
                Height = 3,
            },
            new TextBlock
            {
                TextType = TextBlockType.H1,
                Value = "To create a block, simply click in the center of the space, the pre-lighting will show you the block you will create",
                X = 61,
                Y = 30,
                Width = 15,
                Height = 16,
            },
            new TextBlock
            {
                TextType = TextBlockType.H1,
                Value = "The block can be set to the size whatever you want. To change drag the edge of the block selection and pull the circle, it's very simple ☺️",
                X = 0,
                Y = 48,
                Width = 26,
                Height = 13,
            },
            new TextBlock
            {
                TextType = TextBlockType.H1,
                Value = "Move the block to the place you need",
                X = 45,
                Y = 51,
                Width = 26,
                Height = 5,
            },
            new TextBlock
            {
                TextType = TextBlockType.H1,
                Value = "You can change the block type by right-clicking         and selecting the type",
                X = 0,
                Y = 78,
                Width = 26,
                Height = 8,
            },
            new TextBlock
            {
                TextType = TextBlockType.H1,
                Value = "You have a great level of freedom when editing files and everything fits into a text editor with its own file structure, workspaces, and collaboration.",
                X = 43,
                Y = 144,
                Width = 26,
                Height = 14,
            },
            new ImageBlock
            {
                Url = "/static/images/rdgXmun.png",
                X = 57,
                Y = 99,
                Width = 21,
                Height = 3,
            },
       },
      LayoutOptions = (LayoutOptions)DefaultLayoutOptions.Clone(),
      Blob = File.ReadAllBytes(Combine(Directory.GetCurrentDirectory(), "static/blobs/tutorial.png")),
   };

   public static readonly Document ExampleDocument = new()
   {
      Id = -2,
      Title = "Example",
      Shared = false,
      Layout = new Block[]
       {
            new TextBlock
            {
                    TextType = TextBlockType.H3,
                    Value = "Look at work, not our faces.",
                    Height = 2,
                    Width = 26,
                    X = 27,
                    Y = 34,
            },
            new TextBlock
            {
                TextType = TextBlockType.Regular,
                Value = "The pandemic didn’t catalyze a new superior way of working, but instead threw us all into a murky unknown territory we weren’t prepared for. In the rush to find a “new normal” while trying to hold on to the old way of working, companies simply shifted in-person work dynamics to Zoom calls, making offices of our homes and requiring us to sit in front of a camera for eight hours a day. And that tore us down.",
                Height = 7,
                Width = 26,
                X = 27,
                Y = 18,
            },
            new TextBlock
            {
                TextType = TextBlockType.Regular,
                Value = "For designers, this shift has had a major impact on how we collaborate. Relying on meetings is problematic because meetings are linear, while collaboration is, in many ways, spatial. ",
                Height = 3,
                Width = 26,
                X = 27,
                Y = 26,
            },
            new TextBlock
            {
                TextType = TextBlockType.Regular,
                Value = "We need a space for making, not for talking about making.",
                Height = 1,
                Width = 26,
                X = 27,
                Y = 30,
            },
            new TextBlock
            {
                TextType = TextBlockType.Regular,
                Value = "Collaboration is crucial to UX; after all, our users will never interact with our static artboards or UI prototypes. The common practice of jumping straight into Figma, Google Docs, and other tools after we end our calls is a hint that we should put our work (not our faces) at the center of our screen.",
                Height = 5,
                Width = 26,
                X = 27,
                Y = 36,
            },
            new TextBlock
            {
                TextType = TextBlockType.H3,
                Value = "Not a one-space-fits-all.",
                Height = 2,
                Width = 26,
                X = 27,
                Y = 43,
            },
            new TextBlock
            {
                TextType = TextBlockType.Regular,
                Value = "As in our houses we need different spaces for different activities, at work we need different spaces for different tasks. And like a house, work at times can feel like a messy closet (that long Slack thread) or a labyrinth of drawers (all those folders on Google Drive).",
                Height = 4,
                Width = 26,
                X = 27,
                Y = 45,
            },
            new ImageBlock
            {
                Url = "https://images.squarespace-cdn.com/content/v1/59ebb4b3cd39c3e3ae4822d5/e5e0b7b7-9131-40f1-9cc8-37d69c0c213e/Rebuild.gif",
                Height = 16,
                Width = 26,
                X = 27,
                Y = 1,
            },
            new TextBlock
            {
                TextType = TextBlockType.H3,
                Value = "Don’t try to copy old models.",
                Height = 2,
                Width = 26,
                X = 27,
                Y = 51,
            },
            new TextBlock
            {
                TextType = TextBlockType.Regular,
                Value = "Let’s take this opportunity to rethink how we can work together in a way that fits everyone’s needs — whether over voice notes or words, in real-time or asynchronously. We can do a better job working towards inclusivity in our workspaces, instead of replicating the old office space in a virtual dimension.",
                Height = 5,
                Width = 26,
                X = 27,
                Y = 53,
            },
            new TextBlock
            {
                TextType = TextBlockType.H3,
                Value = "That Zoom call could have been a Figjam.",
                Height = 2,
                Width = 26,
                X = 27,
                Y = 72,
            },
            new TextBlock
            {
                TextType = TextBlockType.Regular,
                Value = "With Figjam, Miro, Freehand, and other whiteboard tools, we designers have finally invited product managers into our world.",
                Height = 2,
                Width = 26,
                X = 27,
                Y = 74,
            },
            new TextBlock
            {
                TextType = TextBlockType.H3,
                Value = "Audio everywhere.",
                Height = 2,
                Width = 26,
                X = 27,
                Y = 78,
            },
            new TextBlock
            {
                TextType = TextBlockType.Regular,
                Value = "Many of the tools we use every day are making audio chat accessible in one click. Audio creates the feeling of being together without the pressure of looking good on camera.\n",
                Height = 3,
                Width = 26,
                X = 27,
                Y = 80,
            },
            new TextBlock
            {
                TextType = TextBlockType.H3,
                Value = "New etiquette.",
                Height = 2,
                Width = 26,
                X = 27,
                Y = 85,
            },
            new TextBlock
            {
                TextType = TextBlockType.Regular,
                Value = "You can’t cross someone else’s cursor in a design file without saying hello or doing a little cursor dance. Come on, don’t be rude.",
                Height = 2,
                Width = 26,
                X = 27,
                Y = 87,
            },
            new ImageBlock
            {

                Url = "https://miro.medium.com/max/600/1*V3oHLSi-LEn5C8bMbkMiiw.gif",
                Height = 8,
                Width = 8,
                X = 27,
                Y = 60,
            },
            new ImageBlock
            {
                Url = "https://miro.medium.com/max/600/1*iujlFCYKXUCfomh1sPbdAA.gif",
                Width = 8,
                Height = 8,
                X = 35,
                Y = 60,
            },
            new ImageBlock
            {
                Url = "https://miro.medium.com/max/600/1*tTzIK1_rUqdbvZx60J3c1w.gif",
                Width = 8,
                Height = 8,
                X = 43,
                Y = 60,
            }
       },
      LayoutOptions = (LayoutOptions)DefaultLayoutOptions.Clone(),
      Blob = File.ReadAllBytes(Combine(Directory.GetCurrentDirectory(), "static/blobs/example.png")),
   };

   public static readonly Workspace DefaultWorkspace = new()
   {
      Id = -1,
      Title = "Bloki workspace",
      Documents = new List<Document> { TutorialDocument, ExampleDocument }
   };

   public static readonly User User = new()
   {
      Id = -1,
      UserName = "Alexander Pistoletov",
      SelectedDocumentId = TutorialDocument.Id,
      SelectedWorkspaceId = DefaultWorkspace.Id,
      Workspaces = new List<Workspace> { DefaultWorkspace },
   };
}
