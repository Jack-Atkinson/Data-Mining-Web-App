using System.Web;
using System.Web.Optimization;

namespace Reinders_Data_Mining_Web_App
{
    public class BundleConfig
    {
        // For more information on bundling, visit http://go.microsoft.com/fwlink/?LinkId=301862
        public static void RegisterBundles(BundleCollection bundles)
        {
            bundles.Add(new ScriptBundle("~/bundles/jquery").Include(
                        "~/Scripts/jquery-{version}.js"));

            bundles.Add(new ScriptBundle("~/bundles/bootstrap").Include(
                      "~/Scripts/bootstrap.js",
                      "~/Scripts/respond.js",
                      "~/Scripts/bootstrap-select.js"));

            bundles.Add(new StyleBundle("~/Content/home").Include(
                      "~/Content/bootstrap.css",
                      "~/Content/core.css",
                      "~/Content/home.css",
                      "~/Content/bootstrap-select.css"));
        }
    }
}
