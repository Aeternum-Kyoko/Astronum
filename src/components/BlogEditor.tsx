"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

interface InitialPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  category: string;
  published: boolean;
}

export default function BlogEditor({ initial }: { initial?: InitialPost }) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [category, setCategory] = useState(initial?.category ?? "General");
  const [coverImage, setCoverImage] = useState(initial?.coverImage ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [StarterKit],
    content: initial?.content ?? "<p></p>",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose prose-invert max-w-none min-h-[300px] focus:outline-none",
      },
    },
  });

  async function save(published: boolean) {
    setError(null);
    if (!title.trim() || !excerpt.trim()) {
      setError("Title and excerpt are required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title,
        excerpt,
        category,
        coverImage,
        content: editor?.getHTML() ?? "<p></p>",
        published,
      };
      const url = initial ? `/api/admin/posts/${initial.id}` : "/api/admin/posts";
      const method = initial ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save post");
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save post");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!initial) return;
    if (!confirm("Delete this post permanently?")) return;
    await fetch(`/api/admin/posts/${initial.id}`, { method: "DELETE" });
    router.push("/admin");
    router.refresh();
  }

  return (
    <div>
      <div className="grid gap-5 rounded-2xl border border-border bg-surface p-6 md:p-8">
        <Field label="Title">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="input" />
        </Field>
        <Field label="Excerpt (shown in listings)">
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
            className="input resize-none"
          />
        </Field>
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Category">
            <input value={category} onChange={(e) => setCategory(e.target.value)} className="input" />
          </Field>
          <Field label="Cover image URL (optional)">
            <input value={coverImage} onChange={(e) => setCoverImage(e.target.value)} className="input" />
          </Field>
        </div>

        <div>
          <span className="mb-1.5 block text-xs font-medium tracking-wide text-muted uppercase">Content</span>
          {editor && <Toolbar editor={editor} />}
          <div className="mt-2 rounded-lg border border-border bg-ink-deep px-4 py-3">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-rose">{error}</p>}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          onClick={() => save(true)}
          disabled={saving}
          className="rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-ink-deep hover:bg-gold-bright disabled:opacity-60"
        >
          {saving ? "Saving…" : "Publish"}
        </button>
        <button
          onClick={() => save(false)}
          disabled={saving}
          className="rounded-full border border-border px-6 py-2.5 text-sm text-cream hover:border-gold disabled:opacity-60"
        >
          Save Draft
        </button>
        {initial && (
          <button
            onClick={handleDelete}
            className="ml-auto rounded-full border border-rose/40 px-6 py-2.5 text-sm text-rose hover:bg-rose/10"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium tracking-wide text-muted uppercase">{label}</span>
      {children}
    </label>
  );
}

function Toolbar({ editor }: { editor: NonNullable<ReturnType<typeof useEditor>> }) {
  const buttons: { label: string; onClick: () => void; active: boolean }[] = [
    { label: "B", onClick: () => editor.chain().focus().toggleBold().run(), active: editor.isActive("bold") },
    { label: "I", onClick: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive("italic") },
    {
      label: "H2",
      onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      active: editor.isActive("heading", { level: 2 }),
    },
    {
      label: "H3",
      onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      active: editor.isActive("heading", { level: 3 }),
    },
    {
      label: "List",
      onClick: () => editor.chain().focus().toggleBulletList().run(),
      active: editor.isActive("bulletList"),
    },
    {
      label: "1. List",
      onClick: () => editor.chain().focus().toggleOrderedList().run(),
      active: editor.isActive("orderedList"),
    },
    {
      label: "Quote",
      onClick: () => editor.chain().focus().toggleBlockquote().run(),
      active: editor.isActive("blockquote"),
    },
  ];

  return (
    <div className="flex flex-wrap gap-1.5">
      {buttons.map((b) => (
        <button
          key={b.label}
          type="button"
          onClick={b.onClick}
          className={`rounded-md border px-2.5 py-1 text-xs ${
            b.active ? "border-gold bg-gold/10 text-gold-bright" : "border-border text-muted hover:text-cream"
          }`}
        >
          {b.label}
        </button>
      ))}
    </div>
  );
}
