using System.Diagnostics;
using System.Text;
using HotChocolate.Execution;
using HotChocolate.Execution.Instrumentation;
using HotChocolate.Language;
using StackExchange.Profiling;

namespace Logging
{
   public class MiniProfilerQueryLogger : ExecutionDiagnosticEventListener
   {
      // this diagnostic event is raised when a request is executed ...
      public override IDisposable ExecuteRequest(IRequestContext context)
      {
         // ... we will return an activity scope that is used to signal when the request is
         // finished.
         return new RequestScope(context);
      }

      private class RequestScope : IDisposable
      {
         private readonly MiniProfiler miniProfiler;
         private readonly IRequestContext context;
         private readonly Stopwatch queryTimer;

         public RequestScope(IRequestContext ctx)
         {
            var httpCtx = ctx.ContextData["HttpContext"] as HttpContext;
            var name = ctx.Request.OperationName;
            var ip = httpCtx?.Connection.RemoteIpAddress;
            miniProfiler = MiniProfiler.StartNew($"{name} {ip}");
            context = ctx;
            queryTimer = Stopwatch.StartNew();
         }

         public void Dispose()
         {
            queryTimer.Stop();

            // when the request is finished it will dispose the activity scope and
            // this is when we print the parsed query.
            var variables = context.Variables;
            var queryString = context.Document;

            string htmlText;
            using (MiniProfiler.Current.Ignore()) // this does not seem to ignore as documented
            {
               htmlText = CreateHtmlFromDocument(queryString, variables, queryTimer);
            }

            if (miniProfiler is not null)
            {
               miniProfiler.AddCustomLink(htmlText, "#");
               miniProfiler.Stop();
            }
         }

         private static string CreateHtmlFromDocument(DocumentNode? queryString, IVariableValueCollection? variables, Stopwatch queryTimer)
         {
            StringBuilder htmlText = new();
            if (queryString is not null)
            {
               var divWithBorder =
                   "<div style=\"border: 1px solid black;align-items: flex-start;margin-left: 10%;margin-right: 15%; padding: 5px\">";
               var lineArray = queryString!.ToString(true)
                   .Split(
                       new[] { Environment.NewLine },
                       StringSplitOptions.None
                   ).ToList();
               htmlText.AppendLine(divWithBorder);
               htmlText.AppendLine("<b>GraphQL Query</b>");
               foreach (var s in lineArray)
               {
                  var str = "<p>" + s.Replace(" ", "&nbsp; ") + "</p>";
                  htmlText.AppendLine(str);
               }

               htmlText.AppendLine("</div>");

               if (variables is not null)
               {
                  try
                  {
                     var variablesConcrete = variables.ToList();
                     if (variablesConcrete.Count > 0)
                     {
                        htmlText.AppendLine(divWithBorder);
                        htmlText.AppendLine("<b>Variables</b><table>");
                        foreach (var variableValue in variablesConcrete!)
                        {
                           htmlText.Append("<tr>");
                           htmlText.AppendFormat(
                               $"<td>&nbsp;&nbsp;{variableValue.Name}</td><td>:</td><td>{variableValue.Value}</td><td>:</td><td>{variableValue.Type}</td>");
                           htmlText.Append("</tr>");
                        }

                        htmlText.Append("</table></div>");
                     }
                  }
                  catch
                  {
                     // all input type records will land here.
                     htmlText.AppendLine("  Formatting Variables Error. Continuing...");
                  }
               }

               htmlText.AppendLine(divWithBorder);
               htmlText.AppendFormat(
                   $"Execution time inside query is {queryTimer.Elapsed.TotalMilliseconds:0.#} milliseconds.");
               htmlText.AppendLine("</div>");
            }
            return htmlText.ToString();
         }
      }
   }
}
