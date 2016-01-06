using System.Data.Entity;

namespace Reinders_Data_Mining_Web_App.Models
{
    public class Website
    {
        public int Id { get; set; }
        public string Domain { get; set; }
        public string GUID { get; set; }
    }

    public class WebsiteDBContext : DbContext
    {
        public DbSet<Website> Filters { get; set; }
    }
}