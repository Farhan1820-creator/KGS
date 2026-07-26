import { DiaryMessageBubble, DiaryEntryRow } from "./diary-message-bubble";

interface DiaryMessageListProps {
  entries: DiaryEntryRow[];
  currentUserId: number;
  currentRole: "student" | "teacher" | "admin";
}

export function DiaryMessageList({ entries, currentUserId, currentRole }: DiaryMessageListProps) {
  if (entries.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        No messages yet for this class.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
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
