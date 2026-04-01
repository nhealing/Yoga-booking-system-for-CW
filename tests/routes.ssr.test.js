import request from "supertest";
import { app } from "../index.js";
import { resetDb, seedMinimal } from "./helpers.js";
import jwt from "jsonwebtoken";  // ← add this

describe("SSR view routes", () => {
  let data;
  let studentToken;  // ← add this

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    await resetDb();
    data = await seedMinimal();

    // ← add this block — generate a valid JWT for the test student
    studentToken = jwt.sign(
      { id: data.student._id, email: data.student.email, role: "student", name: data.student.name },
      process.env.ACCESS_TOKEN_SECRET || "yoga-studio-wad2-secret-key-2526",
      { expiresIn: "1h" }
    );
  });

  test("GET / (home) renders HTML", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/html/);
    expect(res.text).toMatch(/Courses|Upcoming Courses/i);
  });

  test("GET /courses (list page) renders HTML and shows Test Course", async () => {
    const res = await request(app).get("/courses");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/html/);
    expect(res.text).toMatch(/Test Course/);
  });

  test("GET /courses/:id (detail page) renders HTML", async () => {
    const res = await request(app).get(`/courses/${data.course._id}`);
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/html/);
    expect(res.text).toMatch(/Test Course/);
  });

  // ← pass the JWT cookie on the protected routes
  test("GET /courses/:id/book renders course booking form", async () => {
    const res = await request(app)
      .get(`/courses/${data.course._id}/book`)
      .set("Cookie", `jwt=${studentToken}`);  // ← add this
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/html/);
    expect(res.text).toMatch(/Confirm Course Booking|Book:/i);
  });

  test("GET /sessions/:id/book renders session booking form", async () => {
    const sessionId = data.sessions[0]._id;
    const res = await request(app)
      .get(`/sessions/${sessionId}/book`)
      .set("Cookie", `jwt=${studentToken}`);  // ← add this
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/html/);
    expect(res.text).toMatch(/Confirm Session Booking|Book Session/i);
  });
});