"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { supabase } from "./lib/supabase";

type Reaction = "heart" | "laugh" | "fear" | "shock";
type Category = "All" | "Creepy" | "Funny" | "Scary" | "Sad" | "Love" | "Secret";
type SortMode = "new" | "trending" | "loved";
type Language = "en" | "de" | "ru" | "fr" | "it";

type Story = {
  id: number;
  nickname: string;
  category: Exclude<Category, "All">;
  title: string;
  text: string;
  createdAt: string;
  ownerKey: string | null;
  reactions: Record<Reaction, number>;
};

type Comment = {
  id: number;
  story_id: number;
  nickname: string;
  text: string;
  created_at: string;
};

type DbStory = {
  id: number;
  nickname: string;
  category: Exclude<Category, "All">;
  title: string;
  text: string;
  created_at: string;
  owner_key: string | null;
};

type DbReaction = {
  story_id: number;
  user_key: string;
  reaction: Reaction;
};

const categories: Category[] = ["All", "Creepy", "Funny", "Scary", "Sad", "Love", "Secret"];

const ui = {
  en: {
    logo: "ANONYMOUS STORIES",
    subtitle: "Share the story you never told anyone.",
    random: "Find a random story",
    write: "Write your story",
    formText: "No real name. No profile picture. Just your words.",
    publish: "Publish anonymously",
    stories: "Stories",
    empty: "No stories here yet. Be the first.",
    search: "Search stories...",
    comment: "Write a comment...",
    send: "Send",
    comments: "Comments",
    report: "Report",
    reported: "Reported",
    share: "Share",
    copied: "Link copied",
    storyDay: "Story of the Day",
    new: "New",
    trending: "Trending",
    loved: "Most Loved",
    deleteMine: "Delete my story",
  },
  de: {
    logo: "ANONYME GESCHICHTEN",
    subtitle: "Teile die Geschichte, die du nie erzählt hast.",
    random: "Zufällige Geschichte",
    write: "Deine Geschichte",
    formText: "Kein echter Name. Kein Profilbild. Nur deine Worte.",
    publish: "Anonym veröffentlichen",
    stories: "Geschichten",
    empty: "Noch keine Geschichten.",
    search: "Geschichten suchen...",
    comment: "Kommentar schreiben...",
    send: "Senden",
    comments: "Kommentare",
    report: "Melden",
    reported: "Gemeldet",
    share: "Teilen",
    copied: "Link kopiert",
    storyDay: "Geschichte des Tages",
    new: "Neu",
    trending: "Trending",
    loved: "Beliebt",
    deleteMine: "Meine Geschichte löschen",
  },
  ru: {
    logo: "АНОНИМНЫЕ ИСТОРИИ",
    subtitle: "Расскажи историю, которую ты никому не говорил.",
    random: "Найти случайную историю",
    write: "Написать историю",
    formText: "Без имени. Без фото. Только твои слова.",
    publish: "Опубликовать анонимно",
    stories: "Истории",
    empty: "Тут пока нет историй. Будь первым.",
    search: "Поиск историй...",
    comment: "Написать комментарий...",
    send: "Отправить",
    comments: "Комментарии",
    report: "Жалоба",
    reported: "Отправлено",
    share: "Поделиться",
    copied: "Ссылка скопирована",
    storyDay: "История дня",
    new: "Новые",
    trending: "В тренде",
    loved: "Любимые",
    deleteMine: "Удалить мою историю",
  },
  fr: {
    logo: "HISTOIRES ANONYMES",
    subtitle: "Partage l’histoire que tu n’as jamais racontée.",
    random: "Histoire aléatoire",
    write: "Écris ton histoire",
    formText: "Pas de vrai nom. Pas de photo. Juste tes mots.",
    publish: "Publier anonymement",
    stories: "Histoires",
    empty: "Aucune histoire ici.",
    search: "Chercher...",
    comment: "Écrire un commentaire...",
    send: "Envoyer",
    comments: "Commentaires",
    report: "Signaler",
    reported: "Signalé",
    share: "Partager",
    copied: "Lien copié",
    storyDay: "Histoire du jour",
    new: "Nouveau",
    trending: "Tendance",
    loved: "Aimées",
    deleteMine: "Supprimer mon histoire",
  },
  it: {
    logo: "STORIE ANONIME",
    subtitle: "Condividi la storia che non hai mai raccontato.",
    random: "Storia casuale",
    write: "Scrivi la tua storia",
    formText: "Nessun nome reale. Nessuna foto. Solo parole.",
    publish: "Pubblica anonimamente",
    stories: "Storie",
    empty: "Ancora nessuna storia.",
    search: "Cerca storie...",
    comment: "Scrivi un commento...",
    send: "Invia",
    comments: "Commenti",
    report: "Segnala",
    reported: "Segnalato",
    share: "Condividi",
    copied: "Link copiato",
    storyDay: "Storia del giorno",
    new: "Nuove",
    trending: "Tendenza",
    loved: "Più amate",
    deleteMine: "Elimina la mia storia",
  },
};

function makeKey() {
  return crypto.randomUUID();
}

export default function Home() {
  const [stories, setStories] = useState<Story[]>([]);
  const [comments, setComments] = useState<Record<number, Comment[]>>({});
  const [commentTexts, setCommentTexts] = useState<Record<number, string>>({});
  const [myReaction, setMyReaction] = useState<Record<number, Reaction>>({});
  const [reported, setReported] = useState<Record<number, boolean>>({});
  const [nickname, setNickname] = useState("");
  const [category, setCategory] = useState<Exclude<Category, "All">>("Creepy");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [sortMode, setSortMode] = useState<SortMode>("new");
  const [language, setLanguage] = useState<Language>("en");
  const [search, setSearch] = useState("");
  const [ownerKey, setOwnerKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const storyRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const t = ui[language];

  useEffect(() => {
    let key = localStorage.getItem("storymask_owner_key");
    if (!key) {
      key = makeKey();
      localStorage.setItem("storymask_owner_key", key);
    }
    setOwnerKey(key);

    const savedLang = localStorage.getItem("storymask_language") as Language | null;
    if (savedLang) setLanguage(savedLang);

    loadEverything(key);
  }, []);

  useEffect(() => {
    localStorage.setItem("storymask_language", language);
  }, [language]);

  async function loadEverything(currentKey = ownerKey) {
    setLoading(true);

    const { data: storyData, error: storyError } = await supabase
      .from("stories")
      .select("*")
      .order("created_at", { ascending: false });

    if (storyError) {
      alert(storyError.message);
      setLoading(false);
      return;
    }

    const { data: reactionData } = await supabase.from("reactions").select("*");
    const { data: commentData } = await supabase.from("comments").select("*").order("created_at", { ascending: true });

    const reactionMap: Record<number, Record<Reaction, number>> = {};
    const myMap: Record<number, Reaction> = {};

    (reactionData as DbReaction[] | null)?.forEach((r) => {
      if (!reactionMap[r.story_id]) {
        reactionMap[r.story_id] = { heart: 0, laugh: 0, fear: 0, shock: 0 };
      }
      reactionMap[r.story_id][r.reaction] += 1;

      if (r.user_key === currentKey) {
        myMap[r.story_id] = r.reaction;
      }
    });

    const loaded: Story[] = (storyData as DbStory[]).map((s) => ({
      id: s.id,
      nickname: s.nickname,
      category: s.category,
      title: s.title,
      text: s.text,
      createdAt: new Date(s.created_at).toLocaleString(),
      ownerKey: s.owner_key,
      reactions: reactionMap[s.id] || { heart: 0, laugh: 0, fear: 0, shock: 0 },
    }));

    const commentMap: Record<number, Comment[]> = {};
    (commentData as Comment[] | null)?.forEach((c) => {
      if (!commentMap[c.story_id]) commentMap[c.story_id] = [];
      commentMap[c.story_id].push(c);
    });

    setStories(loaded);
    setComments(commentMap);
    setMyReaction(myMap);
    setLoading(false);
  }

  function total(story: Story) {
    return story.reactions.heart + story.reactions.laugh + story.reactions.fear + story.reactions.shock;
  }

  const storyOfDay = useMemo(() => {
    if (stories.length === 0) return null;
    const day = new Date().getDate();
    return stories[day % stories.length];
  }, [stories]);

  const filteredStories = useMemo(() => {
    let result = [...stories];

    if (activeCategory !== "All") result = result.filter((s) => s.category === activeCategory);

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.text.toLowerCase().includes(q) ||
          s.nickname.toLowerCase().includes(q)
      );
    }

    if (sortMode === "trending") result.sort((a, b) => total(b) - total(a));
    if (sortMode === "loved") result.sort((a, b) => b.reactions.heart - a.reactions.heart);

    return result;
  }, [stories, activeCategory, search, sortMode]);

  async function publishStory() {
    if (!nickname.trim() || !title.trim() || !text.trim()) {
      alert("Fill everything.");
      return;
    }

    if (text.trim().length < 20) {
      alert("Story is too short.");
      return;
    }

    const { error } = await supabase.from("stories").insert({
      nickname: nickname.trim().slice(0, 24),
      category,
      title: title.trim().slice(0, 90),
      text: text.trim().slice(0, 2500),
      owner_key: ownerKey,
    });

    if (error) {
      alert(error.message);
      return;
    }

    setTitle("");
    setText("");
    await loadEverything();
  }

  async function react(storyId: number, reaction: Reaction) {
    const old = myReaction[storyId];

    if (old === reaction) {
      await supabase.from("reactions").delete().eq("story_id", storyId).eq("user_key", ownerKey);
    } else if (old) {
      await supabase.from("reactions").update({ reaction }).eq("story_id", storyId).eq("user_key", ownerKey);
    } else {
      await supabase.from("reactions").insert({
        story_id: storyId,
        user_key: ownerKey,
        reaction,
      });
    }

    await loadEverything();
  }

  async function addComment(storyId: number) {
    const value = commentTexts[storyId]?.trim();
    if (!value) return;

    const { error } = await supabase.from("comments").insert({
      story_id: storyId,
      nickname: nickname.trim() || "anonymous",
      text: value.slice(0, 600),
      owner_key: ownerKey,
    });

    if (error) {
      alert(error.message);
      return;
    }

    setCommentTexts({ ...commentTexts, [storyId]: "" });
    await loadEverything();
  }

  async function reportStory(storyId: number) {
    if (reported[storyId]) return;

    await supabase.from("reports").insert({
      story_id: storyId,
      reason: "User reported this story",
    });

    setReported({ ...reported, [storyId]: true });
  }

  async function deleteMyStory(story: Story) {
    if (story.ownerKey !== ownerKey) return;
    if (!confirm("Delete this story?")) return;

    const { error } = await supabase.from("stories").delete().eq("id", story.id).eq("owner_key", ownerKey);

    if (error) {
      alert(error.message);
      return;
    }

    await loadEverything();
  }

  async function shareStory(story: Story) {
    const link = `${window.location.origin}?story=${story.id}`;
    await navigator.clipboard.writeText(link);
    alert(t.copied);
  }

  function randomStory() {
    if (stories.length === 0) return;

    const random = stories[Math.floor(Math.random() * stories.length)];
    setActiveCategory("All");
    setSearch("");
    setHighlightedId(random.id);

    setTimeout(() => {
      storyRefs.current[random.id]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);

    setTimeout(() => setHighlightedId(null), 3500);
  }

  return (
    <main style={styles.page}>
      <div style={styles.noise} />

      <section style={styles.hero}>
        <div>
          <p style={styles.logo}>{t.logo}</p>
          <h1 style={styles.title}>StoryMask</h1>
          <p style={styles.subtitle}>{t.subtitle}</p>
        </div>

        <div style={styles.heroActions}>
          <select value={language} onChange={(e) => setLanguage(e.target.value as Language)} style={styles.select}>
            <option value="en">EN</option>
            <option value="de">DE</option>
            <option value="ru">RU</option>
            <option value="fr">FR</option>
            <option value="it">IT</option>
          </select>

          <button onClick={randomStory} style={styles.mainButton}>{t.random}</button>
        </div>
      </section>

      {storyOfDay && (
        <section style={styles.storyDay}>
          <p style={styles.storyDayLabel}>✦ {t.storyDay}</p>
          <h2 style={styles.storyDayTitle}>{storyOfDay.title}</h2>
          <p style={styles.storyDayText}>{storyOfDay.text.slice(0, 180)}...</p>
        </section>
      )}

      <div style={styles.adBox}>
        <p style={styles.adSmall}>ADVERTISEMENT</p>
        <p style={styles.adText}>Your ad could be here</p>
      </div>

      <section style={styles.grid}>
        <div>
          <input
            placeholder={t.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.search}
          />

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

          <div style={styles.sortBar}>
            <button onClick={() => setSortMode("new")} style={{ ...styles.sortButton, background: sortMode === "new" ? "#7e22ce" : "#151515" }}>{t.new}</button>
            <button onClick={() => setSortMode("trending")} style={{ ...styles.sortButton, background: sortMode === "trending" ? "#7e22ce" : "#151515" }}>🔥 {t.trending}</button>
            <button onClick={() => setSortMode("loved")} style={{ ...styles.sortButton, background: sortMode === "loved" ? "#7e22ce" : "#151515" }}>❤️ {t.loved}</button>
          </div>

          <h2 style={styles.sectionTitle}>{t.stories}</h2>

          {loading && <div style={styles.emptyBox}>Loading...</div>}
          {!loading && filteredStories.length === 0 && <div style={styles.emptyBox}>{t.empty}</div>}

          {filteredStories.map((story, index) => (
            <div key={story.id} ref={(el) => { storyRefs.current[story.id] = el; }}>
              <article
                style={{
                  ...styles.card,
                  boxShadow: highlightedId === story.id ? "0 0 55px rgba(168,85,247,.55)" : "0 0 0 transparent",
                  border: highlightedId === story.id ? "1px solid #c084fc" : "1px solid #27272a",
                }}
              >
                <div style={styles.cardTop}>
                  <p style={styles.meta}>@{story.nickname} · {story.createdAt}</p>
                  <span style={styles.badge}>{story.category}</span>
                </div>

                <h3 style={styles.storyTitle}>{story.title}</h3>
                <p style={styles.storyText}>{story.text}</p>

                <div style={styles.reactions}>
                  <button onClick={() => react(story.id, "heart")} style={reactionStyle(myReaction[story.id] === "heart")}>❤️ {story.reactions.heart}</button>
                  <button onClick={() => react(story.id, "laugh")} style={reactionStyle(myReaction[story.id] === "laugh")}>😂 {story.reactions.laugh}</button>
                  <button onClick={() => react(story.id, "fear")} style={reactionStyle(myReaction[story.id] === "fear")}>😨 {story.reactions.fear}</button>
                  <button onClick={() => react(story.id, "shock")} style={reactionStyle(myReaction[story.id] === "shock")}>🤯 {story.reactions.shock}</button>
                </div>

                <div style={styles.cardActions}>
                  <button onClick={() => shareStory(story)} style={styles.actionButton}>↗ {t.share}</button>
                  <button onClick={() => reportStory(story.id)} style={styles.actionButton}>{reported[story.id] ? `✓ ${t.reported}` : `⚐ ${t.report}`}</button>
                  {story.ownerKey === ownerKey && (
                    <button onClick={() => deleteMyStory(story)} style={styles.deleteButton}>{t.deleteMine}</button>
                  )}
                </div>

                <div style={styles.commentsBox}>
                  <p style={styles.commentsTitle}>💬 {t.comments}</p>

                  {(comments[story.id] || []).slice(0, 5).map((comment) => (
                    <div key={comment.id} style={styles.comment}>
                      <b>@{comment.nickname}</b>
                      <p>{comment.text}</p>
                    </div>
                  ))}

                  <div style={styles.commentForm}>
                    <input
                      placeholder={t.comment}
                      value={commentTexts[story.id] || ""}
                      onChange={(e) => setCommentTexts({ ...commentTexts, [story.id]: e.target.value })}
                      style={styles.commentInput}
                    />
                    <button onClick={() => addComment(story.id)} style={styles.commentButton}>{t.send}</button>
                  </div>
                </div>
              </article>

              {(index + 1) % 3 === 0 && <div style={styles.smallAd}>Advertisement space</div>}
            </div>
          ))}
        </div>

        <aside style={styles.formBox}>
          <h2 style={styles.formTitle}>{t.write}</h2>
          <p style={styles.formText}>{t.formText}</p>

          <input placeholder="Nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} style={styles.input} />

          <select value={category} onChange={(e) => setCategory(e.target.value as Exclude<Category, "All">)} style={styles.input}>
            <option>Creepy</option>
            <option>Funny</option>
            <option>Scary</option>
            <option>Sad</option>
            <option>Love</option>
            <option>Secret</option>
          </select>

          <input placeholder="Story title" value={title} onChange={(e) => setTitle(e.target.value)} style={styles.input} />

          <textarea placeholder="Your anonymous story..." value={text} onChange={(e) => setText(e.target.value)} style={styles.textarea} />

          <button onClick={publishStory} style={styles.publishButton}>{t.publish}</button>

          <div style={styles.formAd}>Advertisement</div>
        </aside>
      </section>
    </main>
  );
}

function reactionStyle(active: boolean): CSSProperties {
  return {
    background: active ? "#581c87" : "#18181b",
    color: "white",
    border: active ? "1px solid #c084fc" : "1px solid transparent",
    borderRadius: "999px",
    padding: "10px 14px",
    cursor: "pointer",
    boxShadow: active ? "0 0 18px rgba(168,85,247,.35)" : "none",
  };
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top left, #3b0764, transparent 32%), radial-gradient(circle at bottom right, #172554, transparent 32%), #030303",
    color: "white",
    padding: "30px",
    fontFamily: "Arial, sans-serif",
    position: "relative",
    overflowX: "hidden",
  },
  noise: {
    position: "fixed",
    inset: 0,
    pointerEvents: "none",
    opacity: 0.08,
    backgroundImage:
      "linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)",
    backgroundSize: "42px 42px",
  },
  hero: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "35px",
    border: "1px solid #27272a",
    borderRadius: "32px",
    background: "rgba(0,0,0,0.62)",
    display: "flex",
    justifyContent: "space-between",
    gap: "25px",
    flexWrap: "wrap",
    boxShadow: "0 0 45px rgba(126,34,206,.14)",
  },
  heroActions: { display: "flex", gap: "12px", alignItems: "flex-start" },
  logo: { color: "#c084fc", letterSpacing: "5px", fontSize: "13px" },
  title: { fontSize: "70px", margin: "10px 0", fontWeight: 900 },
  subtitle: { color: "#d4d4d8", fontSize: "22px" },
  select: {
    background: "#111",
    color: "white",
    border: "1px solid #333",
    borderRadius: "14px",
    padding: "14px",
  },
  mainButton: {
    background: "white",
    color: "black",
    border: "none",
    borderRadius: "18px",
    padding: "17px 24px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  storyDay: {
    maxWidth: "1200px",
    margin: "25px auto",
    padding: "26px",
    borderRadius: "26px",
    background: "linear-gradient(135deg, rgba(88,28,135,.55), rgba(0,0,0,.6))",
    border: "1px solid #6b21a8",
  },
  storyDayLabel: { color: "#d8b4fe", letterSpacing: "4px", fontSize: "12px" },
  storyDayTitle: { fontSize: "32px", margin: "8px 0" },
  storyDayText: { color: "#d4d4d8", fontSize: "17px" },
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
  adSmall: { letterSpacing: "4px", fontSize: "11px" },
  adText: { marginTop: "5px" },
  grid: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "1fr 360px",
    gap: "25px",
  },
  search: {
    width: "100%",
    padding: "16px",
    borderRadius: "18px",
    border: "1px solid #27272a",
    background: "#080808",
    color: "white",
    marginBottom: "18px",
    fontSize: "16px",
  },
  categories: { display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "14px" },
  categoryButton: {
    border: "none",
    borderRadius: "999px",
    padding: "11px 18px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  sortBar: { display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "25px" },
  sortButton: {
    color: "white",
    border: "none",
    borderRadius: "14px",
    padding: "11px 16px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  sectionTitle: { fontSize: "32px", marginBottom: "15px" },
  emptyBox: { padding: "30px", borderRadius: "24px", background: "#111", color: "#999" },
  card: {
    background: "rgba(8,8,8,0.9)",
    borderRadius: "28px",
    padding: "25px",
    marginBottom: "20px",
    transition: "0.35s",
  },
  cardTop: { display: "flex", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" },
  meta: { color: "#8b8b8b", fontSize: "14px" },
  badge: {
    background: "#18181b",
    color: "#d4d4d8",
    borderRadius: "999px",
    padding: "7px 12px",
    fontSize: "13px",
  },
  storyTitle: { fontSize: "28px", marginTop: "15px", marginBottom: "10px" },
  storyText: { color: "#d4d4d8", fontSize: "18px", lineHeight: "1.7", whiteSpace: "pre-wrap" },
  reactions: { display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "20px" },
  cardActions: { display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "18px" },
  actionButton: {
    background: "transparent",
    color: "#c4b5fd",
    border: "1px solid #3b0764",
    borderRadius: "12px",
    padding: "10px 14px",
    cursor: "pointer",
  },
  deleteButton: {
    background: "transparent",
    color: "#fca5a5",
    border: "1px solid #7f1d1d",
    borderRadius: "12px",
    padding: "10px 14px",
    cursor: "pointer",
  },
  commentsBox: {
    marginTop: "22px",
    paddingTop: "18px",
    borderTop: "1px solid #27272a",
  },
  commentsTitle: { color: "#c4b5fd", fontWeight: "bold" },
  comment: {
    background: "#0f0f0f",
    border: "1px solid #27272a",
    borderRadius: "14px",
    padding: "12px",
    marginTop: "10px",
    color: "#d4d4d8",
  },
  commentForm: { display: "flex", gap: "10px", marginTop: "12px" },
  commentInput: {
    flex: 1,
    padding: "12px",
    borderRadius: "12px",
    border: "1px solid #333",
    background: "#050505",
    color: "white",
  },
  commentButton: {
    padding: "12px 14px",
    borderRadius: "12px",
    border: "none",
    background: "#7e22ce",
    color: "white",
    fontWeight: "bold",
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
    background: "rgba(10,10,10,0.92)",
    border: "1px solid #27272a",
    borderRadius: "28px",
    padding: "25px",
    height: "fit-content",
    position: "sticky",
    top: "20px",
  },
  formTitle: { fontSize: "28px", marginBottom: "8px" },
  formText: { color: "#999", marginBottom: "20px" },
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