"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabase";

type Reaction = "heart" | "laugh" | "fear" | "shock";
type Category = "All" | "Creepy" | "Funny" | "Scary" | "Sad" | "Love" | "Secret";

type Story = {
  id: number;
  nickname: string;
  category: Exclude<Category, "All">;
  title: string;
  text: string;
  createdAt: string;
  reactions: Record<Reaction, number>;
};

type SupabaseStory = {
  id: number;
  nickname: string;
  category: Exclude<Category, "All">;
  title: string;
  text: string;
  created_at: string;
};

const categories: Category[] = ["All", "Creepy", "Funny", "Scary", "Sad", "Love", "Secret"];

export default function Home() {
  const [stories, setStories] = useState<Story[]>([]);
  const [nickname, setNickname] = useState("");
  const [category, setCategory] = useState<Exclude<Category, "All">>("Creepy");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [userReactions, setUserReactions] = useState<Record<number, Reaction>>({});

  useEffect(() => {
    loadStories();
  }, []);

  useEffect(() => {
  const saved = localStorage.getItem("storymask_user_reactions");
  if (saved) {
    setUserReactions(JSON.parse(saved));
  }
}, []);

useEffect(() => {
  localStorage.setItem("storymask_user_reactions", JSON.stringify(userReactions));
}, [userReactions]);

  async function loadStories() {
    setLoading(true);
    setErrorText("");

    const { data, error } = await supabase
      .from("stories")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setErrorText("Error loading stories: " + error.message);
      setLoading(false);
      return;
    }

    const loadedStories: Story[] = (data as SupabaseStory[]).map((story) => ({
      id: story.id,
      nickname: story.nickname,
      category: story.category,
      title: story.title,
      text: story.text,
      createdAt: new Date(story.created_at).toLocaleString(),
      reactions: {
        heart: 0,
        laugh: 0,
        fear: 0,
        shock: 0,
      },
    }));

    setStories(loadedStories);
    setLoading(false);
  }

  const filteredStories = useMemo(() => {
    if (activeCategory === "All") return stories;
    return stories.filter((story) => story.category === activeCategory);
  }, [stories, activeCategory]);

  async function publishStory() {
    if (!nickname.trim() || !title.trim() || !text.trim()) {
      alert("Please fill everything.");
      return;
    }

    setErrorText("");

    const { error } = await supabase.from("stories").insert({
      nickname: nickname.trim(),
      category,
      title: title.trim(),
      text: text.trim(),
    });

    if (error) {
      setErrorText("Error publishing story: " + error.message);
      return;
    }

    setTitle("");
    setText("");
    await loadStories();
  }

  function react(id: number, reaction: Reaction) {
  const previousReaction = userReactions[id];

  setStories(
    stories.map((story) => {
      if (story.id !== id) return story;

      const newReactions = { ...story.reactions };

      if (previousReaction === reaction) {
        newReactions[reaction] -= 1;

        const updatedUserReactions = { ...userReactions };
        delete updatedUserReactions[id];
        setUserReactions(updatedUserReactions);
      } else {
        if (previousReaction) {
          newReactions[previousReaction] -= 1;
        }

        newReactions[reaction] += 1;
        setUserReactions({
          ...userReactions,
          [id]: reaction,
        });
      }

      return {
        ...story,
        reactions: newReactions,
      };
    })
  );
}

  async function deleteStory(id: number) {
    const { error } = await supabase.from("stories").delete().eq("id", id);

    if (error) {
      setErrorText("Error deleting story: " + error.message);
      return;
    }

    setStories(stories.filter((story) => story.id !== id));
  }

  function randomStory() {
    if (stories.length === 0) {
      alert("No stories yet.");
      return;
    }

    const random = stories[Math.floor(Math.random() * stories.length)];
    alert(`${random.title}\n\n${random.text}`);
  }

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <div>
          <p style={styles.logo}>ANONYMOUS STORIES</p>
          <h1 style={styles.title}>StoryMask</h1>
          <p style={styles.subtitle}>Share the story you never told anyone.</p>
        </div>

        <button onClick={randomStory} style={styles.mainButton}>
          Tell me a random story
        </button>
      </section>

      <div style={styles.adBox}>
        <p style={styles.adSmall}>ADVERTISEMENT</p>
        <p style={styles.adText}>Your ad could be here</p>
      </div>

      <section style={styles.grid}>
        <div>
          <div style={styles.categories}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  ...styles.categoryButton,
                  background: activeCategory === cat ? "white" : "#151515",
                  color: activeCategory === cat ? "black" : "white",
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <h2 style={styles.sectionTitle}>Stories</h2>

          {errorText && <div style={styles.errorBox}>{errorText}</div>}

          {loading && <div style={styles.emptyBox}>Loading stories...</div>}

          {!loading && filteredStories.length === 0 && (
            <div style={styles.emptyBox}>No stories here yet. Be the first.</div>
          )}

          {filteredStories.map((story, index) => (
            <div key={story.id}>
              <article style={styles.card}>
                <div style={styles.cardTop}>
                  <p style={styles.meta}>
                    @{story.nickname} · {story.createdAt}
                  </p>
                  <span style={styles.badge}>{story.category}</span>
                </div>

                <h3 style={styles.storyTitle}>{story.title}</h3>
                <p style={styles.storyText}>{story.text}</p>

                <div style={styles.reactions}>
                  <button onClick={() => react(story.id, "heart")} style={styles.reactionButton}>
                    ❤️ {story.reactions.heart}
                  </button>
                  <button onClick={() => react(story.id, "laugh")} style={styles.reactionButton}>
                    😂 {story.reactions.laugh}
                  </button>
                  <button onClick={() => react(story.id, "fear")} style={styles.reactionButton}>
                    😨 {story.reactions.fear}
                  </button>
                  <button onClick={() => react(story.id, "shock")} style={styles.reactionButton}>
                    🤯 {story.reactions.shock}
                  </button>
                </div>

                <button onClick={() => deleteStory(story.id)} style={styles.deleteButton}>
                  Delete story
                </button>
              </article>

              {(index + 1) % 3 === 0 && <div style={styles.smallAd}>Advertisement space</div>}
            </div>
          ))}
        </div>

        <aside style={styles.formBox}>
          <h2 style={styles.formTitle}>Write your story</h2>
          <p style={styles.formText}>No real name. No profile picture. Just your words.</p>

          <input
            placeholder="Nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            style={styles.input}
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Exclude<Category, "All">)}
            style={styles.input}
          >
            <option>Creepy</option>
            <option>Funny</option>
            <option>Scary</option>
            <option>Sad</option>
            <option>Love</option>
            <option>Secret</option>
          </select>

          <input
            placeholder="Story title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={styles.input}
          />

          <textarea
            placeholder="Your anonymous story..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={styles.textarea}
          />

          <button onClick={publishStory} style={styles.publishButton}>
            Publish anonymously
          </button>

          <div style={styles.formAd}>Advertisement</div>
        </aside>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top left, #3b0764, transparent 35%), radial-gradient(circle at bottom right, #172554, transparent 35%), #050505",
    color: "white",
    padding: "30px",
    fontFamily: "Arial, sans-serif",
  },
  hero: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "35px",
    border: "1px solid #27272a",
    borderRadius: "32px",
    background: "rgba(0,0,0,0.55)",
    display: "flex",
    justifyContent: "space-between",
    gap: "25px",
    flexWrap: "wrap",
  },
  logo: {
    color: "#c084fc",
    letterSpacing: "5px",
    fontSize: "13px",
  },
  title: {
    fontSize: "70px",
    margin: "10px 0",
    fontWeight: "900",
  },
  subtitle: {
    color: "#cfcfcf",
    fontSize: "22px",
  },
  mainButton: {
    background: "white",
    color: "black",
    border: "none",
    borderRadius: "18px",
    padding: "18px 26px",
    fontSize: "17px",
    fontWeight: "bold",
    cursor: "pointer",
    height: "fit-content",
  },
  adBox: {
    maxWidth: "1200px",
    margin: "25px auto",
    height: "100px",
    border: "1px dashed #52525b",
    borderRadius: "24px",
    background: "rgba(20,20,20,0.7)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "#71717a",
  },
  adSmall: {
    letterSpacing: "4px",
    fontSize: "11px",
  },
  adText: {
    marginTop: "5px",
  },
  grid: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "1fr 360px",
    gap: "25px",
  },
  categories: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginBottom: "25px",
  },
  categoryButton: {
    border: "none",
    borderRadius: "999px",
    padding: "11px 18px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: "32px",
    marginBottom: "15px",
  },
  emptyBox: {
    padding: "30px",
    borderRadius: "24px",
    background: "#111",
    color: "#999",
    marginBottom: "20px",
  },
  errorBox: {
    padding: "18px",
    borderRadius: "18px",
    background: "#450a0a",
    color: "#fecaca",
    border: "1px solid #7f1d1d",
    marginBottom: "20px",
  },
  card: {
    background: "rgba(10,10,10,0.85)",
    border: "1px solid #27272a",
    borderRadius: "28px",
    padding: "25px",
    marginBottom: "20px",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    flexWrap: "wrap",
  },
  meta: {
    color: "#8b8b8b",
    fontSize: "14px",
  },
  badge: {
    background: "#18181b",
    color: "#d4d4d8",
    borderRadius: "999px",
    padding: "7px 12px",
    fontSize: "13px",
  },
  storyTitle: {
    fontSize: "28px",
    marginTop: "15px",
    marginBottom: "10px",
  },
  storyText: {
    color: "#d4d4d8",
    fontSize: "18px",
    lineHeight: "1.7",
    whiteSpace: "pre-wrap",
  },
  reactions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginTop: "20px",
  },
  reactionButton: {
    background: "#18181b",
    color: "white",
    border: "none",
    borderRadius: "999px",
    padding: "10px 14px",
    cursor: "pointer",
  },
  deleteButton: {
    marginTop: "18px",
    background: "transparent",
    color: "#ef4444",
    border: "1px solid #7f1d1d",
    borderRadius: "12px",
    padding: "10px 14px",
    cursor: "pointer",
  },
  smallAd: {
    border: "1px dashed #444",
    color: "#777",
    borderRadius: "18px",
    padding: "20px",
    marginBottom: "20px",
    textAlign: "center",
  },
  formBox: {
    background: "rgba(10,10,10,0.9)",
    border: "1px solid #27272a",
    borderRadius: "28px",
    padding: "25px",
    height: "fit-content",
    position: "sticky",
    top: "20px",
  },
  formTitle: {
    fontSize: "28px",
    marginBottom: "8px",
  },
  formText: {
    color: "#999",
    marginBottom: "20px",
  },
  input: {
    width: "100%",
    padding: "14px",
    marginBottom: "12px",
    borderRadius: "14px",
    border: "1px solid #333",
    background: "#050505",
    color: "white",
    fontSize: "15px",
  },
  textarea: {
    width: "100%",
    height: "170px",
    padding: "14px",
    marginBottom: "12px",
    borderRadius: "14px",
    border: "1px solid #333",
    background: "#050505",
    color: "white",
    fontSize: "15px",
    resize: "none",
  },
  publishButton: {
    width: "100%",
    background: "#7e22ce",
    color: "white",
    border: "none",
    borderRadius: "16px",
    padding: "15px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  formAd: {
    marginTop: "20px",
    padding: "18px",
    textAlign: "center",
    border: "1px dashed #444",
    borderRadius: "18px",
    color: "#777",
  },
};