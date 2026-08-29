import { DiaryMessageBubble, DiaryEntryRow } from "./diary-message-bubble";
import { MessageSquare } from "lucide-react";

interface DiaryMessageListProps {
  entries: DiaryEntryRow[];
  currentUserId: number;
  currentRole: "student" | "teacher" | "admin";
}

export function DiaryMessageList({ entries, currentUserId, currentRole }: DiaryMessageListProps) {
  if (entries.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-4">
        <div className="w-14 h-14 rounded-2xl bg-muted/80 flex items-center justify-center">
          <MessageSquare className="h-7 w-7 text-muted-foreground/60" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">No messages yet</p>
          <p className="text-xs text-muted-foreground/70 mt-0.5">
            {currentRole === "student"
              ? "Your teacher hasn't posted any diary entries yet."
              : "Start by sending a diary entry to this class."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
      {entries.map((entry) => {
        const isOwn = entry.senderId === currentUserId;
        // students never manage; teachers manage only their own; admin manages everything
        const canManage =
          currentRole === "admin" || (currentRole === "teacher" && isOwn);

        return (
          <DiaryMessageBubble key={entry.id} entry={entry} canManage={canManage} isOwn={isOwn} />
        );
      })}
    </div>
  );
}
