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
            //string result = "<base href=\"http://www.kichler.com/\" target=\"_self\">";
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
            string newBaseContent = string.Format("<base href='http://{0}/'/>", wpd.Host);
            HtmlNode newBase = HtmlNode.CreateNode(newBaseContent);
            head.PrependChild(newBase);
            wpd.Source = htmlDoc.DocumentNode.InnerHtml;
            //wpd.Source = wpd.Source.Replace("<div", "<div id=\"testtarget\"");
            //result = result.Replace("display:none", "");
            return Json(wpd.Source, JsonRequestBehavior.AllowGet);
        }
    }
}