import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { profileRepo } from "@/lib/db";
import WhosWatchingClient from "@/components/WhosWatchingClient";

export default async function WhosWatchingPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const profiles = profileRepo.listForUser(userId);
  return (
    <WhosWatchingClient
      profiles={profiles.map((p) => ({ id: p.id, name: p.name, avatarColor: p.avatar_color }))}
    />
  );
}
