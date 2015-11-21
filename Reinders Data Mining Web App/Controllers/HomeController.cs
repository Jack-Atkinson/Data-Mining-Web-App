using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using Reinders_Data_Mining_Web_App.Models;
using System.Net;
using System.IO;

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

        public string Test() //wonderful hack to get around that bullshit SAME-ORIGIN crap websites do to "protect" themselves
        {
            string url = "http://www.theverge.com";
            string result;
            HttpWebRequest webrequest = (HttpWebRequest)HttpWebRequest.Create(url);
            webrequest.Method = "GET";
            webrequest.ContentLength = 0;

            WebResponse response = webrequest.GetResponse();

            using (StreamReader stream = new StreamReader(response.GetResponseStream()))
            {
                result = stream.ReadToEnd();
            }
            return result;
        }
    }
}