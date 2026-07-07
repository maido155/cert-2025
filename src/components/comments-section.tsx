"use client";

import { MessageCircle, Send, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Comment } from "@/lib/types";
import { relativeTime } from "@/lib/format";

type Props = {
  videoId: string;
  editorName: string;
  requireEditor: (run: () => void) => void;
  onChanged?: () => void;
};

export default function CommentsSection({ videoId, editorName, requireEditor, onChanged }: Props) {
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const activeVideo = useRef(videoId);
  activeVideo.current = videoId;

  async function load() {
    try {
      const res = await fetch(`/api/comments?videoId=${encodeURIComponent(videoId)}`, { cache: "no-store" });
      const data = (await res.json()) as { comments?: Comment[] };
      if (activeVideo.current === videoId) setComments(data.comments ?? []);
    } catch {
      setComments([]);
    }
  }

  useEffect(() => {
    setComments(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  function submit() {
    const body = text.trim();
    if (!body) return;
    requireEditor(async () => {
      setSending(true);
      try {
        const res = await fetch("/api/comments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId, body, author: editorName }),
        });
        const data = (await res.json()) as { comment?: Comment };
        if (data.comment) {
          setComments((current) => [...(current ?? []), data.comment as Comment]);
          setText("");
          onChanged?.();
        }
      } finally {
        setSending(false);
      }
    });
  }

  async function remove(id: number) {
    setComments((current) => (current ?? []).filter((comment) => comment.id !== id));
    await fetch("/api/comments", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, author: editorName }),
    }).catch(() => {});
    onChanged?.();
  }

  const count = comments?.length ?? 0;

  return (
    <div className="comments">
      <p className="commentsTitle">
        <MessageCircle size={15} /> Comentarios {count > 0 ? <span>{count}</span> : null}
      </p>

      {comments === null ? (
        <p className="commentsEmpty">Cargando…</p>
      ) : comments.length === 0 ? (
        <p className="commentsEmpty">Sé el primero en dejar una nota sobre esta práctica.</p>
      ) : (
        <ul className="commentsList">
          {comments.map((comment) => (
            <li key={comment.id}>
              <div className="commentHead">
                <span className="commentAuthor">{comment.author}</span>
                <span className="commentTime">{relativeTime(comment.createdAt)}</span>
                {editorName && comment.author === editorName ? (
                  <button className="commentDelete" onClick={() => remove(comment.id)} type="button" aria-label="Borrar comentario">
                    <Trash2 size={13} />
                  </button>
                ) : null}
              </div>
              <p className="commentBody">{comment.body}</p>
            </li>
          ))}
        </ul>
      )}

      <div className="commentForm">
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) submit();
          }}
          placeholder="Escribe un comentario…"
          rows={2}
          aria-label="Nuevo comentario"
        />
        <button className="primaryButton" onClick={submit} type="button" disabled={sending || !text.trim()}>
          <Send size={15} /> <span>Comentar</span>
        </button>
      </div>
    </div>
  );
}
