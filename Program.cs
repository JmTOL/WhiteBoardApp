using WhiteBoardApp.Hubs;
using Microsoft.EntityFrameworkCore;
using WhiteBoardApp.Data;
using StackExchange.Redis;
using DotNetEnv;
using Microsoft.AspNetCore.HttpOverrides;

var builder = WebApplication.CreateBuilder(args);

// Load environment variables from .env file if it exists
Env.Load();

Console.WriteLine("Warning: REDIS_URL environment variable is not set, falling back to in-memory SignalR.");
builder.Services.AddSignalR();


Console.WriteLine("Warning: DATABASE_URL not found, falling back to SQLite.");
var fallbackDbPath = Path.Combine(AppContext.BaseDirectory, "local.db");
var sqliteConnection = $"Data Source={fallbackDbPath}";
builder.Services.AddDbContext<ApplicationDbContext>(options => options.UseSqlite(sqliteConnection));


builder.Services.AddRazorPages();
var isHeroku = !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("DYNO"));
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    if (isHeroku)
    {
        options.KnownNetworks.Clear();
        options.KnownProxies.Clear();
    }
});
builder.Services.AddHttpsRedirection(options =>
{
    if (isHeroku)
    {
        options.RedirectStatusCode = StatusCodes.Status308PermanentRedirect;
        options.HttpsPort = 443;
    }
    ;
});

var app = builder.Build();

app.UseForwardedHeaders();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();

// Additional middleware
app.UseStaticFiles();
app.UseRouting();
app.UseAuthorization();
app.MapRazorPages();
app.MapHub<NoteHub>("/noteHub");

// Ensure database is created and migrations are applied
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    db.Database.EnsureCreated();
}

app.Run();
