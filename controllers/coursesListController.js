// controllers/coursesListController.js
import { CourseModel } from "../models/courseModel.js";
import { SessionModel } from "../models/sessionModel.js";

const fmtDateOnly = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
    : "";

const fmtDateTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString("en-GB", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
    : "TBA";

const fmtType = (type) => {
  const types = {
    'WEEKLY_BLOCK': 'Weekly Block',
    'WEEKEND_WORKSHOP': 'Weekend Workshop'
  };
  return types[type] || type;
};

// Helper to preserve current query params while changing page
function buildLink(req, page, pageSize) {
  const url = new URL(
    `${req.protocol}://${req.get("host")}${req.originalUrl.split("?")[0]}`
  );
  const params = new URLSearchParams(req.query);
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  return `${url.pathname}?${params.toString()}`;
}

export const coursesListPage = async (req, res, next) => {
  try {
    const {
      level,
      type,
      dropin,
      q,
      page = "1",
      pageSize = "10",
    } = req.query;

    // Base filter for DB lookup
    const filter = {};
    if (level) filter.level = level;
    if (type) filter.type = type;
    if (dropin === "yes") filter.allowDropIn = true;
    if (dropin === "no") filter.allowDropIn = false;

    // Fetch all courses matching basic filters
    let courses = await CourseModel.list(filter);

    // Text search with special hyphen normalisation
    const needle = (q || "").trim().toLowerCase();
    if (needle) {
      courses = courses.filter((c) => {
        const title = (c.title || "").toLowerCase().replace(/[\u2010-\u2015\u2212]/g, "-");
        const description = (c.description || "").toLowerCase();
        return title.includes(needle) || description.includes(needle);
      });
    }

    // Sort by startDate ascending (fallback to title)
    courses.sort((a, b) => {
      const ad = a.startDate
        ? new Date(a.startDate).getTime()
        : Number.MAX_SAFE_INTEGER;
      const bd = b.startDate
        ? new Date(b.startDate).getTime()
        : Number.MAX_SAFE_INTEGER;
      if (ad !== bd) return ad - bd;
      return (a.title || "").localeCompare(b.title || "");
    });

    // Pagination
    const p = Math.max(1, parseInt(page, 10) || 1);
    const ps = Math.max(1, parseInt(pageSize, 10) || 10);
    const total = courses.length;
    const totalPages = Math.max(1, Math.ceil(total / ps));
    const start = (p - 1) * ps;
    const pageItems = courses.slice(start, start + ps);

    // Enrich with first session date, session count
    const cards = await Promise.all(
      pageItems.map(async (c) => {
        const sessions = await SessionModel.listByCourse(c._id);
        const first = sessions[0];
        return {
          id: c._id,
          title: c.title,
          level: c.level,
          type: fmtType(c.type),
          allowDropIn: c.allowDropIn,
          startDate: fmtDateOnly(c.startDate),
          endDate: fmtDateOnly(c.endDate),
          nextSession: first ? fmtDateTime(first.startDateTime) : "TBA",
          sessionsCount: sessions.length,
          description: c.description,
          price: c.price ? `£${c.price}` : "Contact us",
          location: c.location || "Location TBC",
        };
      })
    );

    // Pagination view model
    const pagination = {
      page: p,
      pageSize: ps,
      total,
      totalPages,
      hasPrev: p > 1,
      hasNext: p < totalPages,
      prevLink: p > 1 ? buildLink(req, p - 1, ps) : null,
      nextLink: p < totalPages ? buildLink(req, p + 1, ps) : null,
    };

    res.render("courses", {
      title: "Courses",
      filters: {
        level,
        type,
        dropin,
        q,
        isLevelBeginner: level === "beginner",
        isLevelIntermediate: level === "intermediate",
        isLevelAdvanced: level === "advanced",
        isTypeWeekly: type === "WEEKLY_BLOCK",
        isTypeWeekend: type === "WEEKEND_WORKSHOP",
        isDropinYes: dropin === "yes",
        isDropinNo: dropin === "no",
      },
      courses: cards,
      pagination,
    });
  } catch (err) {
    next(err);
  }
};