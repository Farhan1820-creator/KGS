import os
import re

filepath = "app/(dashboard)/accounts/fees/fees-client.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Import
content = content.replace("generateFeesForMonth, markFeePaid, markFeeUnpaid", "generateFeesForMonth, markFeePaid, markFeeUnpaid, updateFeeAmount")

# Add handleUpdateAmount
handle_func = """
  function handleUpdateAmount(row: FeeRow, newAmount: number) {
    startTransition(async () => {
      const result = await updateFeeAmount(row.id, newAmount);
      if (!result.success) {
        toast.error("errors" in result && result.errors.root ? result.errors.root[0] : "Failed to update amount");
        return;
      }
      toast.success("Amount updated");
      if (detailRow && detailRow.id === row.id) {
        setDetailRow({ ...detailRow, amount: newAmount });
      }
      router.refresh();
    });
  }

  return (
"""
content = content.replace("  return (\n", handle_func)

# Pass it to FeeDetailDialog
dialog_replace = """      <FeeDetailDialog
        fee={detailRow}
        onOpenChange={(open) => !open && setDetailRow(null)}
        onTogglePaid={handleTogglePaid}
        onUpdateAmount={handleUpdateAmount}
      />"""
content = re.sub(r"<FeeDetailDialog\s*fee=\{detailRow\}\s*onOpenChange=\{\(open\) => !open && setDetailRow\(null\)\}\s*onTogglePaid=\{handleTogglePaid\}\s*/>", dialog_replace, content)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

