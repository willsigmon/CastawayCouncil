import { redirect } from "next/navigation";
import { createClient } from "@/app/_lib/supabase/server";
import { db } from "@/server/db/client";
import { playerApplications } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { ApplicationForm } from "./ApplicationForm";

export const dynamic = "force-dynamic";

async function getSession() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

export default async function ApplyPage() {
  const session = await getSession();
  if (!session) {
    redirect("/auth/signin?redirect=/apply");
  }

  const [existingApplication] = await db
    .select({
      id: playerApplications.id,
      q1: playerApplications.q1,
      q2: playerApplications.q2,
      q3: playerApplications.q3,
      q4: playerApplications.q4,
      q5: playerApplications.q5,
      status: playerApplications.status,
      wordScore: playerApplications.wordScore,
      createdAt: playerApplications.createdAt,
      updatedAt: playerApplications.updatedAt,
    })
    .from(playerApplications)
    .where(eq(playerApplications.userId, session.user.id))
    .limit(1);

  return (
    <main className="min-h-screen pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10">
        <div className="space-y-3 text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-amber-500/80">Outwit • Outplay • Outlast</p>
          <h1 className="text-5xl font-adventure text-amber-100 torch-glow">Castaway Council Application</h1>
          <p className="text-amber-200/80 max-w-2xl mx-auto">
            Drop your best pitch below. We’re building casts with storytellers, schemers, and people ready to light the campfire on day one.
          </p>
        </div>

        <ApplicationForm
          initialApplication=
            {existingApplication
              ? {
                  ...existingApplication,
                  // Normalize Date objects to strings for the client component props
                  createdAt: (existingApplication.createdAt as Date).toISOString(),
                  updatedAt: (existingApplication.updatedAt as Date).toISOString(),
                }
              : null}
        />
      </div>
    </main>
  );
}
