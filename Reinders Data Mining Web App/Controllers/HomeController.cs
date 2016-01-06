using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using Reinders_Data_Mining_Web_App.Models;
using Reinders_Data_Mining_Web_App.Library;
using System.IO;
using System.Threading.Tasks;
using System.Threading;
using HtmlAgilityPack;

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
            return View();
        }

        // GET: Goto
        public JsonResult Goto(string url)
        {
            BrowserDriver browser = new BrowserDriver();
            browser.GoTo(url);
            string source = browser.PageSource;
            UpdateBase(ref source, url);
            browser.Close();
            return Json(source, JsonRequestBehavior.AllowGet);
        }

        // GET: Click
        public JsonResult Click(string url, string target)
        {
            BrowserDriver browser = new BrowserDriver();
            browser.GoTo(url);
            browser.Click(target);
            string source = browser.PageSource;
            UpdateBase(ref source, url);
            var result = new { Url = browser.Url, Src = source };
            browser.Close();
            return Json(result, JsonRequestBehavior.AllowGet);
        }


        private void UpdateBase(ref string pageSource, string url)
        {
            string host = BrowserDriver.GetHost(url);
            HtmlDocument htmlDoc = new HtmlDocument();
            htmlDoc.LoadHtml(pageSource);
            htmlDoc.DocumentNode.Descendants()
                            .Where(x => x.Name == "script")
                            .ToList()
                            .ForEach(x => x.Remove());


            HtmlNodeCollection test = htmlDoc.DocumentNode.SelectNodes("//link[@href and @type='text/css']"); //get css from website, download the css, modify the css removing :hover classes
            HtmlNode head = htmlDoc.DocumentNode.SelectSingleNode("//head");
            if (head != null)
            {
                string newBaseContent = string.Format("<base id='basedomain' href='http://{0}'/>", host);
                HtmlNode newBase = HtmlNode.CreateNode(newBaseContent);
                head.PrependChild(newBase);
                pageSource = htmlDoc.DocumentNode.OuterHtml;
            }
        }

        [AcceptVerbs(HttpVerbs.Post)]
        public ActionResult FileUpload(HttpPostedFileBase uploadFile)
        {
            if (uploadFile != null && uploadFile.ContentLength > 0) // null error if no file is selected, fix this
            {
                string filePath = Path.Combine(HttpContext.Server.MapPath("../Uploads"),
                                               Path.GetFileName(uploadFile.FileName));
                if (Path.GetExtension(filePath) != ".txt")
                    return new EmptyResult();

                /*uploadFile.SaveAs(filePath);
                int result = 0;
                WebScraper ws = new WebScraper(filePath);
                Thread thread = new Thread(() => { result = ws.BeginScrape(); });
                thread.SetApartmentState(ApartmentState.STA); //Set the thread to STA
                thread.Start();
                thread.Join();*/
            }
            
            return new EmptyResult();
        }
    }
}