import { CandidateDetail } from "@/components/candidate-detail";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CandidateDetail id={id} />;
}
