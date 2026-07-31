import { QuestPlayer } from "@/components/quests/QuestPlayer";

type QuestPageProps = {
  params: Promise<{
    campaign: string;
    episode: string;
    quest: string;
  }>;
};

export default async function QuestPage({
  params,
}: QuestPageProps) {
  const {
    campaign,
    episode,
    quest,
  } = await params;

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-8 sm:px-6">
      <QuestPlayer
        campaignSlug={campaign}
        episodeSlug={episode}
        questSlug={quest}
      />
    </main>
  );
}
