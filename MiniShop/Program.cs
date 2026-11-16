
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;
using Microsoft.IdentityModel.Tokens;
using MiniShop.Interface;
using MiniShop.Middleware;
using MiniShop.Services;
using System.Text;
using System.Threading.RateLimiting;

namespace MiniShop
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);


            builder.Services.AddControllers()
                .AddJsonOptions(options =>
                {
                    options.JsonSerializerOptions.Converters.Add(
                        new JsonStringEnumConverter()
                    );
                });

            // Ошибки валидации ModelState → {error: "..."} (тот же формат, что у бизнес-ошибок)
            builder.Services.Configure<ApiBehaviorOptions>(options =>
            {
                options.InvalidModelStateResponseFactory = context =>
                {
                    var error = string.Join("; ", context.ModelState.Values
                        .SelectMany(v => v.Errors)
                        .Select(e => string.IsNullOrWhiteSpace(e.ErrorMessage) ? "Некорректный запрос" : e.ErrorMessage));
                    return new BadRequestObjectResult(new { error });
                };
            });

            builder.Services.AddDbContext<AppDbContext>(options =>
                options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
            // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
            builder.Services.AddScoped<IProductService, ProductService>();
            builder.Services.AddScoped<IUserService, UserService>();
            builder.Services.AddScoped<IOrderService, OrderService>();
            builder.Services.AddScoped<ICartService, CartService>();
            builder.Services.AddScoped<ICategoryService, CategoryService>();
            builder.Services.AddScoped<IJwtProvider, JwtProvider>();

            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen(c =>
            {
                c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
                {
                    Description = "JWT Authorization header using the Bearer scheme. Example: 'Bearer {token}'",
                    Name = "Authorization",
                    In = Microsoft.OpenApi.Models.ParameterLocation.Header,
                    Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
                    Scheme = "Bearer"
                });

                c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
            {
                {
                    new Microsoft.OpenApi.Models.OpenApiSecurityScheme
                    {
                        Reference = new Microsoft.OpenApi.Models.OpenApiReference
                        {
                            Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                            Id = "Bearer"
                        }
                    },
                    new string[] {}
                }
                });
            });


            builder.WebHost.UseUrls("http://0.0.0.0:5000");

            builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    var jwtKey = builder.Configuration["Jwt:Key"];
                    if (string.IsNullOrWhiteSpace(jwtKey))
                        throw new InvalidOperationException(
                            "Jwt:Key не настроен. Задайте его через user-secrets или переменную окружения Jwt__Key.");
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = true,
                        ValidateAudience = true,
                        ValidateLifetime = true,
                        ValidateIssuerSigningKey = true,

                        ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "MiniShopApi",
                        ValidAudience = builder.Configuration["Jwt:Audience"] ?? "MiniShopClient",
                        IssuerSigningKey = new SymmetricSecurityKey(
                            Encoding.UTF8.GetBytes(jwtKey))
                    };
                });
            builder.Services.AddCors(options => {
                options.AddPolicy("AllowFrontend", policy => {
                    policy.WithOrigins(
                            "http://127.0.0.1:5500",
                            "http://localhost:5500"
                        )
                        .AllowAnyHeader()
                        .AllowAnyMethod();
                });
            });

            builder.Services.AddAuthorization();

            // Rate limiting на auth-эндпоинты: 10 запросов / 10 секунд с одного IP
            builder.Services.AddRateLimiter(options =>
            {
                options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
                options.AddPolicy("auth", httpContext =>
                    RateLimitPartition.GetFixedWindowLimiter(
                        partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                        factory: _ => new FixedWindowRateLimiterOptions
                        {
                            PermitLimit = 10,
                            Window = TimeSpan.FromSeconds(10)
                        }));
                options.OnRejected = async (context, token) =>
                {
                    context.HttpContext.Response.ContentType = "application/json; charset=utf-8";
                    await context.HttpContext.Response.WriteAsync(
                        "{\"error\":\"Слишком много попыток. Подождите немного.\"}", token);
                };
            });


            var app = builder.Build();

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            //app.UseHttpsRedirection();
            app.UseCors("AllowFrontend");
            app.UseRateLimiter();

            // Статика: картинки товаров из wwwroot/uploads
            app.UseStaticFiles();

            app.UseMiddleware<ErrorHandlingMiddleware>();
            app.UseAuthentication();
            app.UseAuthorization();


            app.MapControllers();
            app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

            // Seed админа из конфигурации (Seed:AdminLogin / Seed:AdminPassword)
            using (var scope = app.Services.CreateScope())
            {
                var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var adminLogin = config["Seed:AdminLogin"];
                var adminPassword = config["Seed:AdminPassword"];

                if (!string.IsNullOrWhiteSpace(adminLogin) && !string.IsNullOrWhiteSpace(adminPassword))
                {
                    var exists = db.Users.Any(u => u.Login == adminLogin);
                    if (!exists)
                    {
                        db.Users.Add(new Models.User
                        {
                            Login = adminLogin,
                            PasswordHash = BCrypt.Net.BCrypt.HashPassword(adminPassword),
                            Role = "Admin"
                        });
                        db.SaveChanges();
                        Console.WriteLine($"[Seed] Создан администратор '{adminLogin}'");
                    }
                }
            }

            app.Run();
        }
    }
}
