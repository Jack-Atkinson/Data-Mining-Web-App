using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity;
using System.Linq;
using System.Net;
using System.Web;
using System.Web.Mvc;
using Reinders_Data_Mining_Web_App.Models;
using System.Data.Entity.Core.Objects;

namespace Reinders_Data_Mining_Web_App.Controllers
{
    public class FiltersController : Controller
    {
        private FilterDBContext db = new FilterDBContext();

        public FilterDBContext Database
        {
            get { return db; }
        }

        // GET: Filters
        public ActionResult Index()
        {
            return View(db.Filters.ToList());
        }

        // GET: Filters/Details/5
        public JsonResult Details(int? id)
        {
            if (id == null)
            {
                return Json(false, JsonRequestBehavior.AllowGet);
            }
            Models.Filter filter = db.Filters.Find(id);
            if (filter == null)
            {
                return Json(false, JsonRequestBehavior.AllowGet);
            }
            return Json(filter, JsonRequestBehavior.AllowGet);
        }

        // POST: Filters/GetFilters
        [HttpPost]
        public JsonResult GetFilters(string domain)
        {
            List<Models.Filter> filters = new List<Models.Filter>();

            filters = db.Filters.Where(f => f.Domain == domain).ToList();

            return Json(filters, JsonRequestBehavior.AllowGet);
        }

        // GET: Filters/Create
        public ActionResult Create()
        {
            return View();
        }

        // POST: Filters/Create
        // To protect from overposting attacks, please enable the specific properties you want to bind to, for 
        // more details see http://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        public JsonResult Create([Bind(Include = "Signature,Prefix,Strip,Column,IsPrimary,Domain")] Models.Filter filter)
        {
            if (ModelState.IsValid)
            {
                db.Filters.Add(filter);
                db.SaveChanges();
                return Json(filter.Id, JsonRequestBehavior.AllowGet);
            }

            return Json(false, JsonRequestBehavior.AllowGet);
        }

        // GET: Filters/Edit/5
        public ActionResult Edit(int? id)
        {
            if (id == null)
            {
                return new HttpStatusCodeResult(HttpStatusCode.BadRequest);
            }
            Models.Filter filter = db.Filters.Find(id);
            if (filter == null)
            {
                return HttpNotFound();
            }
            return View(filter);
        }

        // POST: Filters/Edit/5
        // To protect from overposting attacks, please enable the specific properties you want to bind to, for 
        // more details see http://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        public JsonResult Edit([Bind(Include = "Id,Signature,Prefix,Strip,Column,IsPrimary,Domain")] Models.Filter filter)
        {
            if (ModelState.IsValid)
            {
               db.Entry(filter).State = EntityState.Modified;
                // db.Entry(filter).State = EntityState.Added;
                db.SaveChanges();
                
                return Json(true, JsonRequestBehavior.AllowGet);
            }
            return Json(false, JsonRequestBehavior.AllowGet);
        }

        // GET: Filters/Delete/5
        /*public ActionResult Delete(int? id)
        {
            if (id == null)
            {
                return new HttpStatusCodeResult(HttpStatusCode.BadRequest);
            }
            Models.Filter filter = db.Filters.Find(id);
            if (filter == null)
            {
                return HttpNotFound();
            }
            return View(filter);
        }*/

        // POST: Filters/Delete/5
        [HttpPost]
        public JsonResult Delete(int id)
        {
            Models.Filter filter = db.Filters.Find(id);
            bool error = false;
            if(filter != null)
            {
                db.Filters.Remove(filter);
                db.SaveChanges();
                error = true;
            }
            return Json(error, JsonRequestBehavior.AllowGet);
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                db.Dispose();
            }
            base.Dispose(disposing);
        }
    }
}
