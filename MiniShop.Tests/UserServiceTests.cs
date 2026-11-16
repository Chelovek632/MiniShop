using MiniShop.Services;

namespace MiniShop.Tests
{
    public class UserServiceTests
    {
        private static (UserService svc, TestDb db) Setup()
        {
            var db = new TestDb();
            return (new UserService(db.Context), db);
        }

        [Fact]
        public async Task Register_ShortLogin_Throws()
        {
            var (svc, db) = Setup();
            using (db)
            {
                var ex = await Assert.ThrowsAsync<AppException>(() => svc.Register("ab", "password1"));
                Assert.Contains("3 символов", ex.Message);
            }
        }

        [Fact]
        public async Task Register_ShortPassword_Throws()
        {
            var (svc, db) = Setup();
            using (db)
            {
                var ex = await Assert.ThrowsAsync<AppException>(() => svc.Register("newuser", "123"));
                Assert.Contains("6 символов", ex.Message);
            }
        }

        [Fact]
        public async Task Register_EmptyLogin_Throws()
        {
            var (svc, db) = Setup();
            using (db)
            {
                await Assert.ThrowsAsync<AppException>(() => svc.Register("", "password1"));
            }
        }

        [Fact]
        public async Task Register_DuplicateLogin_Throws()
        {
            var (svc, db) = Setup();
            using (db)
            {
                await svc.Register("firstuser", "password1");
                var ex = await Assert.ThrowsAsync<AppException>(() => svc.Register("firstuser", "password2"));
                Assert.Contains("уже существует", ex.Message);
            }
        }

        [Fact]
        public async Task Register_ThenLogin_Succeeds()
        {
            var (svc, db) = Setup();
            using (db)
            {
                await svc.Register("gooduser", "password1");
                var user = await svc.Login("gooduser", "password1");

                Assert.Equal("gooduser", user.Login);
                Assert.Equal("Customer", user.Role);
            }
        }

        [Fact]
        public async Task Login_WrongPassword_Throws()
        {
            var (svc, db) = Setup();
            using (db)
            {
                await svc.Register("gooduser", "password1");
                var ex = await Assert.ThrowsAsync<AppException>(() => svc.Login("gooduser", "wrongpass"));
                Assert.Contains("Неверное имя пользователя", ex.Message);
            }
        }

        [Fact]
        public async Task Login_UnknownUser_Throws()
        {
            var (svc, db) = Setup();
            using (db)
            {
                await Assert.ThrowsAsync<AppException>(() => svc.Login("ghost", "password1"));
            }
        }
    }
}
