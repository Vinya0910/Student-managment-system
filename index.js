const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");

const app = express();
app.use(express.static('public'));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

// ================================
// MySQL Connection
// ================================
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Vinyajain0910",
  database: "School"
});

db.connect((err) => {
  if (err) throw err;
  console.log("MySQL Connected");
});

// ================================
// SHOW AVATAR PAGE FIRST
// ================================
app.get("/", (req, res) => {
  res.render("select");
});

// ================================
// SHOW LOGIN PAGE
// ================================
app.get("/login", (req, res) => {
  res.render("login");
});

// ================================
// LOGIN LOGIC (POST → REDIRECT → GET)
// ================================
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  // Admin Check
  db.query(
    "SELECT * FROM Admin WHERE email=? AND password=?",
    [email, password],
    (err, adminResult) => {
      if (err) throw err;

      if (adminResult && adminResult.length > 0) {
        return res.redirect(`/admin-dashboard-login?email=${email}`);
      }

      // Teacher Check
      db.query(
        "SELECT * FROM Teacher WHERE email=? AND password=?",
        [email, password],
        (err, teacherResult) => {
          if (err) throw err;

          if (teacherResult && teacherResult.length > 0) {
            return res.redirect(`/teacher-login?email=${email}`);
          }

          // Student Check
          db.query(
            "SELECT * FROM Student WHERE email=? AND password=?",
            [email, password],
            (err, studentResult) => {
              if (err) throw err;

              if (studentResult && studentResult.length > 0) {
                return res.redirect(`/student-login?email=${email}`);
              }

              return res.send("Invalid Credentials");
            }
          );
        }
      );
    }
  );
});

// ================================
// ADMIN LOGIN REDIRECT HANDLER
// ================================
app.get("/admin-dashboard-login", (req, res) => {
  const email = req.query.email;

  db.query("SELECT * FROM Student", (err, students) => {
    if (err) throw err;

    res.render("admin", {
      admin: { email: email },
      students: students
    });
  });
});

// ================================
// TEACHER LOGIN REDIRECT HANDLER
// ================================
app.get("/teacher-login", (req, res) => {
  const email = req.query.email;

  db.query("SELECT * FROM Teacher WHERE email=?", [email], (err, teacherResult) => {
    if (err) throw err;

    if (!teacherResult || teacherResult.length === 0) {
      return res.send("Teacher not found");
    }

    let dept = teacherResult[0].department;

    db.query("SELECT * FROM Student WHERE department=?", [dept], (err, studentData) => {
      if (err) throw err;

      res.render("teacher", {
        teacher: teacherResult[0],
        students: studentData
      });
    });
  });
});

// ================================
// STUDENT LOGIN REDIRECT HANDLER
// ================================
app.get("/student-login", (req, res) => {
  const email = req.query.email;

  db.query("SELECT * FROM Student WHERE email=?", [email], (err, studentResult) => {
    if (err) throw err;

    if (!studentResult || studentResult.length === 0) {
      return res.send("Student not found");
    }

    res.render("student", { student: studentResult[0] });
  });
});

// ================================
// EDIT STUDENT PAGE
// ================================
app.get("/edit/:id", (req, res) => {
  const id = req.params.id;

  db.query("SELECT * FROM Student WHERE id=?", [id], (err, result) => {
    if (err) throw err;
    if (!result || result.length === 0) return res.send("Student not found");
    res.render("edit", { student: result[0] });
  });
});

// ================================
// UPDATE STUDENT
// ================================
app.post("/update/:id", (req, res) => {
  const { name, email, password, department, courses } = req.body;
  const id = req.params.id;

  const sql = `
    UPDATE Student 
    SET name=?, email=?, password=?, department=?, courses=? 
    WHERE id=?
  `;

  db.query(sql, [name, email, password, department, courses, id], (err) => {
    if (err) throw err;

    db.query("SELECT * FROM Student", (err, students) => {
      if (err) throw err;

      res.render("admin", {
        admin: { email: "admin@gmail.com" },
        students: students
      });
    });
  });
});

// ================================
// VIEW STUDENT DETAILS
// ================================
app.get("/view/:id", (req, res) => {
  const id = req.params.id;

  db.query("SELECT * FROM Student WHERE id=?", [id], (err, result) => {
    if (err) throw err;

    if (!result || result.length === 0) return res.send("Student not found");

    res.render("view", { student: result[0] });
  });
});

// ================================
// DELETE STUDENT
// ================================
app.post("/delete/:id", (req, res) => {
  const id = req.params.id;

  db.query("DELETE FROM Student WHERE id=?", [id], (err) => {
    if (err) throw err;

    res.send(`
      <script>
        alert("Student deleted successfully!");
        window.location.href = "/admin-back";
      </script>
    `);
  });
});

// ================================
// BACK TO ADMIN DASHBOARD
// ================================
app.get("/admin-back", (req, res) => {
  db.query("SELECT * FROM Student", (err, students) => {
    if (err) throw err;

    res.render("admin", {
      admin: { email: "admin@gmail.com" },
      students: students
    });
  });
});

// ================================
// ADD STUDENT PAGE
// ================================
app.get("/add-student", (req, res) => {
  res.render("add-student");
});

// ================================
// INSERT NEW STUDENT
// ================================
app.post("/add-student", (req, res) => {
  const { id, name, email, password, department, courses } = req.body;

  const sql = `
    INSERT INTO Student (id, name, email, password, department, courses, role)
    VALUES (?, ?, ?, ?, ?, ?, 'student')
  `;

  db.query(sql, [id, name, email, password, department, courses], (err) => {
    if (err) throw err;

    res.redirect("/admin-back");
  });
});

// ================================
// ALL TEACHERS
// ================================
app.get("/teachers", (req, res) => {
  db.query("SELECT * FROM Teacher", (err, teachers) => {
    if (err) throw err;

    res.render("Tdata", { teachers: teachers });
  });
});

// ================================
// TEACHER DETAIL PAGE
// ================================
app.get("/teacher-details/:id", (req, res) => {
  const id = req.params.id;

  db.query("SELECT * FROM Teacher WHERE id=?", [id], (err, result) => {
    if (err) throw err;

    if (!result || result.length === 0) return res.send("Teacher not found");

    res.render("Tdetail", { teacher: result[0] });
  });
});

// ================================
// ADD TEACHER PAGE
// ================================
app.get("/add-teacher", (req, res) => {
  res.render("add-teacher");
});

// ================================
// INSERT NEW TEACHER
// ================================
app.post("/add-teacher", (req, res) => {
  const { id, name, email, password, department } = req.body;

  const sql = `
    INSERT INTO Teacher (id, name, email, password, department)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(sql, [id, name, email, password, department], (err) => {
    if (err) throw err;

    res.redirect("/teachers");
  });
});

// ================================
// EDIT TEACHER
// ================================
app.get("/edit-teacher/:id", (req, res) => {
  const id = req.params.id;

  db.query("SELECT * FROM Teacher WHERE id=?", [id], (err, result) => {
    if (err) throw err;

    res.render("edit-teacher", { teacher: result[0] });
  });
});

// ================================
// UPDATE TEACHER
// ================================
app.post("/update-teacher/:id", (req, res) => {
  const id = req.params.id;
  const { name, email, password, department } = req.body;

  db.query(
    "UPDATE Teacher SET name=?, email=?, password=?, department=? WHERE id=?",
    [name, email, password, department, id],
    (err) => {
      if (err) throw err;

      res.redirect("/teachers");
    }
  );
});

// ================================
// DELETE TEACHER
// ================================
app.post("/delete-teacher/:id", (req, res) => {
  const id = req.params.id;

  db.query("DELETE FROM Teacher WHERE id=?", [id], (err) => {
    if (err) throw err;

    res.send(`
      <script>
        alert("Teacher deleted successfully!");
        window.location.href = "/teachers";
      </script>
    `);
  });
});

// ================================
// ADMIN ANALYTICS
// ================================
app.get("/admin-dashboard", (req, res) => {
  const studentQuery = "SELECT COUNT(*) AS studentCount FROM Student";
  const teacherQuery = "SELECT COUNT(*) AS teacherCount FROM Teacher";

  db.query(studentQuery, (err, studentResult) => {
    if (err) throw err;

    db.query(teacherQuery, (err, teacherResult) => {
      if (err) throw err;

      res.render("admin-dashboard", {
        studentCount: studentResult[0].studentCount,
        teacherCount: teacherResult[0].teacherCount
      });
    });
  });
});

// ================================
// TEACHER — MARK ATTENDANCE
// ================================
app.get("/teacher-attendance", (req, res) => {
  const dept = req.query.dept;

  db.query("SELECT * FROM Student WHERE department=?", [dept], (err, students) => {
    if (err) throw err;

    res.render("attendance", { students });
  });
});

// ================================
// SUBMIT ATTENDANCE
// ================================
app.post("/teacher-submit-attendance", (req, res) => {
  const dept = req.body.dept;
  const today = new Date().toISOString().split("T")[0];

  db.query("SELECT id FROM Student WHERE department=?", [dept], (err, students) => {
    if (err) throw err;

    students.forEach((st) => {
      const status = req.body[`status_${st.id}`];
      if (!status) return;

      const sql = `
        INSERT INTO Attendance (student_id, date, status)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE status = VALUES(status)
      `;

      db.query(sql, [st.id, today, status], (err) => {
        if (err) throw err;
      });
    });

    res.send("<h2>Attendance Updated Successfully!</h2>");
  });
});

// ================================
// ATTENDANCE REPORT
// ================================
app.get("/teacher-attendance-report", (req, res) => {
  const dept = req.query.dept;

  const sql = `
    SELECT Student.name, Attendance.date, Attendance.status
    FROM Attendance
    JOIN Student ON Attendance.student_id = Student.id
    WHERE Student.department=?
    ORDER BY Attendance.date DESC
  `;

  db.query(sql, [dept], (err, records) => {
    if (err) throw err;

    res.render("teacher-attendance-report", { records });
  });
});

// ================================
// ADD MARKS PAGE
// ================================
app.get("/add-marks/:id", (req, res) => {
  // teacherEmail may come as query param when teacher clicked "Add Marks"
  const teacherEmail = req.query.email || "";

  db.query("SELECT * FROM Student WHERE id=?", [req.params.id], (err, r) => {
    if (err) throw err;
    if (!r || r.length === 0) return res.send("Student not found");

    res.render("add-marks", {
      student: r[0],
      teacherEmail
    });
  });
});

// ================================
// INSERT NEW MARKS
// ================================
app.post("/add-marks/:id", (req, res) => {
  // teacherEmail can be passed in form body (we will expect it if teacher pressed back)
  const { subject, marks } = req.body;
  // fallback: try req.body.teacherEmail or req.query.email if present
  const teacherEmail = req.body.teacherEmail || req.query.email || "";

  db.query(
    `INSERT INTO Marks (student_id, subject, marks)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE marks = VALUES(marks)`,
    [req.params.id, subject, marks],
    (err) => {
      if (err) throw err;

      // After adding marks, redirect teacher back to their dashboard where possible
      if (teacherEmail) {
        return res.send(`
  <script>
    alert("Marks submitted successfully!");
    window.location.href='/teacher-login?email=${teacherEmail}';
  </script>
`);

      } else {
        // If no teacherEmail available, redirect to teacher list for safety
        return res.send(`
          <script>
            alert("Marks submitted successfully!");
            window.location.href='/teachers';
          </script>
        `);
      }
    }
  );
});

// ================================
// VIEW MARKS (TEACHER) — with Update + Delete
// ================================
app.get("/student-marks/:id", (req, res) => {
  const teacherEmail = req.query.email;   // ⭐ ADD THIS

  db.query("SELECT * FROM Student WHERE id=?", [req.params.id], (err, stu) => {
    if (err) throw err;

    db.query("SELECT * FROM Marks WHERE student_id=?", [req.params.id], (err, marks) => {
      if (err) throw err;

      res.render("student-marks", {
        student: stu[0],
        marks,
        teacherEmail   
      });
    });
  });
});


// ================================
// EDIT MARKS PAGE
// ================================
app.get("/edit-marks/:studentId/:markId", (req, res) => {
  const teacherEmail = req.query.email || "";

  db.query("SELECT * FROM Marks WHERE id=?", [req.params.markId], (err, r) => {
    if (err) throw err;

    if (!r || r.length === 0) return res.send("Marks record not found");

    res.render("edit-marks", {
      mark: r[0],
      studentId: req.params.studentId,
      teacherEmail
    });
  });
});

// ================================
// UPDATE MARKS
// ================================
app.post("/edit-marks/:studentId/:markId", (req, res) => {
  const { subject, marks } = req.body;
  const teacherEmail = req.body.teacherEmail || req.query.email || "";

  db.query(
    "UPDATE Marks SET subject=?, marks=? WHERE id=?",
    [subject, marks, req.params.markId],
    (err) => {
      if (err) throw err;

      if (teacherEmail) {
        return res.send(`
          <script>
            alert("Marks updated successfully!");
            window.location.href='/student-marks/${req.params.studentId}?email=${teacherEmail}';
          </script>
        `);
      } else {
        return res.send(`
          <script>
            alert("Marks updated successfully!");
            window.location.href='/student-marks/${req.params.studentId}';
          </script>
        `);
      }
    }
  );
});

// ================================
// DELETE MARKS
// ================================
app.post("/delete-marks/:studentId/:markId", (req, res) => {
  // teacherEmail may come in POST body (hidden field) or as query
  const teacherEmail = req.body.teacherEmail || req.query.email || "";

  db.query("DELETE FROM Marks WHERE id=?", [req.params.markId], (err) => {
    if (err) throw err;

    if (teacherEmail) {
      return res.send(`
        <script>
          alert("Marks deleted successfully!");
          window.location.href='/student-marks/${req.params.studentId}?email=${teacherEmail}';
        </script>
      `);
    } else {
      return res.send(`
        <script>
          alert("Marks deleted successfully!");
          window.location.href='/student-marks/${req.params.studentId}';
        </script>
      `);
    }
  });
});

// ================================
// STUDENT SIDE VIEW MARKS (NO EDIT/DELETE)
// ================================
app.get("/student-view-marks/:id", (req, res) => {
  db.query("SELECT * FROM Student WHERE id=?", [req.params.id], (err, stu) => {
    if (err) throw err;
    if (!stu || stu.length === 0) return res.send("Student not found");

    db.query("SELECT * FROM Marks WHERE student_id=?", [req.params.id], (err, marks) => {
      if (err) throw err;

      let total = 0;
      marks.forEach(m => total += m.marks);
      let percentage = marks.length ? (total / (marks.length * 100)) * 100 : 0;

      res.render("student-view-marks", {
        student: stu[0],
        marks,
        percentage: percentage.toFixed(2)
      });
    });
  });
});

// ================================
// SERVER START
// ================================
app.listen(5000, () => console.log("Server running on port 5000"));
