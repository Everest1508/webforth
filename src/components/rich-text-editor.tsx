"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { useEffect } from "react";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  className?: string;
};

function Toolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;
  return (
    <div className="flex flex-wrap gap-1 border-b border-zinc-200 bg-zinc-50 p-1">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`rounded px-2 py-1 text-sm font-medium ${editor.isActive("bold") ? "bg-zinc-300" : "hover:bg-zinc-200"}`}
        title="Bold"
      >
        B
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`rounded px-2 py-1 text-sm italic ${editor.isActive("italic") ? "bg-zinc-300" : "hover:bg-zinc-200"}`}
        title="Italic"
      >
        I
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`rounded px-2 py-1 text-sm line-through ${editor.isActive("strike") ? "bg-zinc-300" : "hover:bg-zinc-200"}`}
        title="Strikethrough"
      >
        S
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`rounded px-2 py-1 text-sm ${editor.isActive("bulletList") ? "bg-zinc-300" : "hover:bg-zinc-200"}`}
        title="Bullet list"
      >
        •
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`rounded px-2 py-1 text-sm ${editor.isActive("orderedList") ? "bg-zinc-300" : "hover:bg-zinc-200"}`}
        title="Numbered list"
      >
        1.
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`rounded px-2 py-1 text-sm ${editor.isActive("heading", { level: 2 }) ? "bg-zinc-300" : "hover:bg-zinc-200"}`}
        title="Heading 2"
      >
        H2
      </button>
      <button
        type="button"
        onClick={() => {
          const url = window.prompt("Link URL:");
          if (url) editor.chain().focus().setLink({ href: url }).run();
        }}
        className={`rounded px-2 py-1 text-sm ${editor.isActive("link") ? "bg-zinc-300" : "hover:bg-zinc-200"}`}
        title="Link"
      >
        Link
      </button>
    </div>
  );
}

export function RichTextEditor({ value, onChange, placeholder = "Write something…", minHeight = "120px", className = "" }: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none p-3 focus:outline-none min-h-[100px]",
        "data-placeholder": placeholder,
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [value, editor]);

  return (
    <div className={`overflow-hidden rounded border border-zinc-300 bg-white [&_.ProseMirror]:min-h-[100px] [&_.ProseMirror_a]:text-blue-600 [&_.ProseMirror_a]:underline ${className}`} style={{ minHeight }}>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
