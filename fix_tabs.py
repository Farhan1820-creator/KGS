import os
filepath = "app/(dashboard)/payroll/attendance/schedule-dialog.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# I need to wrap it inside the dialog. 
content = content.replace("<div className=\"space-y-6 max-h-[75vh] overflow-y-auto pr-1\">\n          {/* ---- Weekly schedule ---- */}", "<Tabs defaultValue=\"schedule\" className=\"w-full\">\n        <TabsList className=\"grid w-full grid-cols-2 mb-4\">\n          <TabsTrigger value=\"schedule\">Weekly Schedule</TabsTrigger>\n          <TabsTrigger value=\"holidays\">Holidays</TabsTrigger>\n        </TabsList>\n        <div className=\"space-y-6 max-h-[70vh] overflow-y-auto pr-1\">\n          <TabsContent value=\"schedule\" className=\"space-y-6 m-0\">\n          {/* ---- Weekly schedule ---- */}")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

