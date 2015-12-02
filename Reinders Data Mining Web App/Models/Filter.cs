using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Reinders_Data_Mining_Web_App.Models
{
    public class Filter
    {
        public string StartMarker { get; set; }
        public string EndMarker { get; set; }
        public string Prefix { get; set; }
        public string Strip { get; set; }
        public string Offset { get; set; } //should this just be automatically computed
        public bool IsColumn { get; set; }

    }
}