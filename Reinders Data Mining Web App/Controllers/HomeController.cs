using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using Reinders_Data_Mining_Web_App.Models;
using System.Net;
using System.IO;
using HtmlAgilityPack;

namespace Reinders_Data_Mining_Web_App.Controllers
{
    public class HomeController : Controller
    {
        private WebPageData wpd = new WebPageData();
        // GET: Home
        public ActionResult Index()
        {
            return View();
        }

        public JsonResult UrlValidation(string url)
        {
            HttpWebRequest request = (HttpWebRequest)WebRequest.Create(url);
            request.Method = WebRequestMethods.Http.Head;
            bool pageExists;
            try
            {
                HttpWebResponse response = (HttpWebResponse)request.GetResponse();
                pageExists = response.StatusCode == HttpStatusCode.OK;
            }
            catch (Exception)
            {
                pageExists = false;
            }
            return Json(pageExists, JsonRequestBehavior.AllowGet);
        }

        public JsonResult GetTargetFrame(string url)
        {
            if (string.IsNullOrEmpty(url))
            {
                url = "";
                return Json(url, JsonRequestBehavior.AllowGet);
            }
            try
            {
                Uri remoteUri = new Uri(url);
                wpd.URL = url;
                wpd.Host = remoteUri.Host;
            }
            catch(UriFormatException)
            {
                url = "";
                return Json(url, JsonRequestBehavior.AllowGet);
            }
            string source;

            HttpWebRequest webrequest = (HttpWebRequest)HttpWebRequest.Create(wpd.URL);
            webrequest.Method = "GET";
            webrequest.ContentLength = 0;
            WebResponse response = webrequest.GetResponse();
            using (StreamReader stream = new StreamReader(response.GetResponseStream()))
            {
                source = stream.ReadToEnd();
            }


            HtmlDocument htmlDoc = new HtmlDocument();
            htmlDoc.LoadHtml(source);
            HtmlNode head = htmlDoc.DocumentNode.SelectSingleNode("//head");
            string newBaseContent = string.Format("<base href='http://{0}'/>", wpd.Host);
            string newCssLinkContent = "<link href=\"http://localhost:57409/Content/home.css\" rel=\"stylesheet\" type=\"text/css\">";
            HtmlNode newBase = HtmlNode.CreateNode(newBaseContent);
            HtmlNode newCssLink = HtmlNode.CreateNode(newCssLinkContent);
            head.PrependChild(newBase);
            head.PrependChild(newCssLink);
            wpd.Source = htmlDoc.DocumentNode.InnerHtml;
            return Json(wpd.Source, JsonRequestBehavior.AllowGet);
        }
    }
}