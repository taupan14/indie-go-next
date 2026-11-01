"use client";
import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  toggleVote,
  toggleDislike,
  rateThread,
  recordShare,
} from "@/app/thread/[id]/actions";

const EMOJI = ["😡", "😕", "😐", "😊", "🤩"];
type Labels = {
  like: string;
  dislike: string;
  share: string;
  copy: string;
  copied: string;
  more: string;
  rates: string[];
  signIn: string;
  noRating: string;
  error: string;
};
type Props = {
  threadId: string;
  title: string;
  likes: number;
  dislikes: number;
  avg: number | null;
  count: number;
  liked: boolean;
  disliked: boolean;
  myScore: number | null;
  signedIn: boolean;
  locale: "id" | "en";
  labels: Labels;
};

/** Bar interaksi di akhir thread: suka, tidak suka, rating emoji 5 tingkat, bagikan.
 *  Suka, tidak suka, dan rating berdiri sendiri-sendiri (tidak saling mengunci), dengan tampilan langsung (optimistis)
 *  dan pesan galat yang terlihat bila penyimpanan gagal. */
export default function ThreadActions(p: Props) {
  const L = p.labels;
  const [menu, setMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [liked, setLiked] = useState(p.liked);
  const [disliked, setDisliked] = useState(p.disliked);
  const [score, setScore] = useState(p.myScore);
  useEffect(() => {
    setLiked(p.liked);
    setDisliked(p.disliked);
    setScore(p.myScore);
  }, [p.liked, p.disliked, p.myScore]);

  const likes = p.likes + (liked === p.liked ? 0 : liked ? 1 : -1);
  const dislikes =
    p.dislikes + (disliked === p.disliked ? 0 : disliked ? 1 : -1);

  const run = (call: () => Promise<{ error?: string }>, revert: () => void) => {
    setErr(null);
    start(async () => {
      try {
        const r = await call();
        if (r?.error) {
          revert();
          setErr(r.error);
        }
      } catch {
        revert();
        setErr("failed");
      }
    });
  };
  const onLike = () => {
    const [l, d] = [liked, disliked];
    setLiked(!l);
    if (!l) setDisliked(false);
    run(
      () => toggleVote(p.threadId),
      () => {
        setLiked(l);
        setDisliked(d);
      },
    );
  };
  const onDislike = () => {
    const [l, d] = [liked, disliked];
    setDisliked(!d);
    if (!d) setLiked(false);
    run(
      () => toggleDislike(p.threadId),
      () => {
        setLiked(l);
        setDisliked(d);
      },
    );
  };
  const onRate = (s: number) => {
    const prev = score;
    setScore(prev === s ? null : s);
    run(
      () => rateThread(p.threadId, s),
      () => setScore(prev),
    );
  };

  const btn = (on: boolean) =>
    `inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors ${on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface hover:bg-accent"}`;
  const react = (
    on: boolean,
    onClick: () => void,
    icon: string,
    n: number,
    label: string,
  ) =>
    p.signedIn ? (
      <button
        type="button"
        onClick={onClick}
        className={btn(on)}
        aria-pressed={on}
        aria-label={label}
        title={label}
      >
        {icon} {n}
      </button>
    ) : (
      <Link
        href="/masuk"
        className={btn(false)}
        title={L.signIn}
        aria-label={`${label}: ${L.signIn}`}
      >
        {icon} {n}
      </Link>
    );

  const track = () => {
    if (p.signedIn) void recordShare(p.threadId);
  }; // hanya share akun login yang dihitung
  const enc = encodeURIComponent;
  const open = (href: string) => {
    track();
    window.open(href, "_blank", "noopener,noreferrer");
    setMenu(false);
  };
  const copy = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
    track();
  };
  const item =
    "block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-accent";

  return (
    <div className="relative flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-3">
      <div className="flex items-center gap-2">
        {react(liked, onLike, "👍", likes, L.like)}
        {react(disliked, onDislike, "👎", dislikes, L.dislike)}
      </div>

      <div
        className="flex items-center gap-0.5"
        role="group"
        aria-label="Rating"
      >
        {EMOJI.map((e, i) => {
          const s = i + 1,
            on = score === s;
          const face = (
            <span
              className={`inline-block text-xl leading-none transition-transform duration-200 motion-reduce:transition-none ${on ? "scale-125" : "opacity-50 hover:scale-110 hover:opacity-100"}`}
            >
              {e}
            </span>
          );
          return p.signedIn ? (
            <button
              key={s}
              type="button"
              onClick={() => onRate(s)}
              className="rounded p-1"
              aria-pressed={on}
              aria-label={L.rates[i]}
              title={L.rates[i]}
            >
              {face}
            </button>
          ) : (
            <Link
              key={s}
              href="/masuk"
              className="rounded p-1"
              title={L.signIn}
              aria-label={`${L.rates[i]}: ${L.signIn}`}
            >
              {face}
            </Link>
          );
        })}
        <span className="ml-1.5 text-xs text-muted">
          {p.avg
            ? `${p.avg.toFixed(1).replace(".", p.locale === "id" ? "," : ".")} (${p.count})`
            : L.noRating}
        </span>
      </div>

      <div>
        <button
          type="button"
          aria-expanded={menu}
          onClick={() => setMenu(!menu)}
          className={btn(false)}
        >
          ↗ {L.share}
        </button>
        {menu && (
          <>
            <button
              type="button"
              aria-hidden
              tabIndex={-1}
              className="fixed inset-0 z-10 cursor-default"
              onClick={() => setMenu(false)}
            />
            <div className="absolute bottom-full right-3 z-20 mb-2 w-52 rounded-xl border border-border bg-surface p-1 shadow-lg">
              <button className={item} onClick={copy}>
                {copied ? `✓ ${L.copied}` : L.copy}
              </button>
              <button
                className={item}
                onClick={() =>
                  open(
                    `https://wa.me/?text=${enc(`${p.title} ${window.location.href}`)}`,
                  )
                }
              >
                WhatsApp
              </button>
              <button
                className={item}
                onClick={() =>
                  open(
                    `https://t.me/share/url?url=${enc(window.location.href)}&text=${enc(p.title)}`,
                  )
                }
              >
                Telegram
              </button>
              <button
                className={item}
                onClick={() =>
                  open(
                    `https://www.facebook.com/sharer/sharer.php?u=${enc(window.location.href)}`,
                  )
                }
              >
                Facebook
              </button>
              {"share" in navigator && (
                <button
                  className={item}
                  onClick={async () => {
                    track();
                    setMenu(false);
                    try {
                      await navigator.share({
                        title: p.title,
                        url: window.location.href,
                      });
                    } catch {}
                  }}
                >
                  {L.more}
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {err && (
        <p role="alert" className="w-full text-xs text-danger">
          {L.error}
          {err !== "failed" && err !== "invalid" ? ` (${err})` : ""}
        </p>
      )}
    </div>
  );
}
