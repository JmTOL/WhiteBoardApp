using WhiteBoardApp.Hubs;
using Microsoft.EntityFrameworkCore;
using WhiteBoardApp.Data;
using StackExchange.Redis;
using DotNetEnv;
using Microsoft.AspNetCore.HttpOverrides;

var builder = WebApplication.CreateBuilder(args);

var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
builder.WebHost.UseUrls($"http://*:{port}");

// Load environment variables from .env file if it exists
Env.Load();

builder.Services.AddSignalR();
var fallbackDbPath = Path.Combine(AppContext.BaseDirectory, "local.db");
var sqliteConnection = $"Data Source={fallbackDbPath}";
builder.Services.AddDbContext<ApplicationDbContext>(options => options.UseSqlite(sqliteConnection));


builder.Services.AddRazorPages();

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
});
builder.Services.AddHttpsRedirection(options =>
{

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
