using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Data.Entity;

namespace Reinders_Data_Mining_Web_App.Models
{
    public class Filter
    {
        public int Id { get; set; }
        public string Signature { get; set; }
        public string Prefix { get; set; }
        public string Strip { get; set; }
        public string Column { get; set; } //now this could be another filter, do a check to see if it contains <elemsig>
        public bool IsPrimary { get; set; }
        public string Domain { get; set; }
    }

    public class FilterDBContext : DbContext
    {
        public DbSet<Filter> Filters { get; set; }

        protected override void OnModelCreating(DbModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Filter>().ToTable("Filters");
            base.OnModelCreating(modelBuilder);
        }
    }
}
