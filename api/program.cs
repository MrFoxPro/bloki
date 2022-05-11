using Microsoft.AspNetCore.Identity;

var builder = WebApplication.CreateBuilder(args);

// builder.Logging.AddSystemdConsole((options) =>
// {
//    options.IncludeScopes = false;
//    options.TimestampFormat = "hh:mm:ss ";
// });

var jwtkey = builder.Configuration["JWTKey"];

if (string.IsNullOrEmpty(jwtkey))
{
   Console.WriteLine("No JWTKey specified");
   return;
}


builder.Services
.AddDbContext<BlokiDbContext>()
.AddDatabaseDeveloperPageExceptionFilter();

builder.Services
.AddIdentity<IdentityUser, IdentityRole>(options => options.SignIn.RequireConfirmedAccount = true)
.AddDefaultTokenProviders()
.AddEntityFrameworkStores<BlokiDbContext>();

builder.Services
.AddAuthentication()
.AddCookie();


builder.Services.AddSignalR();

builder.Services.AddGraphQLServer()
.AddAuthorization()
.RegisterDbContext<BlokiDbContext>()
.AddMutationConventions()
.AddQueryType<RootQuery>()
.AddMutationType<RootMutation>()
.AddProjections();

var app = builder.Build();

// app.Logger.LogInformation("Seeding data");
// using var serviceScope = app.Services.CreateAsyncScope();
// using var ctx = serviceScope.ServiceProvider.GetService<BlokiDbContext>();
// BlokiDbContext.Seed(ctx!);

app.UseAuthentication();

app.Urls.Add("http://localhost:5007");
app.MapGraphQL("/api");

app.MapHub<MultiplayerHub>("/ws/{docId}");

app.Run();
