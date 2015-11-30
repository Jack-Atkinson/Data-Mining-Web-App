using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Reinders_Data_Mining_Web_App.Models
{
    public class WebFilterModel
    {
        public string[] elementTree { get; set; }
        public string Signature { get; set; }
        public string EndMarker { get; set; }
        //http://stackoverflow.com/questions/21288462/c-sharp-mvc-4-passing-javascript-array-in-view-to-controller
    }
}