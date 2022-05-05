using Microsoft.EntityFrameworkCore;
using static System.IO.Path;

public class BlokiDbContext : DbContext
{
	public DbSet<User> Users => Set<User>();
	public DbSet<Workspace> Workspaces => Set<Workspace>();
	public DbSet<Document> Documents => Set<Document>();

	public string DbPath { get; }

	public BlokiDbContext()
	{
		DbPath = Join(Combine(Directory.GetCurrentDirectory(), "db", "bloki.db"));
	}

	protected override void OnConfiguring(DbContextOptionsBuilder options)
		 => options.UseSqlite($"Data Source={DbPath}").EnableSensitiveDataLogging();

	protected override void OnModelCreating(ModelBuilder builder)
	{
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

		base.OnModelCreating(builder);
	}

	public static void Seed(BlokiDbContext ctx)
	{
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