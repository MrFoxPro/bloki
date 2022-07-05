using Microsoft.AspNetCore.SignalR;

class MultiplayerHub : Hub
{
   public override Task OnConnectedAsync()
   {
      var httpContext = Context.GetHttpContext();
      var docId = httpContext?.Request.Query["docId"].SingleOrDefault();

      if (string.IsNullOrEmpty(docId))
      {
         Context.Abort();
         return Task.CompletedTask;
      }

      return base.OnConnectedAsync();
   }
   public override Task OnDisconnectedAsync(Exception? exception)
   {
      return base.OnDisconnectedAsync(exception);
   }
}
