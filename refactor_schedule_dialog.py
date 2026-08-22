import os
filepath = "app/(dashboard)/payroll/attendance/schedule-dialog.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Insert Tabs import
content = content.replace("import { Button } from \"@/components/ui/button\";", "import { Tabs, TabsContent, TabsList, TabsTrigger } from \"@/components/ui/tabs\";\nimport { Button } from \"@/components/ui/button\";")

# Find the start of the dialog content
content = content.replace("<div className=\"max-h-[70vh] overflow-y-auto space-y-6 pr-2\">", "<Tabs defaultValue=\"schedule\" className=\"w-full\">\n          <TabsList className=\"grid w-full grid-cols-2 mb-4\">\n            <TabsTrigger value=\"schedule\">Weekly Schedule</TabsTrigger>\n            <TabsTrigger value=\"holidays\">Holidays</TabsTrigger>\n          </TabsList>\n          <div className=\"max-h-[60vh] overflow-y-auto pr-2\">")

# Wrap the Weekly schedule section in TabsContent
content = content.replace("          {/* ---- Weekly schedule: list of saved templates + a create/edit form ---- */}", "          <TabsContent value=\"schedule\" className=\"space-y-6 m-0\">\n          {/* ---- Weekly schedule: list of saved templates + a create/edit form ---- */}")

# Replace the divider with the end of the first Tab and the start of the second
content = content.replace("          <div className=\"border-t\" />\n\n          {/* ---- Holidays calendar ---- */}", "          </TabsContent>\n\n          <TabsContent value=\"holidays\" className=\"space-y-6 m-0\">\n          {/* ---- Holidays calendar ---- */}")

# Close the holidays tab
content = content.replace("            {offDates.length > 0 && (\n              <div className=\"space-y-1 max-h-28 overflow-y-auto text-xs\">", "            {offDates.length > 0 && (\n              <div className=\"space-y-1 max-h-32 overflow-y-auto text-xs\">")
content = content.replace("              </div>\n            )}\n          </section>\n        </div>\n\n        <DialogFooter>", "              </div>\n            )}\n          </section>\n          </TabsContent>\n        </div>\n        </Tabs>\n\n        <DialogFooter>")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

