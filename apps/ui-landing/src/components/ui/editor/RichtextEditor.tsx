"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Toolbar from "./Toolbar";

interface Props {
  value?: any;
  onChange?: (content: any) => void;
  placeholder?: string;
  className?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  className,
}: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Subscript,
      Superscript,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline cursor-pointer",
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || "Write something...",
      }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: "prose max-w-none min-h-[200px] p-4 focus:outline-none",
      },
    },
    onUpdate({ editor }) {
      onChange?.(editor.getHTML());
    },
  });

  if (!editor) return null;

  return (
    <div
      className={`border rounded-lg bg-white overflow-hidden flex flex-col w-full ${className || ""}`}
    >
      <Toolbar editor={editor} />
      <div
        className="flex-1 overflow-y-auto cursor-text"
        onClick={() => editor.chain().focus().run()}
      >
        <EditorContent editor={editor} className="min-h-[200px]" />
      </div>
    </div>
  );
}
