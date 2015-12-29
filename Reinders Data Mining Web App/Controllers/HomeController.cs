using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using Reinders_Data_Mining_Web_App.Models;
using Reinders_Data_Mining_Web_App.Library;
using System.IO;
using HtmlAgilityPack;
using System.Threading.Tasks;
using WatiN.Core;
using System.Threading;
using Awesomium.Core;


/*
TODO:
    Add "GO" button
    make file upload and webscraper work together
    make download button for csv
    make it so that if the isprimary key is set and the current page doesnt contain the key, then skip it
*/

namespace Reinders_Data_Mining_Web_App.Controllers
{
    public class HomeController : Controller
    {
        // GET: Home
        public ActionResult Index()
        {
            /*string test = "Hello";
            ViewBag.Test = test;*/
            return View();
        }

        public JsonResult Test()
        {
            string blah = "This is test reply";
            return Json(blah, JsonRequestBehavior.AllowGet);
           
        }

        public JsonResult GetTargetSource(string url)
        {
            HTTPSocket socket = new HTTPSocket(url);
            socket.GetSource();

            Uri remoteUri = new Uri(url);
            string host = remoteUri.Host;
            string source = null; // socket.GetSource();
            Thread thread = new Thread(() => { source = GetSource(url); });
            thread.SetApartmentState(ApartmentState.STA); //Set the thread to STA
            thread.Start();
            thread.Join();


            HtmlDocument htmlDoc = new HtmlDocument(); //urgh sooo ugly
            htmlDoc.LoadHtml(source);
            htmlDoc.DocumentNode.Descendants()
                            .Where(x => x.Name == "script")
                            .ToList()
                            .ForEach(x => x.Remove());
            HtmlNode head = htmlDoc.DocumentNode.SelectSingleNode("//head");
            if(head != null)
            {
                string newBaseContent = string.Format("<base id='basedomain' href='http://{0}'/>", host); //socket.Host
                string newCssLinkContent = "<link href=\"/Content/remote.css\" rel=\"stylesheet\" type=\"text/css\">";
                HtmlNode newBase = HtmlNode.CreateNode(newBaseContent);
                HtmlNode newCssLink = HtmlNode.CreateNode(newCssLinkContent);
                head.PrependChild(newBase);
                head.PrependChild(newCssLink);
                source = htmlDoc.DocumentNode.InnerHtml;
                }
            else
            {
                source = "invalid";
            }
            return Json(source, JsonRequestBehavior.AllowGet);
        }

        [AcceptVerbs(HttpVerbs.Post)]
        public ActionResult FileUpload(HttpPostedFileBase uploadFile)
        {
            if (uploadFile != null && uploadFile.ContentLength > 0) // null error if no file is selected, fix this
            {
                string filePath = Path.Combine(HttpContext.Server.MapPath("../Uploads"),
                                               Path.GetFileName(uploadFile.FileName));
                if (Path.GetExtension(filePath) != ".txt")
                    return RedirectToAction("Index");

                uploadFile.SaveAs(filePath);
                int result = 0;
                WebScraper ws = new WebScraper(filePath);
                Thread thread = new Thread(() => { result = ws.BeginScrape(); });
                thread.SetApartmentState(ApartmentState.STA); //Set the thread to STA
                thread.Start();
                thread.Join();
            }
            
            return RedirectToAction("Index");
        }

        private string GetSource(string url)
        {
            string doc = null;
            using (IE Browser = new IE())
            {
                bool notComplete = true;
                while (notComplete)
                {
                    try
                    {
                        Browser.GoTo(url);
                        Browser.WaitForComplete();
                        notComplete = false;
                    }
                    catch
                    {
                        Browser.Refresh();
                    }
                }
                while (Browser.Body.Parent.OuterHtml == null) { }
                doc = Browser.Body.Parent.OuterHtml;
            }

            return doc;
        }

        private string AwesomiumTest(string url)
        {
            string source = null;

            WebCore.Initialize(WebConfig.Default);

            using (WebSession session = WebCore.CreateWebSession(WebPreferences.Default))
            {
                using (WebView view = WebCore.CreateWebView(0, 0, Web))
                {

                }
            }

            return source;
        }
    }
}