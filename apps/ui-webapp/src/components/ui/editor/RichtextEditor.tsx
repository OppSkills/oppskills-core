"use client";

import { useEffect, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Toolbar from "./Toolbar";
import { cn } from "@/lib/utils";
import { getPlainTextLengthFromHtml } from "@/lib/community/textUtils";

interface Props {
  value?: any;
  onChange?: (content: any) => void;
  placeholder?: string;
  className?: string;
  /** Max plain-text characters (HTML tags excluded). */
  maxLength?: number;
  /** Fixed height with internal scroll instead of growing with content. */
  scrollable?: boolean;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  className,
  maxLength,
  scrollable = false,
}: Props) {
  const [characterCount, setCharacterCount] = useState(0);

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
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          class: "text-primary-500 underline cursor-pointer",
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || "Write something...",
      }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: cn(
          "prose max-w-none p-4 focus:outline-none",
          scrollable ? "min-h-0" : "min-h-[200px]",
        ),
      },
    },
    onUpdate({ editor }) {
      const html = editor.getHTML();
      const textLength = getPlainTextLengthFromHtml(html);
      if (maxLength && textLength > maxLength) {
        editor.commands.undo();
        return;
      }
      setCharacterCount(textLength);
      onChange?.(html);
    },
  });

  useEffect(() => {
    if (!editor) return;
    const next = value || "";
    if (editor.getHTML() !== next) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
    setCharacterCount(getPlainTextLengthFromHtml(next));
  }, [editor, value]);

  if (!editor) return null;

  return (
    <div
      className={cn(
        "border rounded-lg bg-background overflow-hidden flex flex-col w-full focus-within:border-primary-400",
        scrollable ? "h-[240px]" : "max-h-[600px]",
        className,
      )}
    >
      <Toolbar editor={editor} />
      <div
        className="flex-1 min-h-0 overflow-y-auto cursor-text scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
        onClick={() => editor.chain().focus().run()}
      >
        <EditorContent
          editor={editor}
          className={scrollable ? "min-h-0" : "min-h-[200px]"}
        />
      </div>
      {maxLength != null ? (
        <div className="shrink-0 px-4 py-2 border-t text-xs text-neutral-500 text-right">
          {characterCount}/{maxLength}
        </div>
      ) : null}
    </div>
  );
}
