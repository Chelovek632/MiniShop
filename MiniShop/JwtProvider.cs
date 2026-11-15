using MiniShop.Models;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using MiniShop.Interface;

namespace MiniShop
{
    public class JwtProvider : IJwtProvider
    {
        private readonly string _secretKey;
        private readonly string _issuer;
        private readonly string _audience;

        // Секрет берётся из конфигурации (user-secrets локально, env Jwt__Key в Docker)
        public JwtProvider(IConfiguration configuration)
        {
            var key = configuration["Jwt:Key"];
            if (string.IsNullOrWhiteSpace(key))
                throw new InvalidOperationException(
                    "Jwt:Key не настроен. Задайте его через user-secrets или переменную окружения Jwt__Key.");
            _secretKey = key;
            _issuer = configuration["Jwt:Issuer"] ?? "MiniShopApi";
            _audience = configuration["Jwt:Audience"] ?? "MiniShopClient";
        }

        public string GenerateToken(User user)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Login),
                new Claim(ClaimTypes.Role, user.Role)
            };

            var signingCredentials = new SigningCredentials(
                new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secretKey)),
                SecurityAlgorithms.HmacSha256
            );

            var token = new JwtSecurityToken(
                issuer: _issuer,
                audience: _audience,
                claims: claims,
                expires: DateTime.UtcNow.AddHours(3),
                signingCredentials: signingCredentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
