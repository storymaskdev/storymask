"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

const translations = {
  en: {
    logo: "ANONYMOUS STORIES",
    subtitle: "Share the story you never told anyone.",
    random: "Tell me a random story",
    write: "Write your story",
    formText: "No real name. No profile picture. Just your words.",
    publish: "Publish anonymously",
    stories: "Stories",
    empty: "No stories here yet. Be the first.",
    loading: "Loading stories...",
    nickname: "Nickname",
    title: "Story title",
    text: "Your anonymous story...",
    ad: "Your ad could be here",
    share: "Share",
    report: "Report",
    reported: "Reported",
    copied: "Story link copied!",
    new: "New",
    trending: "Trending",
    loved: "Most Loved",
  },
  de: {
    logo: "ANONYME GESCHICHTEN",
    subtitle: "Teile die Geschichte, die du noch nie jemandem erzählt hast.",
    random: "Zufällige Geschichte",
    write: "Deine Geschichte",
    formText: "Kein echter Name. Kein Profilbild. Nur deine Worte.",
    publish: "Anonym veröffentlichen",
    stories: "Geschichten",
    empty: "Noch keine Geschichten hier.",
    loading: "Lade Geschichten...",
    nickname: "Nickname",
    title: "Titel",
    text: "Deine anonyme Geschichte...",
    ad: "Deine Werbung könnte hier sein",
    share: "Teilen",
    report: "Melden",
    reported: "Gemeldet",
    copied: "Link kopiert!",
    new: "Neu",
    trending: "Trending",
    loved: "Beliebt",
  },
  ru: {
    logo: "АНОНИМНЫЕ ИСТОРИИ",
    subtitle: "Расскажи историю, которую ты никому не говорил.",
    random: "Случайная история",
    write: "Написать историю",
    formText: "Без имени. Без фото. Только твои слова.",
    publish: "Опубликовать анонимно",
    stories: "Истории",
    empty: "Тут пока нет историй. Будь первым.",
    loading: "Загрузка историй...",
    nickname: "Ник",
    title: "Название истории",
    text: "Твоя анонимная история...",
    ad: "Твоя реклама может быть здесь",
    share: "Поделиться",
    report: "Жалоба",
    reported: "Отправлено",
    copied: "Ссылка скопирована!",
    new: "Новые",
    trending: "В тренде",
    loved: "Любимые",
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
    loading: "Chargement...",
    nickname: "Pseudo",
    title: "Titre",
    text: "Ton histoire anonyme...",
    ad: "Ta pub pourrait être ici",
    share: "Partager",
    report: "Signaler",
    reported: "Signalé",
    copied: "Lien copié !",
    new: "Nouveau",
    trending: "Tendance",
    loved: "Aimées",
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
    loading: "Caricamento...",
    nickname: "Nickname",
    title: "Titolo",
    text: "La tua storia anonima...",
    ad: "La tua pubblicità potrebbe essere qui",
    share: "Condividi",
    report: "Segnala",
    reported: "Segnalato",
    copied: "Link copiato!",
    new: "Nuove",
    trending: "Tendenza",
    loved: "Più amate",
  },
};

export default function Home() {
  const [stories, setStories] = useState<Story[]>([]);
  const [nickname, setNickname] = useState("");
  const [category, setCategory] = useState<Exclude<Category, "All">>("Creepy");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [sortMode, setSortMode] = useState<SortMode>("new");
  const [language, setLanguage] = useState<Language>("en");
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const [reportedStories, setReportedStories] = useState<Record<number, boolean>>({});
  const [userReactions, setUserReactions] = useState<Record<number, Reaction>>({});

  const storyRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const t = translations[language];

  useEffect(() => {
    loadStories();

    const savedReactions = localStorage.getItem("storymask_user_reactions");
    if (savedReactions) setUserReactions(JSON.parse(savedReactions));

    const savedReports = localStorage.getItem("storymask_reports");
    if (savedReports) setReportedStories(JSON.parse(savedReports));

    const savedLanguage = localStorage.getItem("storymask_language") as Language | null;
    if (savedLanguage) setLanguage(savedLanguage);
  }, []);

  useEffect(() => {
    localStorage.setItem("storymask_user_reactions", JSON.stringify(userReactions));
  }, [userReactions]);

  useEffect(() => {
    localStorage.setItem("storymask_reports", JSON.stringify(reportedStories));
  }, [reportedStories]);

  useEffect(() => {
    localStorage.setItem("storymask_language", language);
  }, [language]);

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
    let result = activeCategory === "All"
      ? [...stories]
      : stories.filter((story) => story.category === activeCategory);

    if (sortMode === "trending") {
      result.sort((a, b) => totalReactions(b) - totalReactions(a));
    }

    if (sortMode === "loved") {
      result.sort((a, b) => b.reactions.heart - a.reactions.heart);
    }

    return result;
  }, [stories, activeCategory, sortMode]);

  function totalReactions(story: Story) {
    return story.reactions.heart + story.reactions.laugh + story.reactions.fear + story.reactions.shock;
  }

  async function publishStory() {
    if (!nickname.trim() || !title.trim() || !text.trim()) {
      alert("Please fill everything.");
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
      text: text.trim().slice(0, 2000),
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
          newReactions[reaction] = Math.max(0, newReactions[reaction] - 1);

          const updated = { ...userReactions };
          delete updated[id];
          setUserReactions(updated);
        } else {
          if (previousReaction) {
            newReactions[previousReaction] = Math.max(0, newReactions[previousReaction] - 1);
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

  function randomStory() {
    if (stories.length === 0) {
      alert("No stories yet.");
      return;
    }

    const random = stories[Math.floor(Math.random() * stories.length)];

    setActiveCategory("All");
    setHighlightedId(random.id);

    setTimeout(() => {
      storyRefs.current[random.id]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);

    setTimeout(() => {
      setHighlightedId(null);
    }, 3500);
  }

  async function shareStory(story: Story) {
    const url = `${window.location.origin}/?story=${story.id}`;

    try {
      await navigator.clipboard.writeText(url);
      alert(t.copied);
    } catch {
      alert(`${story.title}\n${url}`);
    }
  }

  function reportStory(id: number) {
    setReportedStories({
      ...reportedStories,
      [id]: true,
    });
  }

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <div>
          <p style={styles.logo}>{t.logo}</p>
          <h1 style={styles.title}>StoryMask</h1>
          <p style={styles.subtitle}>{t.subtitle}</p>
        </div>

        <div style={styles.heroActions}>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            style={styles.languageSelect}
          >
            <option value="en">EN</option>
            <option value="de">DE</option>
            <option value="ru">RU</option>
            <option value="fr">FR</option>
            <option value="it">IT</option>
          </select>

          <button onClick={randomStory} style={styles.mainButton}>
            {t.random}
          </button>
        </div>
      </section>

      <div style={styles.adBox}>
        <p style={styles.adSmall}>ADVERTISEMENT</p>
        <p style={styles.adText}>{t.ad}</p>
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

          <div style={styles.sortBar}>
            <button
              onClick={() => setSortMode("new")}
              style={{
                ...styles.sortButton,
                background: sortMode === "new" ? "#7e22ce" : "#151515",
              }}
            >
              {t.new}
            </button>

            <button
              onClick={() => setSortMode("trending")}
              style={{
                ...styles.sortButton,
                background: sortMode === "trending" ? "#7e22ce" : "#151515",
              }}
            >
              🔥 {t.trending}
            </button>

            <button
              onClick={() => setSortMode("loved")}
              style={{
                ...styles.sortButton,
                background: sortMode === "loved" ? "#7e22ce" : "#151515",
              }}
            >
              ❤️ {t.loved}
            </button>
          </div>

          <h2 style={styles.sectionTitle}>{t.stories}</h2>

          {errorText && <div style={styles.errorBox}>{errorText}</div>}
          {loading && <div style={styles.emptyBox}>{t.loading}</div>}

          {!loading && filteredStories.length === 0 && (
            <div style={styles.emptyBox}>{t.empty}</div>
          )}

          {filteredStories.map((story, index) => (
            <div
              key={story.id}
              ref={(el) => {
                storyRefs.current[story.id] = el;
              }}
            >
              <article
                style={{
                  ...styles.card,
                  border:
                    highlightedId === story.id
                      ? "1px solid #c084fc"
                      : "1px solid #27272a",
                  boxShadow:
                    highlightedId === story.id
                      ? "0 0 45px rgba(168, 85, 247, 0.45)"
                      : "none",
                }}
              >
                <div style={styles.cardTop}>
                  <p style={styles.meta}>
                    @{story.nickname} · {story.createdAt}
                  </p>
                  <span style={styles.badge}>{story.category}</span>
                </div>

                <h3 style={styles.storyTitle}>{story.title}</h3>
                <p style={styles.storyText}>{story.text}</p>

                <div style={styles.reactions}>
                  <button
                    onClick={() => react(story.id, "heart")}
                    style={{
                      ...styles.reactionButton,
                      outline: userReactions[story.id] === "heart" ? "2px solid #c084fc" : "none",
                    }}
                  >
                    ❤️ {story.reactions.heart}
                  </button>

                  <button
                    onClick={() => react(story.id, "laugh")}
                    style={{
                      ...styles.reactionButton,
                      outline: userReactions[story.id] === "laugh" ? "2px solid #c084fc" : "none",
                    }}
                  >
                    😂 {story.reactions.laugh}
                  </button>

                  <button
                    onClick={() => react(story.id, "fear")}
                    style={{
                      ...styles.reactionButton,
                      outline: userReactions[story.id] === "fear" ? "2px solid #c084fc" : "none",
                    }}
                  >
                    😨 {story.reactions.fear}
                  </button>

                  <button
                    onClick={() => react(story.id, "shock")}
                    style={{
                      ...styles.reactionButton,
                      outline: userReactions[story.id] === "shock" ? "2px solid #c084fc" : "none",
                    }}
                  >
                    🤯 {story.reactions.shock}
                  </button>
                </div>

                <div style={styles.cardActions}>
                  <button onClick={() => shareStory(story)} style={styles.actionButton}>
                    ↗ {t.share}
                  </button>

                  <button
                    onClick={() => reportStory(story.id)}
                    style={styles.actionButton}
                    disabled={reportedStories[story.id]}
                  >
                    {reportedStories[story.id] ? `✓ ${t.reported}` : `⚐ ${t.report}`}
                  </button>
                </div>
              </article>

              {(index + 1) % 3 === 0 && (
                <div style={styles.smallAd}>Advertisement space</div>
              )}
            </div>
          ))}
        </div>

        <aside style={styles.formBox}>
          <h2 style={styles.formTitle}>{t.write}</h2>
          <p style={styles.formText}>{t.formText}</p>

          <input
            placeholder={t.nickname}
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
            placeholder={t.title}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={styles.input}
          />

          <textarea
            placeholder={t.text}
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={styles.textarea}
          />

          <button onClick={publishStory} style={styles.publishButton}>
            {t.publish}
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
  heroActions: {
    display: "flex",
    gap: "12px",
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  languageSelect: {
    background: "#151515",
    color: "white",
    border: "1px solid #333",
    borderRadius: "14px",
    padding: "14px",
    cursor: "pointer",
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
    marginBottom: "14px",
  },
  categoryButton: {
    border: "none",
    borderRadius: "999px",
    padding: "11px 18px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  sortBar: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "25px",
  },
  sortButton: {
    color: "white",
    border: "none",
    borderRadius: "14px",
    padding: "11px 16px",
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
    borderRadius: "28px",
    padding: "25px",
    marginBottom: "20px",
    transition: "0.35s",
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
  cardActions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginTop: "18px",
  },
  actionButton: {
    background: "transparent",
    color: "#c4b5fd",
    border: "1px solid #3b0764",
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