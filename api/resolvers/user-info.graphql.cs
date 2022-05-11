public partial class RootQuery
{
   // [UseSingleOrDefault]
   // [UseProjection]
   public User Me(BlokiDbContext context)
   {
   	return null;
   }

}


public partial class RootMutation
{
   [UseMutationConvention]
   public async Task<User?> Register(BlokiDbContext context)
   {
      return null;
   }
}
