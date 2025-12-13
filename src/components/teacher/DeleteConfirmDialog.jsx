import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2 } from 'lucide-react';

export default function DeleteConfirmDialog({ isOpen, onClose, onConfirm, type, isDeleting }) {
  const isDeleteAll = type === 'all';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="arabic-text flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            تأكيد الحذف
          </DialogTitle>
          <DialogDescription className="arabic-text text-slate-600">
            {isDeleteAll 
              ? "هل أنت متأكد من حذف جميع التسجيلات؟ هذا الإجراء لا يمكن التراجع عنه وسيتم حذف جميع التسجيلات نهائياً."
              : "هل أنت متأكد من حذف هذا التسجيل؟ هذا الإجراء لا يمكن التراجع عنه."
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center justify-center py-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <Trash2 className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <DialogFooter className="gap-3">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isDeleting}
            className="arabic-text"
          >
            إلغاء
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirm}
            disabled={isDeleting}
            className="arabic-text"
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                جارٍ الحذف...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 ml-2" />
                {isDeleteAll ? "حذف الكل" : "حذف"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}