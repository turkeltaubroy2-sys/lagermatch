import { useToast } from "@/components/ui/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast 
            key={id} 
            {...props}
            className="bg-[#1A1A1A] border-[#333] text-white"
          >
            <div className="grid gap-1 flex-1">
              {title && <ToastTitle className="text-white">{title}</ToastTitle>}
              {description && (
                <ToastDescription className="text-white/70">{description}</ToastDescription>
              )}
            </div>
            {action && (
              <button
                onClick={action.onClick}
                className="ml-3 px-3 py-1.5 text-xs font-semibold bg-[#D4AF37] text-[#0F0F0F] rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap"
              >
                {action.label}
              </button>
            )}
            <ToastClose className="text-white/50 hover:text-white" />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}