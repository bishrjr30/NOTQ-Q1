import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

// ✅ هذه يجب أن تشير لنسخة Supabase التي عرّفناها في src/api/entities.js
import { Recording } from "@/api/entities";

import { Send } from "lucide-react";

export default function CommentModal({
  isOpen,
  onClose,
  recording,
  onCommentSent,
}) {
  const [comment, setComment] = useState(recording?.teacher_comment || "");
  const [isSending, setIsSending] = useState(false);

  // ✅ تأكد أن قيمة التعليق تتحدّث عندما يتغيّر recording أو يفتح المودال
  useEffect(() => {
    if (recording && isOpen) {
      setComment(recording.teacher_comment || "");
    }
  }, [recording, isOpen]);

  const handleSendComment = async () => {
    if (!recording) return;
    if (!comment.trim()) return;

    setIsSending(true);
    try {
      // ✅ هنا نفترض أن Recording.update الآن يحدّث جدول recordings في Supabase
      await Recording.update(recording.id, { teacher_comment: comment });

      // تحديث الواجهة مباشرة في الأب
      if (onCommentSent) {
        onCommentSent(recording.id, comment);
      }

      onClose();
    } catch (error) {
      console.error("Failed to send comment:", error);
      alert("فشل إرسال التعليق. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="arabic-text">إرسال تعليق</DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div>
            <Label htmlFor="comment" className="text-right arabic-text">
              اكتب تعليقك للطالب
            </Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="اكتب ملاحظاتك هنا..."
              className="mt-2 min-h-[100px] arabic-text"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="arabic-text"
            type="button"
          >
            إلغاء
          </Button>
          <Button
            onClick={handleSendComment}
            disabled={isSending}
            className="arabic-text"
            type="button"
          >
            {isSending ? (
              "جارٍ الإرسال..."
            ) : (
              <>
                <Send className="w-4 h-4 ml-2" />
                إرسال
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
