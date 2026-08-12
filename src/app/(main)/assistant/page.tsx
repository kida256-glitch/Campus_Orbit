import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { AssistantChat } from "@/components/assistant/chat";

export const metadata = { title: "CampusOrbit AI" };

export default async function AssistantPage() {
  const profile = await requireRole("student");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="CampusOrbit AI"
        title="Your campus career assistant"
        description="Grounded in your own verified activity — retrieval over your CampusOrbit records, not a general chatbot."
      />

      <AssistantChat studentName={profile.full_name} />
    </div>
  );
}
