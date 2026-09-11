import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Circle, Pencil, Square, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getDomainSnapshot } from "@/lib/domain";
import { getDuesStatus } from "@/lib/dues";
import { Paywall } from "@/components/paywall";
import {
  addTrack,
  deleteTrack,
  getTrackAudio,
  getTracks,
  updateTrack,
  type TrackMeta,
} from "@/lib/life";
import { useResolvedAuth } from "@/lib/use-resolved-auth";
import { formatPlDate } from "@/lib/utils";
import { BEATS, CO_CREATOR, HASLO_A, HASLO_B } from "@/lib/world";
import { playBit } from "@/lib/bit";
import { addSong, getSongs } from "@/lib/choir";

const MAX_MS = 45_000;

export const Route = createFileRoute("/kawalki")({
  loader: () => getTracks(),
  component: KawalkiPage,
});

function KawalkiPage() {
  const initial = Route.useLoaderData();
  const { user, isSignedIn } = useResolvedAuth();
  const list = useQuery({
    queryKey: ["tracks"],
    queryFn: () => getTracks(),
    initialData: initial,
  });
  const domain = useQuery({
    queryKey: ["domain"],
    queryFn: () => getDomainSnapshot(),
  });
  const tracks = list.data?.tracks ?? [];
  const isFounder = Boolean(user) && domain.data?.founder?.userId === user?.id;
  const dues = useQuery({
    queryKey: ["dues"],
    queryFn: () => getDuesStatus(),
    enabled: isSignedIn,
  });
  const canPost = Boolean(dues.data?.paid);

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 pb-20 md:px-10">
        <p className="font-mono text-xs tracking-[0.18em] text-subtle">
          Studio
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight md:text-5xl">
          Kawałki
        </h1>
        <p className="mt-3 max-w-xl text-muted">
          {CO_CREATOR.name}: nagraj do 45 sekund — riff, refren, wrzask, cisza.
          Szafkę trzyma Łukasz Opiłka. Bit na hasło. Zero kazania.
        </p>
        <Button asChild size="sm" variant="outline" className="mt-4">
          <Link to="/slawa">Łukasz w galerii</Link>
        </Button>


        <SoundCabinet canPost={canPost} isSignedIn={isSignedIn} />

        {isSignedIn ? (
          canPost ? (
            <Recorder />
          ) : (
            <Paywall action="nagrywać kawałki" />
          )
        ) : (
          <p className="mt-6 text-sm text-muted">
            <Link to="/login" className="underline underline-offset-4">
              Wejdź
            </Link>
            , żeby nagrać kawałek. Członkostwo: 10 Twoich pieniążków.
          </p>
        )}

        <ul className="mt-12 space-y-4">
          {tracks.length === 0 ? (
            <li className="rounded-xl bg-surface px-4 py-10 text-center text-sm text-subtle shadow-[var(--shadow-border)]">
              Jeszcze cicho.
            </li>
          ) : (
            tracks.map((track) => (
              <TrackRow
                key={track.id}
                track={track}
                canEdit={track.userId === user?.id || isFounder}
              />
            ))
          )}
        </ul>
      </main>
    </div>
  );
}

function SoundCabinet({
  canPost,
  isSignedIn,
}: {
  canPost: boolean;
  isSignedIn: boolean;
}) {
  const [unlocked, setUnlocked] = useState<string | null>(null);
  const [guess, setGuess] = useState("");
  const [haslo, setHaslo] = useState<string | null>(null);
  const [lyrics, setLyrics] = useState("");
  const [bit, setBit] = useState("Płomienie");
  const queryClient = useQueryClient();
  const songs = useQuery({
    queryKey: ["songs"],
    queryFn: () => getSongs(),
  });
  const saveSong = useMutation({
    mutationFn: () => addSong({ data: { lyrics, bit } }),
    onSuccess: () => {
      setLyrics("");
      toast.success("Draft w szafce. Czeka na pierwokup Monitora.");
      void queryClient.invalidateQueries({ queryKey: ["songs"] });
      void queryClient.invalidateQueries({ queryKey: ["preemptions"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function rollHaslo() {
    const a = HASLO_A[Math.floor(Math.random() * HASLO_A.length)];
    const b = HASLO_B[Math.floor(Math.random() * HASLO_B.length)];
    const n = String(Math.floor(10 + Math.random() * 89));
    setHaslo(`${a}-${b}-${n}`);
  }

  function tryUnlock() {
    const beat = BEATS.find(
      (item) => item.password.toLowerCase() === guess.trim().toLowerCase(),
    );
    if (!beat) {
      toast.error("Złe hasło. Bit milczy.");
      return;
    }
    setUnlocked(beat.id);
    playBit(beat.genre);
    toast.success(`${beat.title}. Zero kazania.`);
  }

  return (
    <div className="mt-8 space-y-4">
      <div className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <p className="font-mono text-xs tracking-[0.18em] text-subtle">
          Pokój dźwięku
        </p>
        <p className="mt-2 font-display text-xl tracking-tight">
          Płomienie / duet / las + „Zawsze tam gdzie Ty”
        </p>
        <p className="mt-2 text-sm text-muted">
          Player puszcza bit na hasło. W tym jajco/latko. Kazanie nie wchodzi.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Input
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            placeholder="Hasło do bitu"
            className="min-w-0 flex-1"
          />
          <Button type="button" onClick={tryUnlock}>
            Puść
          </Button>
        </div>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {BEATS.map((beat) => (
            <li key={beat.id} className="text-sm text-muted">
              {beat.title}
              <span className="text-subtle"> · {beat.genre} · hint: {beat.hint}</span>
              {unlocked === beat.id ? (
                <button
                  type="button"
                  className="ml-2 underline underline-offset-4"
                  onClick={() => playBit(beat.genre)}
                >
                  jeszcze raz
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <p className="font-display text-xl tracking-tight">Generator haseł</p>
        <p className="mt-2 text-sm text-muted">Losowe, w klimacie. Do bitu, nie do kazania.</p>
        <Button type="button" size="sm" className="mt-4" onClick={rollHaslo}>
          Losuj hasło
        </Button>
        {haslo ? (
          <p className="mt-3 font-mono text-sm tracking-wide text-fg">{haslo}</p>
        ) : null}
      </div>

      <div className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <p className="font-display text-xl tracking-tight">Kącik freestyle</p>
        <p className="mt-2 text-sm text-muted">
          Beat na hasło. Zero kazania. Gotowy na moment.
        </p>
        <Button
          type="button"
          size="sm"
          className="mt-4"
          onClick={() => playBit("choir")}
        >
          Puść Lady Pank / bit
        </Button>
        <p className="mt-2 text-xs text-subtle">
          Nie płyta. Bit, od którego zbór się zrywa.
        </p>
      </div>

      <div className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <p className="font-display text-xl tracking-tight">Wspólny kawałek</p>
        <p className="mt-2 text-sm text-muted">
          Draft tekstu + bit, zanim coś wyjdzie na świat. Wpada pod pierwokup Monitora.
        </p>
        {isSignedIn && canPost ? (
          <form
            className="mt-4 space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              saveSong.mutate();
            }}
          >
            <Input
              value={bit}
              onChange={(e) => setBit(e.target.value)}
              placeholder="Bit"
            />
            <Input
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              placeholder="Tekst — draft"
            />
            <Button type="submit" size="sm" disabled={saveSong.isPending}>
              Do szafki
            </Button>
          </form>
        ) : null}
        <ul className="mt-4 space-y-2">
          {(songs.data?.songs ?? []).map((song) => (
            <li key={song.id} className="text-sm">
              <span className="text-subtle">{song.authorName} · {song.bit} · {song.status}</span>
              <p className="text-fg">{song.lyrics}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Recorder() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [preview, setPreview] = useState<{ blob: Blob; url: string; ms: number } | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview.url);
      if (timerRef.current) window.clearInterval(timerRef.current);
      recorderRef.current?.stop();
    };
  }, [preview]);

  async function start() {
    if (preview) {
      URL.revokeObjectURL(preview.url);
      setPreview(null);
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const apple = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const mime = apple && MediaRecorder.isTypeSupported("audio/mp4")
      ? "audio/mp4"
      : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "";
    const recorder = mime
      ? new MediaRecorder(stream, { mimeType: mime })
      : new MediaRecorder(stream);
    chunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
      const ms = Date.now() - startedRef.current;
      setPreview({ blob, url: URL.createObjectURL(blob), ms });
      setRecording(false);
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
    recorderRef.current = recorder;
    startedRef.current = Date.now();
    setElapsed(0);
    setRecording(true);
    recorder.start();
    timerRef.current = window.setInterval(() => {
      const ms = Date.now() - startedRef.current;
      setElapsed(ms);
      if (ms >= MAX_MS) recorder.stop();
    }, 200);
  }

  function stop() {
    recorderRef.current?.stop();
  }

  const save = useMutation({
    mutationFn: async () => {
      if (!preview) throw new Error("Najpierw nagraj.");
      const audioB64 = await blobToBase64(preview.blob);
      return addTrack({
        data: {
          title,
          mime: preview.blob.type || "audio/webm",
          durationMs: preview.ms,
          audioB64,
        },
      });
    },
    onSuccess: () => {
      if (preview) URL.revokeObjectURL(preview.url);
      setPreview(null);
      setTitle("");
      toast.success("Kawałek w studio.");
      void queryClient.invalidateQueries({ queryKey: ["tracks"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="mt-8 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Tytuł kawałka"
      />
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {recording ? (
          <Button type="button" variant="danger" onClick={stop}>
            <Square className="size-4" />
            Stop
          </Button>
        ) : (
          <Button type="button" onClick={() => void start().catch((err: Error) => toast.error(err.message || "Brak mikrofonu."))}>
            <Circle className="size-4 fill-current" />
            Nagraj
          </Button>
        )}
        <span className="font-mono text-sm tabular-nums text-muted">
          {formatMs(recording ? elapsed : preview?.ms ?? 0)} / 0:45
        </span>
      </div>
      {preview ? (
        <div className="mt-4 space-y-3">
          <audio controls playsInline src={preview.url} className="w-full" />
          <div className="flex justify-end">
            <Button
              type="button"
              disabled={save.isPending}
              onClick={() => save.mutate()}
            >
              Wstaw do świata
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TrackRow({
  track,
  canEdit,
}: {
  track: TrackMeta;
  canEdit: boolean;
}) {
  const queryClient = useQueryClient();
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(track.title);

  async function load() {
    if (src) return;
    setLoading(true);
    try {
      const audio = await getTrackAudio({ data: { id: track.id } });
      setSrc(`data:${audio.mime};base64,${audio.audioB64}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nie da się odtworzyć.");
    } finally {
      setLoading(false);
    }
  }

  const remove = useMutation({
    mutationFn: () => deleteTrack({ data: { id: track.id } }),
    onSuccess: () => {
      toast.success("Kawałek zdjęty.");
      void queryClient.invalidateQueries({ queryKey: ["tracks"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const save = useMutation({
    mutationFn: () => updateTrack({ data: { id: track.id, title } }),
    onSuccess: () => {
      toast.success("Wpis poprawiony.");
      setEditing(false);
      void queryClient.invalidateQueries({ queryKey: ["tracks"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <li className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
      {editing ? (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
              Anuluj
            </Button>
            <Button type="submit" size="sm" disabled={save.isPending}>
              Zapisz
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl tracking-tight">{track.title}</h2>
            <p className="mt-1 text-xs text-subtle">
              {track.authorName} · {formatMs(track.durationMs)}
              {track.createdAt ? ` · ${formatPlDate(track.createdAt)}` : ""}
              {track.updatedAt ? " · poprawione" : ""}
            </p>
          </div>
          {canEdit ? (
            <div className="flex shrink-0">
              <button
                type="button"
                className="grid size-11 place-items-center text-muted hover:text-fg"
                onClick={() => {
                  setTitle(track.title);
                  setEditing(true);
                }}
                aria-label="Popraw tytuł"
              >
                <Pencil className="size-4" />
              </button>
              <button
                type="button"
                className="grid size-11 place-items-center text-muted hover:text-danger"
                onClick={() => remove.mutate()}
                aria-label="Usuń kawałek"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ) : null}
        </div>
      )}
      {src ? (
        <audio controls playsInline src={src} className="mt-3 w-full" />
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          disabled={loading}
          onClick={() => void load()}
        >
          {loading ? "Ładuję…" : "Odtwórz"}
        </Button>
      )}
    </li>
  );
}

function formatMs(ms: number) {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Nie udało się zapisać nagrania."));
    reader.onload = () => {
      const result = String(reader.result || "");
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.readAsDataURL(blob);
  });
}
