using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Net;

namespace Reinders_Data_Mining_Web_App.Library
{
    class MyClient : WebClient
    {
        public bool HeadOnly { get; set; }
        protected override WebRequest GetWebRequest(Uri address)
        {
            WebRequest req = base.GetWebRequest(address);
            if (HeadOnly && req.Method == "GET")
            {
                req.Method = "HEAD";
            }
            return req;
        }
    }

    public class HTTPSocket
    {
        private string UserAgent = "Mozilla/5.0 " +
                                   "(Windows NT 6.1) " +
                                   "AppleWebKit/537.36 " +
                                   "(KHTML, like Gecko) " +
                                   "Chrome/41.0.2228.0 Safari/537.36";
        private string UrlField;
        private string HostField;

        public string Url
        {
            get { return UrlField; }
            set { UrlField = value; }
        }

        public string Host
        {
            get { return HostField; }
            set { HostField = value; }
        }

        public HTTPSocket(string url)
        {
            UrlField = url;
        }

        public string GetSource()
        {
            string content = "invalid";
            using (var client = new MyClient())
            {
                client.Headers.Set("User-Agent", UserAgent);
                client.Encoding = System.Text.Encoding.UTF8;
                try
                {
                    client.HeadOnly = true;
                    client.DownloadData(UrlField);
                    string type = client.ResponseHeaders["content-type"];
                    if (type.StartsWith(@"text/"))
                    {
                        client.HeadOnly = false;
                        content = client.DownloadString(UrlField);
                    }
                    Uri remoteUri = new Uri(UrlField);
                    HostField = remoteUri.Host;
                }
                catch { }
            }
            return content;
            
        }
    }
}