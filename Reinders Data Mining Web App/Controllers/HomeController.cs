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

        private FilterDBContext filterDb = new FilterDBContext();
        private WebsiteDBContext websiteDb = new WebsiteDBContext();

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
            var result = new { Url = browser.Url, Src = source};
            browser.Close();
            return Json(result, JsonRequestBehavior.AllowGet);
        }

        [HttpPost]
        public JsonResult AddFilter([Bind(Include = "Selector, Action, Required, GUID, Strip, Column")] Models.Filter filter)
        {
            filterDb.Filters.Add(filter);
            filterDb.SaveChanges();
            return Json(true, JsonRequestBehavior.DenyGet);
        }

        public JsonResult GetClusters(string Domain)
        {
            if (Domain == null)
                return Json(false, JsonRequestBehavior.AllowGet);
            List<Models.Website> websites = websiteDb.Websites.Where(x => x.Domain == Domain).ToList();
            if (websites == null)
                return Json(false, JsonRequestBehavior.AllowGet);
            return Json(websites, JsonRequestBehavior.AllowGet);
        }

        public JsonResult GetFilters(string guid)
        {
            if(guid == null)
                return Json(false, JsonRequestBehavior.AllowGet);
            List<Models.Filter> filters = filterDb.Filters.Where(x => x.GUID == guid).ToList();
            if(filters == null)
                return Json(false, JsonRequestBehavior.AllowGet);
            return Json(filters, JsonRequestBehavior.AllowGet);
        }

        [HttpPost]
        public JsonResult DeleteFilter(int? Id)
        {
            if(Id == null)
                return Json(false, JsonRequestBehavior.AllowGet);
            Models.Filter filter = filterDb.Filters.Find(Id);
            bool result = false;
            if(filter != null)
            {
                filterDb.Filters.Remove(filter);
                filterDb.SaveChanges();
                result = true;
            }
            return Json(result, JsonRequestBehavior.DenyGet);

        }

        [HttpPost]
        public JsonResult UpdateFilter([Bind(Include = "Id, Selector, Action, Required, GUID, Column")] Models.Filter filter)
        {
            filterDb.Entry(filter).State = System.Data.Entity.EntityState.Modified;
            filterDb.SaveChanges();
            return Json(true, JsonRequestBehavior.DenyGet);
        }


        private void UpdateBase(ref string pageSource, string url)
        {
            string host = string.Format("http://{0}", BrowserDriver.GetHost(url));

            List <Models.Website> existingFilters = websiteDb.Websites.Where(x => x.Domain == host).ToList();
            
            if(existingFilters.Count == 0)
            {
                string guid = Guid.NewGuid().ToString().Replace("-", "");
                Website website = new Website() { Domain = host, GUID = guid, Name = guid };
                websiteDb.Websites.Add(website);
                websiteDb.SaveChanges();
            }

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
                string newBaseContent = string.Format("<base id='basedomain' href='{0}'/>", host);
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