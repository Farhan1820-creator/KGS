import os
filepath = "app/(dashboard)/accounts/fees/fee-detail-dialog.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("import { Button } from \"@/components/ui/button\";", "import { Button } from \"@/components/ui/button\";\nimport { Input } from \"@/components/ui/input\";\nimport { useState, useEffect } from \"react\";\nimport { Pencil, Check, X } from \"lucide-react\";")

# Add onUpdateAmount to props
content = content.replace("  onTogglePaid: (row: FeeRow) => void;\n}", "  onTogglePaid: (row: FeeRow) => void;\n  onUpdateAmount: (row: FeeRow, amount: number) => void;\n}")
content = content.replace("export function FeeDetailDialog({ fee, onOpenChange, onTogglePaid }: FeeDetailDialogProps) {", "export function FeeDetailDialog({ fee, onOpenChange, onTogglePaid, onUpdateAmount }: FeeDetailDialogProps) {\n  const [isEditing, setIsEditing] = useState(false);\n  const [editAmount, setEditAmount] = useState(\"\");\n\n  useEffect(() => {\n    if (fee) {\n      setEditAmount(fee.amount.toString());\n      setIsEditing(false);\n    }\n  }, [fee]);\n\n  function handleSaveAmount() {\n    const num = Number(editAmount);\n    if (!isNaN(num) && num > 0 && fee) {\n      onUpdateAmount(fee, num);\n      setIsEditing(false);\n    }\n  }\n")

# Replace the Amount DetailRow
amount_row = """            <div className="flex items-center justify-between py-2 border-b last:border-0">
              <span className="text-sm text-muted-foreground">Amount</span>
              <div className="text-sm font-medium flex items-center gap-2">
                {isEditing ? (
                  <>
                    <span className="text-muted-foreground">Rs.</span>
                    <Input 
                      type="number" 
                      className="h-7 w-24 px-2 text-right" 
                      value={editAmount} 
                      onChange={(e) => setEditAmount(e.target.value)} 
                      onKeyDown={(e) => e.key === "Enter" && handleSaveAmount()}
                      autoFocus
                    />
                    <Button size="icon-sm" variant="ghost" onClick={handleSaveAmount} className="h-6 w-6 text-green-600"><Check className="h-4 w-4" /></Button>
                    <Button size="icon-sm" variant="ghost" onClick={() => setIsEditing(false)} className="h-6 w-6 text-red-600"><X className="h-4 w-4" /></Button>
                  </>
                ) : (
                  <>
                    <span>Rs. {fee.amount.toLocaleString()}</span>
                    {fee.status === "unpaid" && (
                      <Button size="icon-sm" variant="ghost" onClick={() => setIsEditing(true)} className="h-6 w-6 opacity-50 hover:opacity-100">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>"""

content = content.replace("<DetailRow label=\"Amount\">Rs. {fee.amount.toLocaleString()}</DetailRow>", amount_row)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

