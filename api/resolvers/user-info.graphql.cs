using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

public partial class RootQuery
{
   [UseSingleOrDefault]
   [UseProjection]
   public IQueryable<User> Me(BlokiDbContext context)
   {
      return context.Users.Where((x) => x.Id == -1);
   }
}


public partial class RootMutation
{
   // [UseMutationConvention]
   public async Task<SignInResult> Login(string userName, string password, [Service] SignInManager<User> signInManager)
   {
      var result = await signInManager.PasswordSignInAsync(userName, password, true, false);
      return result;
   }

   [UseMutationConvention]
   public async Task<IdentityResult> Register(string userName, string password, [Service] UserManager<User> userManager)
   {
      var user = new User
      {
         UserName = userName,
      };

      var result = await userManager.CreateAsync(user, password);
      return result;
   }
}
