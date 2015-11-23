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
            string url = "http://www.kichler.com/products/product/impello-18-led-linear-bath-light-in-chrome-ch-4580.aspx";
            string result = "<base href=\"http://www.kichler.com/\" target=\"_self\">";
            HttpWebRequest webrequest = (HttpWebRequest)HttpWebRequest.Create(url);
            webrequest.Method = "GET";
            webrequest.ContentLength = 0;

            WebResponse response = webrequest.GetResponse();

            using (StreamReader stream = new StreamReader(response.GetResponseStream()))
            {
                result += stream.ReadToEnd();
            }
            result = result.Replace("<div", "<div id=\"testtarget\"");
            //result = result.Replace("display:none", "");
            return result;
        }
    }
}