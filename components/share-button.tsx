import { MessageCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { whatsappShareUrl } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

/** Opens WhatsApp with `text` prefilled so it can be forwarded to a chat or group. */
export function ShareButton({ text, label, className }: { text: string; label: string; className?: string }) {
  return (
    <a
      href={whatsappShareUrl(text)}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "no-print", className)}
    >
      <MessageCircle aria-hidden />
      {label}
    </a>
  );
}
