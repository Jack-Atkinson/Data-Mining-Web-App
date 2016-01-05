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

namespace Reinders_Data_Mining_Web_App.Library
{
    public class WebScraper
    {
        private string HostField;
        private List<string> LinksField;

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
            string connStr = ConfigurationManager.ConnectionStrings["FilterDBContext"].ConnectionString;
            string commStr = "SELECT * FROM Filters WHERE Domain='" + HostField + "'";
            List<Models.Filter> filters = new List<Models.Filter>();
            

            using (SqlConnection db = new SqlConnection(connStr))
            {
                db.Open();
                using (SqlCommand comm = new SqlCommand(commStr))
                {
                    comm.Connection = db;
                    SqlDataReader reader = comm.ExecuteReader();
                    Models.Filter currFilter;
                    try
                    {
                        while (reader.Read())
                        {
                            currFilter = new Models.Filter();
                            currFilter.Id = (int)reader[0];
                            currFilter.Signature = reader[1].ToString();
                            currFilter.Prefix = (reader[2] ?? String.Empty).ToString();
                            currFilter.Strip = (reader[3] ?? String.Empty).ToString();
                            currFilter.Column = reader[4].ToString();
                            currFilter.IsPrimary = (bool)reader[5];
                            currFilter.Domain = reader[6].ToString();
                            filters.Add(currFilter);
                        }
                    }
                    catch
                    {
                        throw new Exception("Check Database"); //if this throws that means a database column contained a null value when it wasnt allowed to
                    }
                }
            }

            filters = filters.OrderBy(x => x.IsPrimary != true)
                             .ThenBy(x => x.Column).ToList(); //Orders the list so that the primarykey is first, if not specified it will organize by column
            /*using(IE Browser = new IE())
                using (CsvFileWriter writer =
                    new CsvFileWriter(@"C:\Users\jacka\desktop\output.csv"))
                {
                    CsvRow row = new CsvRow();

                    foreach (string column in filters.Select(x => x.Column))
                            row.Add(column);
                    writer.WriteRow(row);
                    HtmlDocument source = new HtmlDocument();
                    string xpath;
                    string scrapedHtml;
                    foreach (string link in LinksField)
                    {
                        Browser.GoTo(link);
                        Browser.WaitForComplete();
                        source.LoadHtml(Browser.Body.Parent.OuterHtml);
                        row = new CsvRow();
                        bool shouldContinue = false;
                        foreach (Models.Filter filter in filters)
                        {
                            if (shouldContinue)
                                continue;
                            HtmlNode element = source.DocumentNode.SelectSingleNode(xpath); //make it so that if primary is true, and it's not found then skip the whole loop
                            if (element == null)
                            {
                                if (filter.IsPrimary) //basically if the primary key doesnt exist on the page we skip the whole page
                                {
                                    shouldContinue = true;
                                    continue;
                                }
                                row.Add("");
                            }
                            else
                            {
                                scrapedHtml = element.InnerHtml;
                                scrapedHtml = Regex.Replace(scrapedHtml, @"\t|\n|\r", ""); //this is where we insert out cleaner function and unit changer
                                row.Add(scrapedHtml);
                            }
                        }
                        if(!shouldContinue)
                            writer.WriteRow(row);

                    }

                }*/

            return 0;
        }


    }
}