"use client";

import { Loader2Icon, Trash2Icon } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Markdown } from "@/components/markdown";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/user-avatar";
import { friendlyError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/client";
import type { Comment } from "@/lib/types";
import { useWorkspace } from "./workspace-provider";

const dateFormat = new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" });

function byDate(a: Comment, b: Comment) {
  return a.created_at.localeCompare(b.created_at);
}

export function IssueComments({ issueId }: { issueId: string }) {
  const { members, currentUserId, isAdmin } = useWorkspace();
  const [supabase] = useState(() => createClient());
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [contenido, setContenido] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("issue_id", issueId)
      .order("created_at");
    setLoadError(Boolean(error));
    if (data) setComments(data);
  }, [supabase, issueId]);

  useEffect(() => {
    let ignore = false;
    supabase
      .from("comments")
      .select("*")
      .eq("issue_id", issueId)
      .order("created_at")
      .then(({ data, error }) => {
        if (ignore) return;
        setLoadError(Boolean(error));
        if (data) setComments(data);
      });
    return () => {
      ignore = true;
    };
  }, [supabase, issueId]);

  // Comentarios de otros usuarios en esta tarea.
  useEffect(() => {
    const channel = supabase
      .channel(`comments:${issueId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "comments", filter: `issue_id=eq.${issueId}` },
        ({ new: row }) => {
          const comment = row as Comment;
          setComments((current) =>
            current?.some((item) => item.id === comment.id)
              ? current
              : [...(current ?? []), comment].sort(byDate),
          );
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "comments", filter: `issue_id=eq.${issueId}` },
        ({ new: row }) => {
          const comment = row as Comment;
          setComments(
            (current) => current?.map((item) => (item.id === comment.id ? comment : item)) ?? null,
          );
        },
      )
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "comments" }, ({ old }) => {
        setComments((current) => current?.filter((item) => item.id !== old.id) ?? null);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, issueId]);

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    const text = contenido.trim();
    if (!text || saving) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("comments")
      .insert({ issue_id: issueId, contenido: text, autor_id: currentUserId })
      .select("*")
      .single();
    setSaving(false);
    if (error) {
      toast.error(friendlyError(error, "No se ha podido publicar el comentario."));
      return;
    }
    setContenido("");
    setComments((current) =>
      current?.some((comment) => comment.id === data.id)
        ? current
        : [...(current ?? []), data].sort(byDate),
    );
  }

  async function remove(id: string) {
    if (!window.confirm("¿Eliminar este comentario?")) return;
    const { error } = await supabase.from("comments").delete().eq("id", id);
    if (error) {
      toast.error(friendlyError(error, "No se ha podido eliminar el comentario."));
      return;
    }
    setComments((current) => current?.filter((comment) => comment.id !== id) ?? null);
  }

  return (
    <section className="flex flex-col gap-3" aria-label="Comentarios">
      <h3 className="text-sm font-medium">
        Comentarios{comments && comments.length > 0 ? ` (${comments.length})` : ""}
      </h3>

      {loadError && (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between gap-2">
            No se han podido cargar los comentarios.
            <Button size="sm" variant="outline" onClick={load}>
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {!comments && !loadError && <Skeleton className="h-16 w-full" />}

      {comments?.length === 0 && (
        <p className="text-sm text-muted-foreground">Todavía no hay comentarios.</p>
      )}

      {comments && comments.length > 0 && (
        <ul className="flex flex-col gap-4">
          {comments.map((comment) => {
            const author = members.find((member) => member.user_id === comment.autor_id);
            const nombre = author?.nombre ?? "Antiguo miembro";
            return (
              <li key={comment.id} className="flex gap-3">
                <UserAvatar nombre={nombre} avatarUrl={author?.avatar_url} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{nombre}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {dateFormat.format(new Date(comment.created_at))}
                    </span>
                    {(comment.autor_id === currentUserId || isAdmin) && (
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        className="ml-auto"
                        aria-label="Eliminar comentario"
                        title="Eliminar comentario"
                        onClick={() => remove(comment.id)}
                      >
                        <Trash2Icon />
                      </Button>
                    )}
                  </div>
                  <Markdown>{comment.contenido}</Markdown>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <form onSubmit={submit} className="flex flex-col gap-2">
        <Label htmlFor="comment-contenido" className="sr-only">
          Añadir comentario
        </Label>
        <Textarea
          id="comment-contenido"
          rows={3}
          placeholder="Escribe un comentario (admite markdown)"
          value={contenido}
          onChange={(event) => setContenido(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) submit();
          }}
        />
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={saving || !contenido.trim()}>
            {saving && <Loader2Icon className="animate-spin" aria-hidden />}
            Comentar
          </Button>
        </div>
      </form>
    </section>
  );
}
