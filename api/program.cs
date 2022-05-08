var builder = WebApplication.CreateBuilder(args);

builder.Logging.AddSystemdConsole((options) =>
{
	options.IncludeScopes = false;
	options.TimestampFormat = "hh:mm:ss ";
});

builder.Services
.AddDbContext<BlokiDbContext>()
.AddGraphQLServer()
.RegisterDbContext<BlokiDbContext>()
.AddQueryType<RootQuery>()
.AddProjections();

builder.Services.AddSignalR();

var app = builder.Build();

app.Logger.LogInformation("Seeding data");
using var serviceScope = app.Services.CreateAsyncScope();
using var ctx = serviceScope.ServiceProvider.GetService<BlokiDbContext>();
BlokiDbContext.Seed(ctx!);


app.Urls.Add("http://localhost:1007");
app.MapGraphQL("/api");

app.MapHub<MultiplayerHub>("/ws/{docId}");

app.Run();