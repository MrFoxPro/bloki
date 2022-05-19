using Microsoft.AspNetCore.Identity;

var builder = WebApplication.CreateBuilder(args);

// Setup
builder.Host.ConfigureLogging(logging =>
{
   logging.ClearProviders();
   logging.AddConsole();
});

Console.WriteLine("Starting app in {0} environment", builder.Environment.EnvironmentName);

builder.Services.AddDbContext<BlokiDbContext>();

// AddIdentity: https://github.com/dotnet/aspnetcore/blob/release/6.0/src/Identity/Core/src/IdentityServiceCollectionExtensions.cs
// AddIdentityCore: https://github.com/dotnet/aspnetcore/blob/release/6.0/src/Identity/Extensions.Core/src/IdentityServiceCollectionExtensions.cs
builder.Services.AddIdentity<User, IdentityRole<int>>(options =>
{
   options.SignIn.RequireConfirmedAccount = true;
   options.Password.RequireUppercase = false;
   options.Password.RequireDigit = false;
   options.Password.RequiredUniqueChars = 0;
   options.Password.RequireNonAlphanumeric = false;
})
.AddDefaultTokenProviders()
.AddEntityFrameworkStores<BlokiDbContext>();

builder.Services.AddSignalR();

builder.Services.AddGraphQLServer()
.AddAuthorization()
.RegisterDbContext<BlokiDbContext>()
.AddQueryType<RootQuery>()
.AddMutationConventions()
.AddMutationType<RootMutation>()
.AddProjections()
.ModifyRequestOptions(opt => opt.IncludeExceptionDetails = builder.Environment.IsDevelopment());
// .AddDiagnosticEventListener(sp => new MiniProfilerQueryLogger());

// https://miniprofiler.com/dotnet/AspDotNetCore
// builder.Services
// .AddMiniProfiler(options => { options.RouteBasePath = "/profiler"; })
// .AddEntityFramework();

builder.Services.AddHealthChecks();

// Building
var app = builder.Build();

if (builder.Environment.IsDevelopment())
{
   app.Logger.LogInformation("Seeding data");
   using var serviceScope = app.Services.CreateAsyncScope();
   using var ctx = serviceScope.ServiceProvider.GetService<BlokiDbContext>();
   BlokiDbContext.Seed(ctx!);
}
app.UseAuthentication();
// app.UseAuthorization();

app.Urls.Add("http://localhost:5007");
app.MapGraphQL("/api");

// app.UseMiniProfiler();
app.UseHealthChecks("/hc");

app.MapHub<MultiplayerHub>("/ws/{docId}");

app.Run();
