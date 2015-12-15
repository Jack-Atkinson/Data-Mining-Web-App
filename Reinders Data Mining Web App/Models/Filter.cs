using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Reinders_Data_Mining_Web_App.Models
{
    public class Filter
    {
        public string StartMarker { get; set; }
        public string Prefix { get; set; }
        public string Strip { get; set; }
        public string Column { get; set; } //now this could be another filter, do a check to see if it contains <elemsig>

    }
}