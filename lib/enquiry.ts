export const ENQUIRY_STATUSES = ["new", "contacted", "closed"] as const;
export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];
