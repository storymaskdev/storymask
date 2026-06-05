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
  featured: boolean;
  reactions: Record<Reaction, number>;
};

type Comment = {
  id: number;
  story_id: number;
  parent_id: number | null;
  nickname: string;
  text: string;
  owner_key: string | null;
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
  featured: boolean | null;
};

type DbReaction = {
  story_id: number;
  user_key: string;
  reaction: Reaction;
};

type ProfileTarget = {
  nickname: string;
  seed: string;
};

type NotificationItem = {
  id: string;
  title: string;
  text: string;
  storyId: number;
};

const categories: Category[] = ["All", "Creepy", "Funny", "Scary", "Sad", "Love", "Secret"];

const alphabets: Record<Language, string> = {
  en: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
  de: "ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜabcdefghijklmnopqrstuvwxyzäöüß0123456789",
  ru: "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюя0123456789",
  fr: "ABCDEFGHIJKLMNOPQRSTUVWXYZÀÂÇÉÈÊËÎÏÔÙÛÜŸabcdefghijklmnopqrstuvwxyzàâçéèêëîïôùûüÿ0123456789",
  it: "ABCDEFGHIJKLMNOPQRSTUVWXYZÀÈÉÌÍÎÒÓÙabcdefghijklmnopqrstuvwxyzàèéìíîòóù0123456789",
};

const ui = {
  en: {
    logo: "ANONYMOUS STORIES",
    subtitle: "Share the story you never told anyone.",
    random: "Find a random story",
    confessionDay: "Confession of the day",
    write: "Write your story",
    formText: "No real name. No profile picture. Just your words.",
    publish: "Publish anonymously",
    stories: "Stories",
    empty: "No stories here yet. Be the first.",
    search: "Search stories...",
    comment: "Write a comment...",
    reply: "Reply",
    cancel: "Cancel",
    send: "Send",
    comments: "Comments",
    report: "Report",
    reported: "Reported",
    share: "Share",
    copied: "Link copied",
    storyDay: "Story of the Day",
    editorsPick: "Editor’s Pick",
    selectedWhisper: "Selected Whisper",
    new: "New",
    trending: "Trending",
    loved: "Most Loved",
    deleteMine: "Delete my story",
    ownStory: "Your story",
    ambientOn: "Night ambience on",
    ambientOff: "Night ambience off",
    notifications: "Notifications",
    noNotifications: "No new notifications.",
    profile: "Anonymous profile",
    profileStories: "Stories",
    profileComments: "Comments",
    close: "Close",
  },
  de: {
    logo: "ANONYME GESCHICHTEN",
    subtitle: "Teile die Geschichte, die du nie erzählt hast.",
    random: "Zufällige Geschichte",
    confessionDay: "Geständnis des Tages",
    write: "Deine Geschichte",
    formText: "Kein echter Name. Kein Profilbild. Nur deine Worte.",
    publish: "Anonym veröffentlichen",
    stories: "Geschichten",
    empty: "Noch keine Geschichten.",
    search: "Geschichten suchen...",
    comment: "Kommentar schreiben...",
    reply: "Antworten",
    cancel: "Abbrechen",
    send: "Senden",
    comments: "Kommentare",
    report: "Melden",
    reported: "Gemeldet",
    share: "Teilen",
    copied: "Link kopiert",
    storyDay: "Geschichte des Tages",
    editorsPick: "Editor’s Pick",
    selectedWhisper: "Ausgewähltes Flüstern",
    new: "Neu",
    trending: "Trending",
    loved: "Beliebt",
    deleteMine: "Meine Geschichte löschen",
    ownStory: "Deine Geschichte",
    ambientOn: "Nachtklang an",
    ambientOff: "Nachtklang aus",
    notifications: "Benachrichtigungen",
    noNotifications: "Keine neuen Benachrichtigungen.",
    profile: "Anonymes Profil",
    profileStories: "Geschichten",
    profileComments: "Kommentare",
    close: "Schließen",
  },
  ru: {
    logo: "АНОНИМНЫЕ ИСТОРИИ",
    subtitle: "Расскажи историю, которую ты никому не говорил.",
    random: "Найти случайную историю",
    confessionDay: "Исповедь дня",
    write: "Написать историю",
    formText: "Без имени. Без фото. Только твои слова.",
    publish: "Опубликовать анонимно",
    stories: "Истории",
    empty: "Тут пока нет историй. Будь первым.",
    search: "Поиск историй...",
    comment: "Написать комментарий...",
    reply: "Ответить",
    cancel: "Отмена",
    send: "Отправить",
    comments: "Комментарии",
    report: "Жалоба",
    reported: "Отправлено",
    share: "Поделиться",
    copied: "Ссылка скопирована",
    storyDay: "История дня",
    editorsPick: "Выбор редактора",
    selectedWhisper: "Избранный шёпот",
    new: "Новые",
    trending: "В тренде",
    loved: "Любимые",
    deleteMine: "Удалить мою историю",
    ownStory: "Твоя история",
    ambientOn: "Ночь вкл",
    ambientOff: "Ночь выкл",
    notifications: "Уведомления",
    noNotifications: "Новых уведомлений нет.",
    profile: "Анонимный профиль",
    profileStories: "Истории",
    profileComments: "Комментарии",
    close: "Закрыть",
  },
  fr: {
    logo: "HISTOIRES ANONYMES",
    subtitle: "Partage l’histoire que tu n’as jamais racontée.",
    random: "Histoire aléatoire",
    confessionDay: "Confession du jour",
    write: "Écris ton histoire",
    formText: "Pas de vrai nom. Pas de photo. Juste tes mots.",
    publish: "Publier anonymement",
    stories: "Histoires",
    empty: "Aucune histoire ici.",
    search: "Chercher...",
    comment: "Écrire un commentaire...",
    reply: "Répondre",
    cancel: "Annuler",
    send: "Envoyer",
    comments: "Commentaires",
    report: "Signaler",
    reported: "Signalé",
    share: "Partager",
    copied: "Lien copié",
    storyDay: "Histoire du jour",
    editorsPick: "Choix de l’éditeur",
    selectedWhisper: "Murmure sélectionné",
    new: "Nouveau",
    trending: "Tendance",
    loved: "Aimées",
    deleteMine: "Supprimer mon histoire",
    ownStory: "Ton histoire",
    ambientOn: "Nuit on",
    ambientOff: "Nuit off",
    notifications: "Notifications",
    noNotifications: "Aucune nouvelle notification.",
    profile: "Profil anonyme",
    profileStories: "Histoires",
    profileComments: "Commentaires",
    close: "Fermer",
  },
  it: {
    logo: "STORIE ANONIME",
    subtitle: "Condividi la storia che non hai mai raccontato.",
    random: "Storia casuale",
    confessionDay: "Confessione del giorno",
    write: "Scrivi la tua storia",
    formText: "Nessun nome reale. Nessuna foto. Solo parole.",
    publish: "Pubblica anonimamente",
    stories: "Storie",
    empty: "Ancora nessuna storia.",
    search: "Cerca storie...",
    comment: "Scrivi un commento...",
    reply: "Rispondi",
    cancel: "Annulla",
    send: "Invia",
    comments: "Commenti",
    report: "Segnala",
    reported: "Segnalato",
    share: "Condividi",
    copied: "Link copiato",
    storyDay: "Storia del giorno",
    editorsPick: "Scelta dell’editor",
    selectedWhisper: "Sussurro scelto",
    new: "Nuove",
    trending: "Tendenza",
    loved: "Più amate",
    deleteMine: "Elimina la mia storia",
    ownStory: "La tua storia",
    ambientOn: "Notte on",
    ambientOff: "Notte off",
    notifications: "Notifiche",
    noNotifications: "Nessuna nuova notifica.",
    profile: "Profilo anonimo",
    profileStories: "Storie",
    profileComments: "Commenti",
    close: "Chiudi",
  },
};

function makeKey() {
  return crypto.randomUUID();
}

function hashString(value: string) {
  let hash = 2166136261;

  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function getDeviceHint() {
  if (typeof window === "undefined") return "server";

  const raw = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  ].join("|");

  return `device-${hashString(raw).toString(36)}`;
}

function getOwnerKeyNow() {
  let key = localStorage.getItem("storymask_owner_key");

  if (!key) {
    key = `${getDeviceHint()}-${makeKey()}`;
    localStorage.setItem("storymask_owner_key", key);
  }

  return key;
}

function makeDisplayCode(seed: string | null | undefined, language: Language) {
  const alphabet = alphabets[language] || alphabets.en;
  let hash = hashString(`${seed || "unknown"}-${language}-storymask`);
  let result = "";

  for (let i = 0; i < 10; i++) {
    hash = Math.imul(hash ^ (hash >>> 13), 2246822519) >>> 0;
    result += alphabet[hash % alphabet.length];
  }

  return result;
}

function UserLabel({
  nickname,
  seed,
  language,
  onClick,
}: {
  nickname: string;
  seed: string | null | undefined;
  language: Language;
  onClick?: () => void;
}) {
  const clean = nickname?.trim() || "anonymous";

  return (
    <span
      style={{
        ...styles.userLabel,
        cursor: onClick ? "pointer" : "default",
      }}
      onClick={(event) => {
        event.stopPropagation();
        onClick?.();
      }}
      title={onClick ? "Open anonymous profile" : ""}
    >
      <span>@{clean}</span>
      <span style={styles.userCode}>({makeDisplayCode(seed || clean, language)})</span>
    </span>
  );
}

export default function Home() {
  const [stories, setStories] = useState<Story[]>([]);
  const [comments, setComments] = useState<Record<number, Comment[]>>({});
  const [commentTexts, setCommentTexts] = useState<Record<number, string>>({});
  const [replyTexts, setReplyTexts] = useState<Record<number, string>>({});
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
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
  const [openedStory, setOpenedStory] = useState<Story | null>(null);
  const [profileTarget, setProfileTarget] = useState<ProfileTarget | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [ambientOn, setAmbientOn] = useState(false);

  const storyRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const audioRef = useRef<AudioContext | null>(null);
  const audioNodesRef = useRef<AudioNode[]>([]);
  const intervalRef = useRef<number | null>(null);

  const t = ui[language];

  useEffect(() => {
    const key = getOwnerKeyNow();
    setOwnerKey(key);

    const savedLang = localStorage.getItem("storymask_language") as Language | null;
    if (savedLang) setLanguage(savedLang);

    loadEverything(key);
  }, []);

  useEffect(() => {
    localStorage.setItem("storymask_language", language);
  }, [language]);

  async function loadEverything(currentKey = ownerKey) {
    const realKey = currentKey || getOwnerKeyNow();

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
    const { data: commentData } = await supabase
      .from("comments")
      .select("*")
      .order("created_at", { ascending: true });

    const reactionMap: Record<number, Record<Reaction, number>> = {};
    const myMap: Record<number, Reaction> = {};

    (reactionData as DbReaction[] | null)?.forEach((r) => {
      if (!reactionMap[r.story_id]) {
        reactionMap[r.story_id] = { heart: 0, laugh: 0, fear: 0, shock: 0 };
      }

      reactionMap[r.story_id][r.reaction] += 1;

      if (r.user_key === realKey) {
        myMap[r.story_id] = r.reaction;
      }
    });

    const loadedStories: Story[] = (storyData as DbStory[]).map((s) => ({
      id: s.id,
      nickname: s.nickname,
      category: s.category,
      title: s.title,
      text: s.text,
      createdAt: new Date(s.created_at).toLocaleString(),
      ownerKey: s.owner_key,
      featured: Boolean(s.featured),
      reactions: reactionMap[s.id] || { heart: 0, laugh: 0, fear: 0, shock: 0 },
    }));

    const commentMap: Record<number, Comment[]> = {};
    (commentData as Comment[] | null)?.forEach((c) => {
      if (!commentMap[c.story_id]) commentMap[c.story_id] = [];
      commentMap[c.story_id].push(c);
    });

    setStories(loadedStories);
    setComments(commentMap);
    setMyReaction(myMap);
    setLoading(false);
  }

  function total(story: Story) {
    return story.reactions.heart + story.reactions.laugh + story.reactions.fear + story.reactions.shock;
  }

  function commentCount(storyId: number) {
    return (comments[storyId] || []).length;
  }

  const storyOfDay = useMemo(() => {
    if (stories.length === 0) return null;
    const day = new Date().getDate();
    return stories[day % stories.length];
  }, [stories]);

  const confessionOfDay = useMemo(() => {
    if (stories.length === 0) return null;

    return [...stories].sort((a, b) => {
      const aScore = total(a) + commentCount(a.id) * 2;
      const bScore = total(b) + commentCount(b.id) * 2;
      return bScore - aScore;
    })[0];
  }, [stories, comments]);

  const featuredStories = useMemo(() => stories.filter((story) => story.featured), [stories]);
  const editorPick = useMemo(() => featuredStories[0] || null, [featuredStories]);

  const notifications = useMemo<NotificationItem[]>(() => {
    if (!ownerKey) return [];

    const seenRaw = typeof window !== "undefined" ? localStorage.getItem("storymask_seen_notifications") : null;
    const seen = new Set(seenRaw ? JSON.parse(seenRaw) as string[] : []);

    const items: NotificationItem[] = [];
    const allComments = Object.values(comments).flat();

    for (const story of stories) {
      if (story.ownerKey !== ownerKey) continue;

      for (const comment of allComments.filter((c) => c.story_id === story.id && c.owner_key !== ownerKey)) {
        const id = `comment-${comment.id}`;
        if (!seen.has(id)) {
          items.push({
            id,
            title: `New comment on "${story.title}"`,
            text: comment.text,
            storyId: story.id,
          });
        }
      }
    }

    const commentById: Record<number, Comment> = {};
    allComments.forEach((comment) => {
      commentById[comment.id] = comment;
    });

    for (const comment of allComments) {
      if (!comment.parent_id || comment.owner_key === ownerKey) continue;

      const parent = commentById[comment.parent_id];
      if (!parent || parent.owner_key !== ownerKey) continue;

      const id = `reply-${comment.id}`;
      if (!seen.has(id)) {
        items.push({
          id,
          title: "New reply to your comment",
          text: comment.text,
          storyId: comment.story_id,
        });
      }
    }

    return items.slice(0, 12);
  }, [comments, stories, ownerKey]);

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

  const profileStories = useMemo(() => {
    if (!profileTarget) return [];

    return stories.filter((story) => (story.ownerKey || `story-${story.id}`) === profileTarget.seed);
  }, [profileTarget, stories]);

  const profileComments = useMemo(() => {
    if (!profileTarget) return [];

    return Object.values(comments)
      .flat()
      .filter((comment) => (comment.owner_key || `comment-${comment.id}`) === profileTarget.seed);
  }, [profileTarget, comments]);

  function openProfile(nicknameValue: string, seed: string | null | undefined) {
    setProfileTarget({
      nickname: nicknameValue || "anonymous",
      seed: seed || nicknameValue || "anonymous",
    });
  }

  function markNotificationsRead() {
    const oldRaw = localStorage.getItem("storymask_seen_notifications");
    const old = oldRaw ? JSON.parse(oldRaw) as string[] : [];
    const next = Array.from(new Set([...old, ...notifications.map((item) => item.id)]));
    localStorage.setItem("storymask_seen_notifications", JSON.stringify(next));
    setShowNotifications(false);
  }

  function jumpToStory(storyId: number) {
    setOpenedStory(null);
    setProfileTarget(null);
    setActiveCategory("All");
    setSearch("");
    setHighlightedId(storyId);

    setTimeout(() => {
      storyRefs.current[storyId]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);

    setTimeout(() => setHighlightedId(null), 3500);
  }

  async function publishStory() {
    const realKey = ownerKey || getOwnerKeyNow();
    setOwnerKey(realKey);

    if (!title || !text) {
      alert("Fill everything.")
      return
    }

    const finalNickname =
  nickname.trim() !== ""
    ? nickname.trim()
    : "Anonymous"

    const { error } = await supabase.from("stories").insert({
      nickname: finalNickname.slice(0, 24),
      category,
      title: title.trim().slice(0, 90),
      text: text.trim().slice(0, 2500),
      owner_key: realKey,
      featured: false,
    });

    if (error) {
      alert(error.message);
      return;
    }

    setTitle("");
    setText("");
    await loadEverything(realKey);
  }

  async function react(storyId: number, reaction: Reaction) {
    const realKey = ownerKey || getOwnerKeyNow();
    setOwnerKey(realKey);

    const old = myReaction[storyId];

    if (old === reaction) {
      await supabase.from("reactions").delete().eq("story_id", storyId).eq("user_key", realKey);
    } else if (old) {
      await supabase.from("reactions").update({ reaction }).eq("story_id", storyId).eq("user_key", realKey);
    } else {
      const { error } = await supabase.from("reactions").insert({
        story_id: storyId,
        user_key: realKey,
        reaction,
      });

      if (error) {
        alert("You already reacted to this story.");
      }
    }

    await loadEverything(realKey);
  }

  async function addComment(storyId: number, parentId: number | null = null) {
    const realKey = ownerKey || getOwnerKeyNow();
    setOwnerKey(realKey);

    const value = parentId ? replyTexts[parentId]?.trim() : commentTexts[storyId]?.trim();
    if (!value) return;

    const { error } = await supabase.from("comments").insert({
      story_id: storyId,
      parent_id: parentId,
      nickname: nickname.trim() || "anonymous",
      text: value.slice(0, 600),
      owner_key: realKey,
    });

    if (error) {
      alert(error.message);
      return;
    }

    if (parentId) {
      setReplyTexts({ ...replyTexts, [parentId]: "" });
      setReplyingTo(null);
    } else {
      setCommentTexts({ ...commentTexts, [storyId]: "" });
    }

    await loadEverything(realKey);
  }

  async function reportStory(storyId: number) {
    if (reported[storyId]) return;

    const { error } = await supabase.from("reports").insert({
      story_id: storyId,
      reason: "User reported this story",
      status: "open",
    });

    if (error) {
      alert(error.message);
      return;
    }

    setReported({ ...reported, [storyId]: true });
  }

  async function deleteMyStory(story: Story) {
    const realKey = ownerKey || getOwnerKeyNow();

    if (story.ownerKey !== realKey) {
      alert("You can delete only stories posted from this browser.");
      return;
    }

    if (!confirm("Delete this story?")) return;

    const { error } = await supabase.from("stories").delete().eq("id", story.id).eq("owner_key", realKey);

    if (error) {
      alert(error.message);
      return;
    }

    if (openedStory?.id === story.id) {
      setOpenedStory(null);
    }

    await loadEverything(realKey);
  }

  async function shareStory(story: Story) {
    const link = `${window.location.origin}?story=${story.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: story.title,
          text: story.text.slice(0, 120),
          url: link,
        });
        return;
      } catch {}
    }

    await navigator.clipboard.writeText(link);
    alert(t.copied);
  }

  async function shareConfessionOfDay() {
    if (!confessionOfDay) return;
    await shareStory(confessionOfDay);
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

  function startBird(context: AudioContext, masterGain: GainNode) {
    const start = context.currentTime + 0.05;
    const bird = context.createOscillator();
    const birdGain = context.createGain();

    bird.type = "sine";
    bird.frequency.setValueAtTime(1650 + Math.random() * 600, start);
    bird.frequency.exponentialRampToValueAtTime(2300 + Math.random() * 500, start + 0.16);

    birdGain.gain.setValueAtTime(0.0001, start);
    birdGain.gain.linearRampToValueAtTime(0.018, start + 0.04);
    birdGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.34);

    bird.connect(birdGain);
    birdGain.connect(masterGain);

    bird.start(start);
    bird.stop(start + 0.42);
  }

  function startDistantTrain(context: AudioContext, masterGain: GainNode) {
    const start = context.currentTime;
    const train = context.createOscillator();
    const trainGain = context.createGain();
    const filter = context.createBiquadFilter();

    train.type = "sine";
    train.frequency.setValueAtTime(70, start);
    train.frequency.linearRampToValueAtTime(58, start + 8);

    trainGain.gain.setValueAtTime(0.0001, start);
    trainGain.gain.linearRampToValueAtTime(0.012, start + 2);
    trainGain.gain.linearRampToValueAtTime(0.0001, start + 9);

    filter.type = "lowpass";
    filter.frequency.value = 250;

    train.connect(filter);
    filter.connect(trainGain);
    trainGain.connect(masterGain);

    train.start(start);
    train.stop(start + 9.5);
  }

  function toggleAmbient() {
    if (ambientOn) {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      if (audioRef.current) {
        audioRef.current.close();
        audioRef.current = null;
      }

      audioNodesRef.current = [];
      setAmbientOn(false);
      return;
    }

    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    const context = new AudioContextClass();
    const masterGain = context.createGain();
    masterGain.gain.value = 0.032;
    masterGain.connect(context.destination);

    const bufferSize = context.sampleRate * 4;
    const noiseBuffer = context.createBuffer(1, bufferSize, context.sampleRate);
    const data = noiseBuffer.getChannelData(0);

    let last = 0;
    for (let i = 0; i < bufferSize; i++) {
      last = last * 0.993 + (Math.random() * 2 - 1) * 0.007;
      data[i] = last * 0.4;
    }

    const wind = context.createBufferSource();
    wind.buffer = noiseBuffer;
    wind.loop = true;

    const windFilter = context.createBiquadFilter();
    windFilter.type = "lowpass";
    windFilter.frequency.value = 380;

    const windGain = context.createGain();
    windGain.gain.value = 0.3;

    wind.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(masterGain);
    wind.start();

    const airTone = context.createOscillator();
    const airGain = context.createGain();

    airTone.type = "sine";
    airTone.frequency.value = 88;
    airGain.gain.value = 0.004;

    airTone.connect(airGain);
    airGain.connect(masterGain);
    airTone.start();

    const cricket = context.createOscillator();
    const cricketGain = context.createGain();
    cricket.type = "triangle";
    cricket.frequency.value = 4200;
    cricketGain.gain.value = 0.0018;
    cricket.connect(cricketGain);
    cricketGain.connect(masterGain);
    cricket.start();

    [4, 13, 27].forEach((delay) => {
      window.setTimeout(() => {
        if (audioRef.current) startBird(context, masterGain);
      }, delay * 1000);
    });

    window.setTimeout(() => {
      if (audioRef.current) startDistantTrain(context, masterGain);
    }, 18000);

    intervalRef.current = window.setInterval(() => {
      if (!audioRef.current) return;

      if (Math.random() > 0.35) startBird(context, masterGain);
      if (Math.random() > 0.86) startDistantTrain(context, masterGain);
    }, 18000);

    audioRef.current = context;
    audioNodesRef.current = [masterGain, windFilter, windGain, airGain, cricketGain];
    setAmbientOn(true);
  }

  function openStory(story: Story) {
    setOpenedStory(story);
  }

  function renderComments(story: Story, parentId: number | null = null, depth = 0) {
    const list = (comments[story.id] || []).filter((comment) => comment.parent_id === parentId);

    return list.map((comment) => (
      <div key={comment.id} style={{ ...styles.comment, marginLeft: depth > 0 ? "22px" : 0 }}>
        <b>
          <UserLabel
            nickname={comment.nickname}
            seed={comment.owner_key || `comment-${comment.id}`}
            language={language}
            onClick={() => openProfile(comment.nickname, comment.owner_key || `comment-${comment.id}`)}
          />
        </b>
        <p>{comment.text}</p>

        <button onClick={() => setReplyingTo(comment.id)} style={styles.replyButton}>
          {t.reply}
        </button>

        {replyingTo === comment.id && (
          <div style={styles.replyForm}>
            <input
              placeholder={t.comment}
              value={replyTexts[comment.id] || ""}
              onChange={(e) => setReplyTexts({ ...replyTexts, [comment.id]: e.target.value })}
              style={styles.commentInput}
            />
            <button onClick={() => addComment(story.id, comment.id)} style={styles.commentButton}>
              {t.send}
            </button>
            <button onClick={() => setReplyingTo(null)} style={styles.cancelButton}>
              {t.cancel}
            </button>
          </div>
        )}

        {renderComments(story, comment.id, depth + 1)}
      </div>
    ));
  }

  function StoryPreview({ story }: { story: Story }) {
    return (
      <div style={styles.previewCard} onClick={() => openStory(story)}>
        <div style={styles.cardTop}>
          <p style={styles.meta}>
            <UserLabel
              nickname={story.nickname}
              seed={story.ownerKey || `story-${story.id}`}
              language={language}
              onClick={() => openProfile(story.nickname, story.ownerKey || `story-${story.id}`)}
            />
            {" · "}
            {story.createdAt}
          </p>
          <span style={styles.badge}>{story.category}</span>
        </div>
        <h3 style={styles.previewTitle}>{story.title}</h3>
        <p style={styles.previewText}>{story.text.slice(0, 220)}...</p>
      </div>
    );
  }

  return (
    <main style={styles.page}>
      <style>{`
        @keyframes floatParticle {
          0% { transform: translateY(0px); opacity: .15; }
          50% { opacity: .45; }
          100% { transform: translateY(-120vh); opacity: .05; }
        }

        @keyframes softPulse {
          0%, 100% { opacity: .72; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.02); }
        }

        @keyframes shimmer {
          0% { background-position: -300px 0; }
          100% { background-position: 300px 0; }
        }

        .story-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 0 42px rgba(168, 85, 247, 0.24) !important;
          border-color: #7e22ce !important;
        }

        .ambient-dot {
          position: fixed;
          bottom: -20px;
          width: 4px;
          height: 4px;
          border-radius: 999px;
          background: rgba(216,180,254,.7);
          pointer-events: none;
          animation: floatParticle linear infinite;
          z-index: 0;
        }

        @media (max-width: 900px) {
          .storymask-grid {
            grid-template-columns: 1fr !important;
          }

          .storymask-title {
            font-size: 48px !important;
          }

          .storymask-form {
            position: static !important;
          }

          .pick-grid {
            grid-template-columns: 1fr !important;
          }

          .comment-form-mobile {
            flex-direction: column !important;
          }
        }
      `}</style>

      <div style={styles.noise} />

      {Array.from({ length: 28 }).map((_, index) => (
        <span
          key={index}
          className="ambient-dot"
          style={{
            left: `${(index * 37) % 100}%`,
            animationDuration: `${9 + (index % 8)}s`,
            animationDelay: `${index * 0.45}s`,
          }}
        />
      ))}

      <button onClick={toggleAmbient} style={styles.ambientButton}>
        {ambientOn ? `🌙 ${t.ambientOn}` : `🍃 ${t.ambientOff}`}
      </button>

      <button onClick={() => setShowNotifications(true)} style={styles.notificationButton}>
        🔔
        {notifications.length > 0 && <span style={styles.notificationBadge}>{notifications.length}</span>}
      </button>

      <section style={styles.hero}>
        <div>
          <p style={styles.logo}>{t.logo}</p>
          <h1 className="storymask-title" style={styles.title}>
            StoryMask
          </h1>
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

          <button onClick={randomStory} style={styles.mainButton}>
            {t.random}
          </button>
        </div>
      </section>

      {(editorPick || storyOfDay) && (
        <section className="pick-grid" style={styles.pickGrid}>
          {editorPick && (
            <div style={styles.editorPick} onClick={() => openStory(editorPick)}>
              <p style={styles.pickLabel}>★ {t.editorsPick}</p>
              <h2 style={styles.pickTitle}>{editorPick.title}</h2>
              <p style={styles.pickText}>{editorPick.text.slice(0, 210)}...</p>
              <p style={styles.pickMeta}>
                <UserLabel
                  nickname={editorPick.nickname}
                  seed={editorPick.ownerKey || `story-${editorPick.id}`}
                  language={language}
                  onClick={() => openProfile(editorPick.nickname, editorPick.ownerKey || `story-${editorPick.id}`)}
                />
                {" · "}
                {editorPick.category}
              </p>
            </div>
          )}

          {storyOfDay && (
            <div style={styles.storyDay} onClick={() => openStory(storyOfDay)}>
              <p style={styles.storyDayLabel}>✦ {t.storyDay}</p>
              <h2 style={styles.storyDayTitle}>{storyOfDay.title}</h2>
              <p style={styles.storyDayText}>{storyOfDay.text.slice(0, 180)}...</p>
            </div>
          )}
        </section>
      )}

      {confessionOfDay && (
        <section style={styles.confessionBox}>
          <div onClick={() => openStory(confessionOfDay)} style={{ cursor: "pointer" }}>
            <p style={styles.pickLabel}>☾ {t.confessionDay}</p>
            <h2 style={styles.confessionTitle}>{confessionOfDay.title}</h2>
            <p style={styles.confessionText}>{confessionOfDay.text.slice(0, 260)}...</p>
          </div>

          <button onClick={shareConfessionOfDay} style={styles.confessionButton}>
            ↗ {t.share}
          </button>
        </section>
      )}

      {featuredStories.length > 1 && (
        <section style={styles.featuredStrip}>
          <p style={styles.featuredTitle}>✦ {t.selectedWhisper}</p>
          <div style={styles.featuredList}>
            {featuredStories.slice(1, 4).map((story) => (
              <StoryPreview key={story.id} story={story} />
            ))}
          </div>
        </section>
      )}

      <section className="storymask-grid" style={styles.grid}>
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
            <button onClick={() => setSortMode("new")} style={{ ...styles.sortButton, background: sortMode === "new" ? "#7e22ce" : "#151515" }}>
              {t.new}
            </button>
            <button onClick={() => setSortMode("trending")} style={{ ...styles.sortButton, background: sortMode === "trending" ? "#7e22ce" : "#151515" }}>
              🔥 {t.trending}
            </button>
            <button onClick={() => setSortMode("loved")} style={{ ...styles.sortButton, background: sortMode === "loved" ? "#7e22ce" : "#151515" }}>
              ❤️ {t.loved}
            </button>
          </div>

          <h2 style={styles.sectionTitle}>{t.stories}</h2>

          {loading && <div style={styles.emptyBox}>Loading...</div>}
          {!loading && filteredStories.length === 0 && <div style={styles.emptyBox}>{t.empty}</div>}

          {filteredStories.map((story, index) => (
            <div key={story.id} ref={(el) => { storyRefs.current[story.id] = el; }}>
              <article
                className="story-card"
                style={{
                  ...styles.card,
                  boxShadow: highlightedId === story.id ? "0 0 55px rgba(168,85,247,.55)" : "0 0 0 transparent",
                  border: highlightedId === story.id ? "1px solid #c084fc" : "1px solid #27272a",
                }}
              >
                <div style={styles.cardTop} onClick={() => openStory(story)}>
                  <p style={styles.meta}>
                    <UserLabel
                      nickname={story.nickname}
                      seed={story.ownerKey || `story-${story.id}`}
                      language={language}
                      onClick={() => openProfile(story.nickname, story.ownerKey || `story-${story.id}`)}
                    />
                    {" · "}
                    {story.createdAt}
                  </p>

                  <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                    {story.ownerKey === ownerKey && <span style={styles.ownBadge}>✓ {t.ownStory}</span>}
                    {story.featured && <span style={styles.featuredBadge}>★ Featured</span>}
                    <span style={styles.badge}>{story.category}</span>
                  </div>
                </div>

                <h3 onClick={() => openStory(story)} style={styles.storyTitle}>
                  {story.title}
                </h3>
                <p onClick={() => openStory(story)} style={styles.storyText}>
  {story.text.length > 140
    ? story.text.slice(0, 140) + "..."
    : story.text}
</p>

                <div style={styles.reactions}>
                  <button onClick={() => react(story.id, "heart")} style={reactionStyle(myReaction[story.id] === "heart")}>❤️ {story.reactions.heart}</button>
                  <button onClick={() => react(story.id, "laugh")} style={reactionStyle(myReaction[story.id] === "laugh")}>😂 {story.reactions.laugh}</button>
                  <button onClick={() => react(story.id, "fear")} style={reactionStyle(myReaction[story.id] === "fear")}>😨 {story.reactions.fear}</button>
                  <button onClick={() => react(story.id, "shock")} style={reactionStyle(myReaction[story.id] === "shock")}>🤯 {story.reactions.shock}</button>
                </div>

                <div style={styles.cardActions}>
                  <button onClick={() => shareStory(story)} style={styles.actionButton}>↗ {t.share}</button>
                  <button onClick={() => reportStory(story.id)} style={styles.actionButton}>
                    {reported[story.id] ? `✓ ${t.reported}` : `⚐ ${t.report}`}
                  </button>
                  {story.ownerKey === ownerKey && (
                    <button onClick={() => deleteMyStory(story)} style={styles.deleteButton}>
                      {t.deleteMine}
                    </button>
                  )}
                </div>

                <div style={styles.commentsBox}>
                  <p style={styles.commentsTitle}>
                    💬 {t.comments} <span style={styles.commentCounter}>({commentCount(story.id)})</span>
                  </p>

                  {renderComments(story)}

                  <div className="comment-form-mobile" style={styles.commentForm}>
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

        <aside className="storymask-form" style={styles.formBox}>
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

        </aside>
      </section>

      {openedStory && (
        <div style={styles.modalOverlay} onClick={() => setOpenedStory(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setOpenedStory(null)} style={styles.modalClose}>
              ×
            </button>

            <p style={styles.meta}>
              <UserLabel
                nickname={openedStory.nickname}
                seed={openedStory.ownerKey || `story-${openedStory.id}`}
                language={language}
                onClick={() => openProfile(openedStory.nickname, openedStory.ownerKey || `story-${openedStory.id}`)}
              />
              {" · "}
              {openedStory.createdAt}
            </p>

            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
              {openedStory.ownerKey === ownerKey && <span style={styles.ownBadge}>✓ {t.ownStory}</span>}
              {openedStory.featured && <span style={styles.featuredBadge}>★ Featured</span>}
              <span style={styles.badge}>{openedStory.category}</span>
            </div>

            <h2 style={styles.modalTitle}>{openedStory.title}</h2>
            <p style={styles.modalText}>{openedStory.text}</p>

            <div style={styles.reactions}>
              <button onClick={() => react(openedStory.id, "heart")} style={reactionStyle(myReaction[openedStory.id] === "heart")}>❤️ {openedStory.reactions.heart}</button>
              <button onClick={() => react(openedStory.id, "laugh")} style={reactionStyle(myReaction[openedStory.id] === "laugh")}>😂 {openedStory.reactions.laugh}</button>
              <button onClick={() => react(openedStory.id, "fear")} style={reactionStyle(myReaction[openedStory.id] === "fear")}>😨 {openedStory.reactions.fear}</button>
              <button onClick={() => react(openedStory.id, "shock")} style={reactionStyle(myReaction[openedStory.id] === "shock")}>🤯 {openedStory.reactions.shock}</button>
            </div>

            <div style={styles.cardActions}>
              <button onClick={() => shareStory(openedStory)} style={styles.actionButton}>↗ {t.share}</button>
              <button onClick={() => reportStory(openedStory.id)} style={styles.actionButton}>
                {reported[openedStory.id] ? `✓ ${t.reported}` : `⚐ ${t.report}`}
              </button>
              {openedStory.ownerKey === ownerKey && (
                <button onClick={() => deleteMyStory(openedStory)} style={styles.deleteButton}>
                  {t.deleteMine}
                </button>
              )}
            </div>

            <div style={styles.commentsBox}>
              <p style={styles.commentsTitle}>
                💬 {t.comments} <span style={styles.commentCounter}>({commentCount(openedStory.id)})</span>
              </p>

              {renderComments(openedStory)}

              <div className="comment-form-mobile" style={styles.commentForm}>
                <input
                  placeholder={t.comment}
                  value={commentTexts[openedStory.id] || ""}
                  onChange={(e) => setCommentTexts({ ...commentTexts, [openedStory.id]: e.target.value })}
                  style={styles.commentInput}
                />
                <button onClick={() => addComment(openedStory.id)} style={styles.commentButton}>
                  {t.send}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {profileTarget && (
        <div style={styles.modalOverlay} onClick={() => setProfileTarget(null)}>
          <div style={styles.profileModal} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setProfileTarget(null)} style={styles.modalClose}>
              ×
            </button>

            <p style={styles.logo}>{t.profile}</p>
            <h2 style={styles.profileName}>
              <UserLabel nickname={profileTarget.nickname} seed={profileTarget.seed} language={language} />
            </h2>

            <div style={styles.profileStats}>
              <div style={styles.statMini}>
                <b>{profileStories.length}</b>
                <span>{t.profileStories}</span>
              </div>
              <div style={styles.statMini}>
                <b>{profileComments.length}</b>
                <span>{t.profileComments}</span>
              </div>
            </div>

            <h3>{t.profileStories}</h3>
            {profileStories.length === 0 && <p style={styles.muted}>No stories yet.</p>}
            {profileStories.map((story) => (
              <div key={story.id} style={styles.profileItem} onClick={() => openStory(story)}>
                <b>{story.title}</b>
                <p>{story.text.slice(0, 140)}...</p>
              </div>
            ))}

            <h3>{t.profileComments}</h3>
            {profileComments.length === 0 && <p style={styles.muted}>No comments yet.</p>}
            {profileComments.map((comment) => (
              <div key={comment.id} style={styles.profileItem} onClick={() => jumpToStory(comment.story_id)}>
                <p>{comment.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {showNotifications && (
        <div style={styles.modalOverlay} onClick={() => setShowNotifications(false)}>
          <div style={styles.notificationPanel} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowNotifications(false)} style={styles.modalClose}>
              ×
            </button>

            <p style={styles.logo}>{t.notifications}</p>
            <h2 style={styles.modalTitle}>🔔 {t.notifications}</h2>

            {notifications.length === 0 && <p style={styles.muted}>{t.noNotifications}</p>}

            {notifications.map((item) => (
              <div key={item.id} style={styles.notificationItem} onClick={() => jumpToStory(item.storyId)}>
                <b>{item.title}</b>
                <p>{item.text.slice(0, 160)}</p>
              </div>
            ))}

            {notifications.length > 0 && (
              <button onClick={markNotificationsRead} style={styles.publishButton}>
                Mark as read
              </button>
            )}
          </div>
        </div>
      )}
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
    zIndex: 0,
  },
  ambientButton: {
    position: "fixed",
    right: "22px",
    bottom: "22px",
    zIndex: 50,
    background: "rgba(10,10,10,.86)",
    color: "#e9d5ff",
    border: "1px solid #581c87",
    borderRadius: "999px",
    padding: "12px 16px",
    cursor: "pointer",
    boxShadow: "0 0 25px rgba(168,85,247,.25)",
  },
  notificationButton: {
    position: "fixed",
    right: "22px",
    bottom: "76px",
    zIndex: 50,
    background: "rgba(10,10,10,.86)",
    color: "#e9d5ff",
    border: "1px solid #581c87",
    borderRadius: "999px",
    width: "48px",
    height: "48px",
    cursor: "pointer",
    boxShadow: "0 0 25px rgba(168,85,247,.25)",
  },
  notificationBadge: {
    position: "absolute",
    top: "-6px",
    right: "-4px",
    background: "#ef4444",
    color: "white",
    borderRadius: "999px",
    padding: "2px 6px",
    fontSize: "12px",
    fontWeight: "bold",
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
    position: "relative",
    zIndex: 1,
  },
  heroActions: { display: "flex", gap: "12px", alignItems: "flex-start", flexWrap: "wrap" },
  logo: { color: "#c084fc", letterSpacing: "5px", fontSize: "13px" },
  title: {
    fontSize: "70px",
    margin: "10px 0",
    fontWeight: 900,
    background: "linear-gradient(90deg, #fff, #c084fc, #fff)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundSize: "300px 100%",
    animation: "shimmer 6s linear infinite",
  },
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
  pickGrid: {
    maxWidth: "1200px",
    margin: "25px auto",
    display: "grid",
    gridTemplateColumns: "1.15fr .85fr",
    gap: "18px",
    position: "relative",
    zIndex: 1,
  },
  editorPick: {
    padding: "30px",
    borderRadius: "28px",
    background:
      "linear-gradient(135deg, rgba(126,34,206,.75), rgba(0,0,0,.76)), radial-gradient(circle at top right, rgba(216,180,254,.35), transparent 35%)",
    border: "1px solid #c084fc",
    cursor: "pointer",
    boxShadow: "0 0 55px rgba(168,85,247,.22)",
  },
  pickLabel: { color: "#f5d0fe", letterSpacing: "4px", fontSize: "12px" },
  pickTitle: { fontSize: "38px", margin: "10px 0" },
  pickText: { color: "#f3e8ff", fontSize: "18px", lineHeight: "1.65" },
  pickMeta: { color: "#e9d5ff", fontSize: "14px" },
  storyDay: {
    padding: "26px",
    borderRadius: "26px",
    background: "linear-gradient(135deg, rgba(88,28,135,.55), rgba(0,0,0,.6))",
    border: "1px solid #6b21a8",
    cursor: "pointer",
    animation: "softPulse 4s ease-in-out infinite",
  },
  storyDayLabel: { color: "#d8b4fe", letterSpacing: "4px", fontSize: "12px" },
  storyDayTitle: { fontSize: "32px", margin: "8px 0" },
  storyDayText: { color: "#d4d4d8", fontSize: "17px" },
  confessionBox: {
    maxWidth: "1200px",
    margin: "0 auto 25px",
    padding: "26px",
    borderRadius: "26px",
    background:
      "linear-gradient(135deg, rgba(12,12,12,.92), rgba(30,10,48,.78)), radial-gradient(circle at top left, rgba(168,85,247,.18), transparent 35%)",
    border: "1px solid #3b0764",
    display: "flex",
    justifyContent: "space-between",
    gap: "18px",
    alignItems: "center",
    flexWrap: "wrap",
    position: "relative",
    zIndex: 1,
  },
  confessionTitle: { fontSize: "30px", margin: "8px 0" },
  confessionText: { color: "#d4d4d8", fontSize: "17px", lineHeight: "1.6" },
  confessionButton: {
    background: "#7e22ce",
    color: "white",
    border: "none",
    borderRadius: "14px",
    padding: "13px 18px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  featuredStrip: {
    maxWidth: "1200px",
    margin: "0 auto 25px",
    padding: "22px",
    borderRadius: "24px",
    background: "rgba(10,10,10,.75)",
    border: "1px solid #27272a",
    position: "relative",
    zIndex: 1,
  },
  featuredTitle: { color: "#d8b4fe", fontWeight: "bold", marginBottom: "14px" },
  featuredList: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "14px",
  },
  previewCard: {
    padding: "18px",
    borderRadius: "18px",
    border: "1px solid #3b0764",
    background: "rgba(20,20,20,.9)",
    cursor: "pointer",
  },
  previewTitle: { fontSize: "20px", margin: "10px 0" },
  previewText: { color: "#d4d4d8", lineHeight: "1.55" },
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
    position: "relative",
    zIndex: 1,
  },
  adSmall: { letterSpacing: "4px", fontSize: "11px" },
  adText: { marginTop: "5px" },
  grid: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "1fr 360px",
    gap: "25px",
    position: "relative",
    zIndex: 1,
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
    cursor: "default",
  },
  cardTop: { display: "flex", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" },
  meta: { color: "#8b8b8b", fontSize: "14px" },
  userLabel: {
    display: "inline-flex",
    gap: "6px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  userCode: {
    color: "#c084fc",
    fontSize: "13px",
    letterSpacing: "0.4px",
  },
  badge: {
    background: "#18181b",
    color: "#d4d4d8",
    borderRadius: "999px",
    padding: "7px 12px",
    fontSize: "13px",
    display: "inline-block",
  },
  ownBadge: {
    background: "rgba(34,197,94,.16)",
    color: "#bbf7d0",
    border: "1px solid rgba(34,197,94,.35)",
    borderRadius: "999px",
    padding: "7px 12px",
    fontSize: "13px",
    display: "inline-block",
  },
  featuredBadge: {
    background: "rgba(126,34,206,.35)",
    color: "#f5d0fe",
    border: "1px solid #7e22ce",
    borderRadius: "999px",
    padding: "7px 12px",
    fontSize: "13px",
    display: "inline-block",
  },
  storyTitle: { fontSize: "28px", marginTop: "15px", marginBottom: "10px", cursor: "pointer" },
  storyText: { color: "#d4d4d8", fontSize: "18px", lineHeight: "1.7", whiteSpace: "pre-wrap", cursor: "pointer" },
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
  commentCounter: { color: "#a1a1aa" },
  comment: {
    background: "#0f0f0f",
    border: "1px solid #27272a",
    borderRadius: "14px",
    padding: "12px",
    marginTop: "10px",
    color: "#d4d4d8",
  },
  replyButton: {
    marginTop: "6px",
    background: "transparent",
    color: "#c4b5fd",
    border: "none",
    cursor: "pointer",
    padding: 0,
    fontWeight: "bold",
  },
  replyForm: { display: "flex", gap: "8px", marginTop: "10px", flexWrap: "wrap" },
  commentForm: { display: "flex", gap: "10px", marginTop: "12px" },
  commentInput: {
    flex: 1,
    minWidth: "180px",
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
  cancelButton: {
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #333",
    background: "transparent",
    color: "#aaa",
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
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.76)",
    backdropFilter: "blur(10px)",
    zIndex: 100,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "25px",
  },
  modal: {
    width: "min(860px, 100%)",
    maxHeight: "86vh",
    overflowY: "auto",
    background: "linear-gradient(145deg, rgba(12,12,12,.98), rgba(35,10,55,.96))",
    border: "1px solid #7e22ce",
    borderRadius: "30px",
    padding: "30px",
    boxShadow: "0 0 80px rgba(168,85,247,.28)",
    position: "relative",
  },
  profileModal: {
    width: "min(780px, 100%)",
    maxHeight: "86vh",
    overflowY: "auto",
    background: "linear-gradient(145deg, rgba(12,12,12,.98), rgba(35,10,55,.96))",
    border: "1px solid #7e22ce",
    borderRadius: "30px",
    padding: "30px",
    boxShadow: "0 0 80px rgba(168,85,247,.28)",
    position: "relative",
  },
  notificationPanel: {
    width: "min(640px, 100%)",
    maxHeight: "86vh",
    overflowY: "auto",
    background: "linear-gradient(145deg, rgba(12,12,12,.98), rgba(35,10,55,.96))",
    border: "1px solid #7e22ce",
    borderRadius: "30px",
    padding: "30px",
    boxShadow: "0 0 80px rgba(168,85,247,.28)",
    position: "relative",
  },
  modalClose: {
    position: "absolute",
    top: "18px",
    right: "20px",
    background: "transparent",
    color: "white",
    border: "1px solid #444",
    borderRadius: "999px",
    width: "38px",
    height: "38px",
    cursor: "pointer",
    fontSize: "24px",
  },
  modalTitle: { fontSize: "40px", marginTop: "20px", marginBottom: "16px" },
  modalText: { color: "#e5e5e5", fontSize: "20px", lineHeight: "1.8", whiteSpace: "pre-wrap" },
  profileName: { fontSize: "32px", marginTop: "18px" },
  profileStats: { display: "flex", gap: "12px", margin: "20px 0", flexWrap: "wrap" },
  statMini: {
    minWidth: "140px",
    padding: "16px",
    borderRadius: "18px",
    background: "rgba(10,10,10,.8)",
    border: "1px solid #27272a",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  profileItem: {
    padding: "14px",
    borderRadius: "14px",
    background: "#0f0f0f",
    border: "1px solid #27272a",
    marginBottom: "10px",
    cursor: "pointer",
    color: "#d4d4d8",
  },
  notificationItem: {
    padding: "16px",
    borderRadius: "16px",
    background: "#0f0f0f",
    border: "1px solid #27272a",
    marginBottom: "12px",
    cursor: "pointer",
    color: "#d4d4d8",
  },
  muted: {
    color: "#888",
  },
};
