using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using HtmlAgilityPack;

namespace Reinders_Data_Mining_Web_App.Library
{
    public class BrowserDriver
    {
        private ChromeDriver Driver;

        public string PageSource
        {
            get { return Driver.PageSource; }
        }

        public string Url
        {
            get { return Driver.Url; }
        }

        public BrowserDriver()
        {
            Driver = new ChromeDriver(HttpContext.Current.Server.MapPath("~/App_Data"));
        }

        public void Close()
        {
            Driver.Close();
        }

        public void GoTo(string url)
        {
            Driver.Navigate().GoToUrl(url);
        }

        public void Click(string target)
        {
            Driver.FindElement(By.jQuery(target)).Click();
        }

        static public string GetHost(string url)
        {
            Uri remoteUri = new Uri(url);
            return remoteUri.Host;
        }
    }
}