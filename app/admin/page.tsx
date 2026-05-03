"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { supabase } from "../lib/supabase";

const ADMIN_PASSWORD = "Perhakstorymask746875";

type Story = {
  id: number;
  nickname: string;
  category: string;
  title: string;
  text: string;
  created_at: string;
};

type Comment = {
  id: number;
  story_id: number;
  nickname: string;
  text: string;
  created_at: string;
};

type Report = {
  id: number;
  story_id: number;
  reason: string;
  status: string;
  created_at: string;
};

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [stories, setStories] = useState<Story[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("storymask_admin") === "true") {
      setUnlocked(true);
      loadAdminData();
    }
  }, []);

  function login() {
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem("storymask_admin", "true");
      setUnlocked(true);
      loadAdminData();
    } else {
      alert("Wrong password");
    }
  }

  async function loadAdminData() {
    setLoading(true);

    const { data: storyData } = await supabase
      .from("stories")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: commentData } = await supabase
      .from("comments")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: reportData } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });

    setStories((storyData as Story[]) || []);
    setComments((commentData as Comment[]) || []);
    setReports((reportData as Report[]) || []);
    setLoading(false);
  }

  async function deleteStory(id: number) {
    if (!confirm("Delete this story?")) return;

    const { error } = await supabase.from("stories").delete().eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadAdminData();
  }

  async function deleteComment(id: number) {
    if (!confirm("Delete this comment?")) return;

    const { error } = await supabase.from("comments").delete().eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadAdminData();
  }

  async function closeReport(id: number) {
    const { error } = await supabase
      .from("reports")
      .update({ status: "closed" })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadAdminData();
  }

  if (!unlocked) {
    return (
      <main style={styles.page}>
        <div style={styles.loginBox}>
          <p style={styles.logo}>STORYMASK ADMIN</p>
          <h1 style={styles.title}>Enter the shadow room</h1>

          <input
            type="password"
            placeholder="Admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />

          <button onClick={login} style={styles.button}>
            Unlock admin panel
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <section style={styles.header}>
        <div>
          <p style={styles.logo}>STORYMASK ADMIN</p>
          <h1 style={styles.title}>Control Room</h1>
          <p style={styles.sub}>Reports, stories and comments moderation.</p>
        </div>

        <button onClick={loadAdminData} style={styles.button}>
          Refresh
        </button>
      </section>

      {loading && <div style={styles.notice}>Loading...</div>}

      <section style={styles.statsGrid}>
        <div style={styles.statCard}>
          <p>Stories</p>
          <b>{stories.length}</b>
        </div>
        <div style={styles.statCard}>
          <p>Comments</p>
          <b>{comments.length}</b>
        </div>
        <div style={styles.statCard}>
          <p>Open reports</p>
          <b>{reports.filter((r) => r.status === "open").length}</b>
        </div>
      </section>

      <section style={styles.grid}>
        <div style={styles.panel}>
          <h2>🚨 Reports</h2>

          {reports.length === 0 && <p style={styles.muted}>No reports yet.</p>}

          {reports.map((report) => (
            <div key={report.id} style={styles.item}>
              <p style={styles.meta}>Story ID: {report.story_id}</p>
              <p>{report.reason}</p>
              <p style={styles.meta}>Status: {report.status}</p>

              <button onClick={() => closeReport(report.id)} style={styles.smallButton}>
                Mark closed
              </button>
            </div>
          ))}
        </div>

        <div style={styles.panel}>
          <h2>💬 Comments</h2>

          {comments.map((comment) => (
            <div key={comment.id} style={styles.item}>
              <p style={styles.meta}>Story ID: {comment.story_id}</p>
              <b>@{comment.nickname}</b>
              <p>{comment.text}</p>

              <button onClick={() => deleteComment(comment.id)} style={styles.deleteButton}>
                Delete comment
              </button>
            </div>
          ))}
        </div>
      </section>

      <section style={styles.panel}>
        <h2>📖 Stories</h2>

        {stories.map((story) => (
          <div key={story.id} style={styles.storyItem}>
            <div>
              <p style={styles.meta}>
                #{story.id} · @{story.nickname} · {story.category}
              </p>
              <h3>{story.title}</h3>
              <p style={styles.storyText}>{story.text}</p>
            </div>

            <button onClick={() => deleteStory(story.id)} style={styles.deleteButton}>
              Delete story
            </button>
          </div>
        ))}
      </section>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top left, #3b0764, transparent 35%), radial-gradient(circle at bottom right, #172554, transparent 35%), #030303",
    color: "white",
    padding: "35px",
    fontFamily: "Arial, sans-serif",
  },
  loginBox: {
    maxWidth: "520px",
    margin: "120px auto",
    padding: "35px",
    borderRadius: "30px",
    border: "1px solid #581c87",
    background: "rgba(0,0,0,.72)",
    boxShadow: "0 0 60px rgba(168,85,247,.25)",
  },
  header: {
    maxWidth: "1200px",
    margin: "0 auto 25px",
    padding: "30px",
    borderRadius: "30px",
    border: "1px solid #27272a",
    background: "rgba(0,0,0,.65)",
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    flexWrap: "wrap",
  },
  logo: {
    color: "#c084fc",
    letterSpacing: "5px",
    fontSize: "13px",
  },
  title: {
    fontSize: "52px",
    margin: "10px 0",
    fontWeight: 900,
  },
  sub: {
    color: "#aaa",
  },
  input: {
    width: "100%",
    padding: "15px",
    borderRadius: "14px",
    border: "1px solid #333",
    background: "#080808",
    color: "white",
    fontSize: "16px",
    marginBottom: "14px",
  },
  button: {
    background: "#7e22ce",
    color: "white",
    border: "none",
    borderRadius: "14px",
    padding: "14px 18px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  smallButton: {
    background: "#27272a",
    color: "white",
    border: "none",
    borderRadius: "12px",
    padding: "10px 12px",
    cursor: "pointer",
    marginTop: "10px",
  },
  deleteButton: {
    background: "transparent",
    color: "#fca5a5",
    border: "1px solid #7f1d1d",
    borderRadius: "12px",
    padding: "10px 12px",
    cursor: "pointer",
    height: "fit-content",
  },
  notice: {
    maxWidth: "1200px",
    margin: "0 auto 20px",
    padding: "18px",
    borderRadius: "18px",
    background: "#111",
    color: "#aaa",
  },
  statsGrid: {
    maxWidth: "1200px",
    margin: "0 auto 25px",
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "15px",
  },
  statCard: {
    padding: "22px",
    borderRadius: "22px",
    background: "rgba(10,10,10,.82)",
    border: "1px solid #27272a",
  },
  grid: {
    maxWidth: "1200px",
    margin: "0 auto 25px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "25px",
  },
  panel: {
    maxWidth: "1200px",
    margin: "0 auto 25px",
    padding: "25px",
    borderRadius: "26px",
    background: "rgba(10,10,10,.86)",
    border: "1px solid #27272a",
  },
  item: {
    padding: "18px",
    borderRadius: "18px",
    background: "#0f0f0f",
    border: "1px solid #27272a",
    marginBottom: "14px",
  },
  storyItem: {
    padding: "20px",
    borderRadius: "20px",
    background: "#0f0f0f",
    border: "1px solid #27272a",
    marginBottom: "14px",
    display: "flex",
    justifyContent: "space-between",
    gap: "18px",
  },
  meta: {
    color: "#8b8b8b",
    fontSize: "14px",
  },
  storyText: {
    color: "#d4d4d8",
    lineHeight: "1.6",
    whiteSpace: "pre-wrap",
  },
  muted: {
    color: "#888",
  },
};