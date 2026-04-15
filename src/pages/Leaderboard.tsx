import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Trophy, Heart, Flame, Crown, Medal } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type LeaderboardEntry = {
  rank: number;
  user_id: number;
  name: string;
  likes: number;
  posts: number;
  score: number;
};

const getRankIcon = (rank: number) => {
  if (rank === 1) return <Crown className="w-5 h-5 text-secondary" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-muted-foreground" />;
  if (rank === 3) return <Medal className="w-5 h-5 text-secondary/60" />;
  return <span className="text-sm text-muted-foreground font-mono">#{rank}</span>;
};

const Leaderboard = () => {
  const [tab, setTab] = useState<"creators" | "posts">("creators");
  const [topCreators, setTopCreators] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    const load = async () => {
      const data = await api.getLeaderboard();
      if (Array.isArray(data)) {
        setTopCreators(data);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold mb-2 flex items-center gap-2">
            <Trophy className="w-8 h-8 text-secondary" /> Leaderboard
          </h1>
          <p className="text-muted-foreground mb-8">Top creators and trending posts.</p>
        </motion.div>

        <div className="flex gap-2 mb-6">
          <Button variant={tab === "creators" ? "default" : "glass"} size="sm" onClick={() => setTab("creators")}>
            Top Creators
          </Button>
          <Button variant={tab === "posts" ? "default" : "glass"} size="sm" onClick={() => setTab("posts")}>
            Top Posts
          </Button>
        </div>

        <div className="space-y-3">
          {topCreators.map((creator, i) => (
            <motion.div
              key={creator.rank}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`glass-card rounded-xl p-4 flex items-center gap-4 ${
                creator.rank <= 3 ? "border-primary/20 animate-border-glow" : ""
              }`}
            >
              <div className="w-10 flex justify-center">{getRankIcon(creator.rank)}</div>
              <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
                {creator.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div className="flex-1">
                <p className="font-display font-semibold text-foreground">{creator.name}</p>
                <p className="text-xs text-muted-foreground">{creator.posts} posts</p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1 text-primary">
                  <Heart className="w-4 h-4" /> {creator.likes}
                </span>
                <span className="flex items-center gap-1 text-secondary">
                  <Flame className="w-4 h-4" /> {creator.score}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Leaderboard;
