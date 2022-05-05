public partial class RootQuery
{
	[UseSingleOrDefault]
	[UseProjection]
	public IQueryable<User> Me(BlokiDbContext context)
	{
		return context.Users.Where((x) => x.Id == -1);
	}
}