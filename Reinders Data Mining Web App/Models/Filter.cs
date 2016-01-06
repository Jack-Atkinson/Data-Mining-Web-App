using System.Data.Entity;

namespace Reinders_Data_Mining_Web_App.Models
{
    public class Filter
    {
        public int Id { get; set; }
        public string Selector { get; set; }
        public int Action { get; set; }
        public bool Required { get; set; }
        public string GUID { get; set; }
        public int Strip { get; set; }
        public int Order { get; set; }
    }

    public class FilterDBContext : DbContext
    {
        public DbSet<Filter> Filters { get; set; }
    }
}
