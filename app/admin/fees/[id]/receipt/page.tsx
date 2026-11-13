import { FeeReceipt } from "@/components/fee-receipt";

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FeeReceipt feeId={id} />;
}
