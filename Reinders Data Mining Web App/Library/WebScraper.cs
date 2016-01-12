using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Configuration;
using HtmlAgilityPack;
using System.Data.SqlClient;
using System.Text;
using ReadWriteCsv;
using System.IO;
using System.Text.RegularExpressions;
using Reinders_Data_Mining_Web_App.Models;

namespace Reinders_Data_Mining_Web_App.Library
{
    public class WebScraper
    {
        private string HostField;
        private List<string> LinksField;
        private FilterDBContext filterDb = new FilterDBContext();
        private WebsiteDBContext websiteDb = new WebsiteDBContext();

        public string Host
        {
            get { return HostField; }
        }

        public List<string> Links
        {
            get { return LinksField; }
        }

        public WebScraper(string linkFilePath)
        {
            //WatiN.Core.Settings.MakeNewIeInstanceVisible = false; //for some reason if this is set, WaTiN is super slow
            LinksField = new List<string>();
            foreach (string link in System.IO.File.ReadLines(linkFilePath))
                LinksField.Add(link);
            HostField = "http://" + new Uri(LinksField.First()).Host;
        }

        public int BeginScrape()
        {
            List<Models.Website> websites = websiteDb.Websites.Where(x => x.Domain == HostField).ToList();
            string guid = websites[0].GUID;
            List<Models.Filter> filters = filterDb.Filters.Where(x => x.GUID == guid).ToList();
            BrowserDriver driver = new BrowserDriver();

            //filters = filters.OrderBy(x => x.Id)
            //.ThenBy(x => x.Column).ToList(); //Orders the list so that the primarykey is first, if not specified it will organize by column
            using (CsvFileWriter writer =
                new CsvFileWriter(@"C:\Users\jatkinson\desktop\output.csv"))
            {
                CsvRow row = new CsvRow();

                foreach (Models.Filter filter in filters.Where(x => x.Action == 0))
                    row.Add(filter.Column);
                writer.WriteRow(row);
                foreach (string link in LinksField)
                {
                    driver.GoTo(link);
                    row = new CsvRow();
                    foreach(Models.Filter filter in filters)
                    {
                        bool skip = false;
                        switch (filter.Action)
                        {
                            case 0:
                                string result = driver.GetElement(filter.Selector, false);
                                if(result != null)
                                {
                                    foreach (Models.Filter igfilter in filterDb.Filters.Where(x => x.Action == 1))
                                    {
                                        string ignoreexists = driver.GetElement(igfilter.Selector, true);
                                        if(ignoreexists != null)
                                        {
                                            result = result.Replace(ignoreexists, "");
                                        }
                                    }
                                    result = Regex.Replace(result, @"\s*(?<capture><(?<markUp>\w+)>.*<\/\k<markUp>>)\s*", "${capture}", RegexOptions.Singleline);
                                    result = result.Replace("\t", "");
                                    result = result.Replace("\r", "");
                                    result = result.Replace("\n", "");
                                    row.Add(result);
                                }
                                else
                                {
                                    if (filter.Required)
                                        skip = true;
                                    else
                                        row.Add("");
                                }
                                break;
                            case 1://make this work for the new engine
                                break;
                            case 2:
                                bool didClick = driver.Click(filter.Selector);
                                if (!didClick)
                                    if (filter.Required)
                                        skip = true;
                                break;
                            default:
                                break;

                        }
                        if (skip)
                        {
                            row = null;
                            break;
                        }
                    }
                    if (row != null)
                        writer.WriteRow(row);


                }

            }

            driver.Close();
            return 0;
        }


    }
}