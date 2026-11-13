/** A WhatsApp share link that lets the user pick a chat. */
export function whatsappShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/** A WhatsApp chat link to a 10-digit Indian mobile number. */
export function whatsappChatUrl(phone: string, text?: string): string {
  return `https://wa.me/91${phone}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
