const fs = require("fs");
const filepath = "app/(dashboard)/dashboard/StudentDashboard.tsx";
let content = fs.readFileSync(filepath, "utf-8");

// Remove feeCard
content = content.replace("let feeCard = null;", "");
const startIdx = content.indexOf("// Fee Card");
const endIdx = content.indexOf("// Attendance Insights");
if (startIdx !== -1 && endIdx !== -1) {
  content = content.substring(0, startIdx) + content.substring(endIdx);
}

// Replace the return statement
const returnStart = content.indexOf("  return (");
if (returnStart !== -1) {
  const replacement = `  return (
    <div className="page-shell space-y-6">
      <div className="flex flex-col items-center justify-center py-6 w-full space-y-4">
        {student?.photoUrl ? (
          <img 
            src={student.photoUrl} 
            alt="Profile" 
            className="w-24 h-24 rounded-full object-cover border-4 border-muted shadow-sm"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-2 shadow-sm">
            <span className="text-3xl text-muted-foreground font-semibold">{name ? name.charAt(0).toUpperCase() : "?"}</span>
          </div>
        )}
        <h2 className="text-3xl text-center">
          Welcome
          <span className="text-primary font-bold">{name ? \`, \${name}\` : ""}</span>
        </h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2 items-stretch max-w-4xl mx-auto">
        {attendanceCard}
        {testReportsCard}
      </div>

      <SchoolInfoCard />
    </div>
  );
};

export default StudentDashboard;`;
  
  content = content.substring(0, returnStart) + replacement;
}

fs.writeFileSync(filepath, content, "utf-8");

