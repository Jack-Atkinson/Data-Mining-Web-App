//====================================================
//| Downloaded From                                  |
//| Visual C# Kicks - http://www.vcskicks.com/       |
//| License - http://www.vcskicks.com/license.php    |
//====================================================

using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Web;
using System.Threading;
using OpenQA.Selenium;
using OpenQA.Selenium.Remote;

namespace Reinders_Data_Mining_Web_App.Library
{
    public static class SeleniumExtensions
    {
        /// <summary>
        /// Return whether jQuery is loaded in the current page
        /// </summary>
        public static bool jQueryLoaded(this RemoteWebDriver driver)
        {
            bool result = false;
            try
            {
                result = (bool)driver.ExecuteScript("return typeof jQuery == 'function'");
            }
            catch (WebDriverException)
            {
            }

            return result;
        }

        /// <summary>
        /// Load jQuery from an external URL to the current page
        /// </summary>
        public static void LoadjQuery(this RemoteWebDriver driver, TimeSpan? timeout = null)
        {
            //Get the url to load jQuery from
            string jQueryURL = HttpContext.Current.Server.MapPath("~/Scripts/jquery-2.1.4.min.js");

            //Script to load jQuery from external site
            string loadingScript =
                @"if (typeof jQuery != 'function')
                  {
                      var headID = document.getElementsByTagName('head')[0];
                      var newScript = document.createElement('script');
                      newScript.type = 'text/javascript';
                      newScript.src = '" + jQueryURL + @"';
                      headID.appendChild(newScript);
                  }
                  return (typeof jQuery == 'function');";

            bool loaded = (bool)driver.ExecuteScript(loadingScript);

            if (!loaded)
            {
                //Wait for the script to load
                //Verify library loaded
                if (!timeout.HasValue)
                    timeout = new TimeSpan(0, 0, 30);

                int timePassed = 0;
                while (!driver.jQueryLoaded())
                {
                    Thread.Sleep(500);
                    timePassed += 500;

                    if (timePassed > timeout.Value.TotalMilliseconds)
                        throw new Exception("Could not load jQuery");
                }
            }

            string v = driver.ExecuteScript("return jQuery.fn.jquery").ToString();
        }

        /// <summary>
        /// Overloads the FindElement function to include support for the jQuery selector class
        /// </summary>
        public static IWebElement FindElement(this RemoteWebDriver driver, By.jQueryBy by)
        {
            //First make sure we can use jQuery functions
            driver.LoadjQuery();

            //Execute the jQuery selector as a script
            IWebElement element = driver.ExecuteScript("return jQuery" + by.Selector + ".get(0)") as IWebElement;

            if (element != null)
                return element;
            else
                throw new NoSuchElementException("No element found with jQuery command: jQuery" + by.Selector);
        }

        /// <summary>
        /// Overloads the FindElements function to include support for the jQuery selector class
        /// </summary>
        public static ReadOnlyCollection<IWebElement> FindElements(this RemoteWebDriver driver, By.jQueryBy by)
        {
            //First make sure we can use jQuery functions
            driver.LoadjQuery();

            //Execute the jQuery selector as a script
            ReadOnlyCollection<IWebElement> collection = driver.ExecuteScript("return jQuery" + by.Selector + ".get()") as ReadOnlyCollection<IWebElement>;

            //Unlike FindElement, FindElements does not throw an exception if no elements are found
            //and instead returns an empty list
            if (collection == null)
                collection = new ReadOnlyCollection<IWebElement>(new List<IWebElement>()); //empty list

            return collection;
        }
    }

    public class By : OpenQA.Selenium.By
    {
        /// <summary>
        /// jQuery selector
        /// </summary>
        public static jQueryBy jQuery(string selector)
        {
            return new jQueryBy("(\"" + selector + "\")");
        }

        /// <summary>
        /// Specialized "By" class for jQuery selector
        /// </summary>
        public class jQueryBy
        {
            public string Selector
            {
                get;
                set;
            }

            public jQueryBy(string selector)
            {
                this.Selector = selector;
            }

            #region ----Tree Traversal----

            public jQueryBy Children(string selector = "")
            {
                return Function("children", selector);
            }

            public jQueryBy Closest(string selector = "")
            {
                return Function("closest", selector);
            }

            public jQueryBy Find(string selector = "")
            {
                return Function("find", selector);
            }

            public jQueryBy Next(string selector = "")
            {
                return Function("next", selector);
            }

            public jQueryBy NextAll(string selector = "")
            {
                return Function("nextAll", selector);
            }

            public jQueryBy NextUntil(string selector = "", string filter = "")
            {
                return Function("nextUntil", selector, filter);
            }

            public jQueryBy OffsetParent()
            {
                return Function("offsetParent");
            }

            public jQueryBy Parent(string selector = "")
            {
                return Function("parent", selector);
            }

            public jQueryBy Parents(string selector = "")
            {
                return Function("parents", selector);
            }

            public jQueryBy ParentsUntil(string selector = "", string filter = "")
            {
                return Function("parentsUntil", selector, filter);
            }

            public jQueryBy Prev(string selector = "")
            {
                return Function("prev", selector);
            }

            public jQueryBy PrevAll(string selector = "")
            {
                return Function("prevAll", selector);
            }

            public jQueryBy PrevUntil(string selector = "", string filter = "")
            {
                return Function("prevUntil", selector, filter);
            }

            public jQueryBy Siblings(string selector = "")
            {
                return Function("siblings", selector);
            }

            #endregion

            #region -----Filtering----

            public jQueryBy Eq(int index)
            {
                return Function("eq", index.ToString());
            }

            public jQueryBy First()
            {
                return Function("first");
            }

            public jQueryBy Has(string selector)
            {
                return Function("has", selector);
            }

            public jQueryBy Last()
            {
                return Function("last");
            }

            public jQueryBy Not(string selector)
            {
                return Function("not", selector);
            }

            #endregion

            private jQueryBy Function(string func, string selector = "", string additionalArg = "")
            {
                //Add quotes to selector
                if (selector != "")
                    selector = "\"" + selector + "\"";

                //Add additional paramater
                if (additionalArg != "")
                    selector += ",\"" + additionalArg + "\"";

                //Add either: .func() or .func("selector") to original selector
                return new jQueryBy(this.Selector + "." + func + "(" + selector + ")");
            }
        }
    }
}