using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using OpenQA.Selenium;
using OpenQA.Selenium.Support;
using OpenQA.Selenium.Support.UI;
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
            Driver.Quit();
        }

        public void GoTo(string url)
        {
            Driver.Navigate().GoToUrl(url);
            System.Threading.Thread.Sleep(500);
        }

        public bool Click(string target)
        {
            try
            {
                Driver.FindElement(By.jQuery(target)).Click();
            } 
            catch
            {
                return false;
            }
            System.Threading.Thread.Sleep(500);
            return true;
        }

        public string GetElement(string target, bool includeOuter)
        {
            string outerHtml = null;
            try
            {
                string tagname = Driver.FindElement(By.jQuery(target)).TagName;
                string href = Driver.FindElement(By.jQuery(target)).GetAttribute("href");
                string src = Driver.FindElement(By.jQuery(target)).GetAttribute("src");
                if ((tagname == "a" || tagname == "img") &&
                    (href != null || src != null))
                {
                    switch(tagname)
                    {
                        case "img":
                            outerHtml = src;
                            break;
                        case "a":
                            outerHtml = href;
                            break;
                        default:
                            break;
                    }
                }
                else
                {
                    outerHtml = includeOuter ?
                        Driver.FindElement(By.jQuery(target)).GetAttribute("outerHTML") :
                        Driver.FindElement(By.jQuery(target)).GetAttribute("innerHTML"); //outerHTML
                }
            }
            catch
            {
                return outerHtml;
            }
            return outerHtml;
        }

        private void Wait()
        {
            WebDriverWait wait = new WebDriverWait(Driver, TimeSpan.FromSeconds(30.00));

            wait.Until(driver1 => ((IJavaScriptExecutor)Driver).ExecuteScript("return document.readyState").Equals("complete"));
        }

        static public string GetHost(string url)
        {
            Uri remoteUri = new Uri(url);
            return remoteUri.Host;
        }
    }
}