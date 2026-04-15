import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Heart, MessageSquare, Share2, TrendingUp, Clock, Bookmark, Trash2, Flag, Ban } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

type FeedComment = {
  id: number;
  user_id: number;
  author_name: string;
  content: string;
  created_at: string;
};

type FeedPost = {
  id: number;
  author_id: number;
  author_name: string;
  content: string;
  image_url?: string;
  created_at: string;
  likes: number;
  comments_count: number;
  liked_by_me: boolean;
  saved_by_me: boolean;
  is_owner: boolean;
  comments: FeedComment[];
};

const emojiChoices = ["😀", "😍", "🔥", "🎉", "🚀", "💯", "🙏", "❤️"];

const Feed = () => {
  const [activeTab, setActiveTab] = useState<"trending" | "latest">("trending");
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [newPost, setNewPost] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const [statusMessage, setStatusMessage] = useState("");

  const isLoggedIn = useMemo(() => Boolean(localStorage.getItem("crowdcred_token")), []);

  const loadFeed = async () => {
    if (!isLoggedIn) return;
    const data = await api.getFeed();
    if (Array.isArray(data)) {
      setPosts(data);
    } else {
      setStatusMessage(data.message || "Could not load feed");
    }
  };

  useEffect(() => {
    loadFeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreatePost = async () => {
    if (!newPost.trim()) return;
    const data = await api.createPost(newPost.trim(), imageUrl.trim() || undefined);
    if (data.post_id) {
      setNewPost("");
      setImageUrl("");
      setStatusMessage("Post created successfully");
      await loadFeed();
    } else {
      setStatusMessage(data.message || "Failed to create post");
    }
  };

  const appendEmoji = (emoji: string) => setNewPost((prev) => `${prev}${emoji}`);

  const likePost = async (postId: number) => {
    await api.likePost(postId);
    await loadFeed();
  };

  const savePost = async (postId: number) => {
    await api.savePost(postId);
    await loadFeed();
  };

  const deletePost = async (postId: number) => {
    await api.deletePost(postId);
    await loadFeed();
  };

  const reportPost = async (postId: number) => {
    const reason = prompt("Reason for reporting this post?");
    if (!reason?.trim()) return;
    await api.reportPost(postId, reason.trim());
    setStatusMessage("Post reported");
  };

  const blockUser = async (userId: number) => {
    await api.blockUser(userId);
    await loadFeed();
  };

  const submitComment = async (postId: number) => {
    const content = (commentInputs[postId] || "").trim();
    if (!content) return;
    await api.commentPost(postId, content);
    setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
    await loadFeed();
  };

  const sharePost = async (postId: number) => {
    const shareUrl = `${window.location.origin}/feed?post=${postId}`;
    if (navigator.share) {
      await navigator.share({ title: "CrowdCred Post", url: shareUrl });
      return;
    }
    await navigator.clipboard.writeText(shareUrl);
    setStatusMessage("Share link copied to clipboard");
  };

  const sortedPosts = [...posts].sort((a, b) => {
    if (activeTab === "latest") {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    return b.likes - a.likes;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
            <h1 className="font-display text-3xl font-bold">Feed</h1>
            <Button variant="hero" size="sm" onClick={handleCreatePost}>
              Create Post
            </Button>
          </motion.div>

          {!isLoggedIn && (
            <div className="glass-card rounded-xl p-4 mb-4 text-sm text-muted-foreground">
              Please log in first to create posts and interact with feed actions.
            </div>
          )}

          {isLoggedIn && (
            <div className="glass-card rounded-xl p-4 mb-6">
              <textarea
                className="w-full rounded-md bg-muted p-3 text-sm outline-none"
                rows={3}
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="Share your activity with emojis..."
              />
              <input
                className="w-full mt-2 rounded-md bg-muted p-3 text-sm outline-none"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Optional image URL"
              />
              <div className="flex flex-wrap gap-2 mt-3">
                {emojiChoices.map((emoji) => (
                  <button
                    key={emoji}
                    className="px-2 py-1 rounded bg-muted text-sm"
                    onClick={() => appendEmoji(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={activeTab === "trending" ? "default" : "glass"}
              size="sm"
              onClick={() => setActiveTab("trending")}
            >
              <TrendingUp className="w-4 h-4 mr-1" /> Trending
            </Button>
            <Button
              variant={activeTab === "latest" ? "default" : "glass"}
              size="sm"
              onClick={() => setActiveTab("latest")}
            >
              <Clock className="w-4 h-4 mr-1" /> Latest
            </Button>
          </div>

          {/* Posts */}
          <div className="space-y-4">
            {statusMessage && <p className="text-sm text-muted-foreground">{statusMessage}</p>}
            {sortedPosts.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card rounded-xl p-6 hover:border-primary/20 transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
                    {post.author_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{post.author_name}</p>
                    <p className="text-xs text-muted-foreground">{new Date(post.created_at).toLocaleString()}</p>
                  </div>
                </div>

                <p className="text-muted-foreground text-sm leading-relaxed mb-4">{post.content}</p>
                {post.image_url && (
                  <img src={post.image_url} alt="Post" className="w-full max-h-96 object-cover rounded-lg mb-4" />
                )}

                <div className="space-y-2 mb-3">
                  {post.comments.map((comment) => (
                    <p key={comment.id} className="text-xs text-muted-foreground">
                      <span className="text-foreground font-medium">{comment.author_name}: </span>
                      {comment.content}
                    </p>
                  ))}
                </div>

                <div className="flex items-center gap-4 text-muted-foreground">
                  <button className="flex items-center gap-1 text-sm hover:text-primary transition-colors" onClick={() => likePost(post.id)}>
                    <Heart className={`w-4 h-4 ${post.liked_by_me ? "fill-current text-primary" : ""}`} /> {post.likes}
                  </button>
                  <button className="flex items-center gap-1 text-sm hover:text-primary transition-colors" onClick={() => submitComment(post.id)}>
                    <MessageSquare className="w-4 h-4" /> {post.comments_count}
                  </button>
                  <button className="flex items-center gap-1 text-sm hover:text-primary transition-colors ml-auto" onClick={() => sharePost(post.id)}>
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button className="flex items-center gap-1 text-sm hover:text-secondary transition-colors" onClick={() => savePost(post.id)}>
                    <Bookmark className={`w-4 h-4 ${post.saved_by_me ? "fill-current text-secondary" : ""}`} />
                  </button>
                  <button className="flex items-center gap-1 text-sm hover:text-amber-500 transition-colors" onClick={() => reportPost(post.id)}>
                    <Flag className="w-4 h-4" />
                  </button>
                  {!post.is_owner && (
                    <button className="flex items-center gap-1 text-sm hover:text-destructive transition-colors" onClick={() => blockUser(post.author_id)}>
                      <Ban className="w-4 h-4" />
                    </button>
                  )}
                  {post.is_owner && (
                    <button className="flex items-center gap-1 text-sm hover:text-destructive transition-colors" onClick={() => deletePost(post.id)}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="mt-3">
                  <input
                    className="w-full rounded-md bg-muted p-2 text-sm outline-none"
                    value={commentInputs[post.id] || ""}
                    onChange={(e) =>
                      setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                    }
                    placeholder="Write a comment with emoji..."
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Feed;
