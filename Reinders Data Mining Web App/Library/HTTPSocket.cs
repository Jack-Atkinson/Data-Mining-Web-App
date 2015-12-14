using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Net;
using System.Text;
using System.IO;

namespace Reinders_Data_Mining_Web_App.Library
{
    class MyClient : WebClient
    {
        public bool HeadOnly { get; set; }
        protected override WebRequest GetWebRequest(Uri address)
        {
            HttpWebRequest req = base.GetWebRequest(address) as HttpWebRequest;
            if (HeadOnly && req.Method == "GET")
            {
                req.Method = "HEAD";
            }
            req.AutomaticDecompression = DecompressionMethods.Deflate | DecompressionMethods.GZip;
            return req;
        }
    }

    public class HTTPSocket
    {
        private string UserAgent = "Mozilla/5.0 " +
                                   "(Windows NT 6.1; WOW64) " +
                                   "AppleWebKit/537.36 " +
                                   "(KHTML, like Gecko) " +
                                   "Chrome/47.0.2526.80 Safari/537.36";
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
                client.Headers.Add("User-Agent", UserAgent);
                client.Headers.Add("Accept-Encoding", "gzip, deflate");
                client.Encoding = System.Text.Encoding.UTF8;
                try
                {
                    client.HeadOnly = true;
                    client.DownloadData(UrlField);
                    string type = client.ResponseHeaders["content-type"];

                    if (type.StartsWith(@"text/"))
                    {
                        client.Headers.Add("User-Agent", UserAgent);
                        client.Headers.Add("Accept-Encoding", "gzip, deflate");
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

        public string GetSource1()
        {
            string content = "invalid";

            WebRequest req = WebRequest.Create(UrlField);
            WebResponse resp = req.GetResponse();
            using (var sr = new StreamReader(resp.GetResponseStream()))
            {
                content = sr.ReadToEnd();
                sr.Close();
            }
            Uri remoteUri = new Uri(UrlField);
            HostField = remoteUri.Host;
            return content;
        }
    }
}