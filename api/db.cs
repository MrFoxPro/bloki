using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using static System.IO.Path;

public class BlokiDbContext : IdentityDbContext<User, IdentityRole<int>, int>
{
   public DbSet<Workspace> Workspaces => Set<Workspace>();
   public DbSet<Document> Documents => Set<Document>();

   public string DbPath { get; }

   private IWebHostEnvironment env { get; set; }
   public BlokiDbContext(IWebHostEnvironment hostingEnvironment)
   {
      DbPath = Join(Combine(Directory.GetCurrentDirectory(), "db", "bloki.sqlite"));
      env = hostingEnvironment;
   }

   protected override void OnConfiguring(DbContextOptionsBuilder options)
   {
      options.UseSqlite($"Data Source={DbPath}");
      if (env.IsDevelopment())
      {
         options.EnableDetailedErrors();
         options.EnableSensitiveDataLogging();
      }
   }

   protected override void OnModelCreating(ModelBuilder builder)
   {
      base.OnModelCreating(builder);

      builder.Entity<User>(userBuilder =>
      {
         userBuilder
         .Property(u => u.Locale)
         .HasConversion<string>();

         userBuilder
         .Property(u => u.GridRenderMethod)
         .HasConversion<string>();

         userBuilder
            .HasOne<Document>()
            .WithMany()
            .HasForeignKey(u => u.SelectedDocumentId);

         userBuilder
            .HasOne<Workspace>()
            .WithMany()
            .HasForeignKey(u => u.SelectedWorkspaceId);

         userBuilder.ToTable("Users");
      });

      builder.Entity<Workspace>(wsBuilder =>
      {
         wsBuilder
         .HasMany(w => w.Users)
         .WithMany(u => u.Workspaces);
      });

      builder.Entity<Block>()
      .HasDiscriminator<int>("type")
      .HasValue<TextBlock>(((int)BlockType.Text))
      .HasValue<ImageBlock>(((int)BlockType.Image))
      .HasValue<CodeBlock>(((int)BlockType.Code));

      builder.Entity<Document>().OwnsOne(d => d.LayoutOptions);
   }

   public static void Seed(BlokiDbContext ctx)
   {
      ctx.Database.Migrate();
      if (ctx.Users.Any(u => u.Id == Initial.User.Id)) return;

      var blocks = Initial.User.Workspaces.SelectMany(ws => ws.Documents).SelectMany(d => d.Layout).ToArray();
      for (int i = 0; i < blocks.Length; i++)
      {
         blocks[i].Id = -i - 1;
      }
      ctx.Users.Add(Initial.User);
      ctx.SaveChanges();
   }
}
