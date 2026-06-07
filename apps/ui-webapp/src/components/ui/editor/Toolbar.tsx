"use client";

import React, { useState, useEffect } from "react";
import { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Superscript,
  Subscript,
  Undo,
  Redo,
  Heading1,
  Heading2,
  Quote,
  Link as LinkIcon,
  Check,
  X,
} from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "../popover";
import { Button } from "../button";
import { Input } from "../input";
import { Label } from "../label";

interface LinkPopoverProps {
  editor: Editor;
  btnClass: (active: boolean) => string;
}

const LinkPopover: React.FC<LinkPopoverProps> = ({ editor, btnClass }) => {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");

  const updateState = () => {
    const currentLink = editor.getAttributes("link").href;
    setUrl(currentLink || "");
  };

  useEffect(() => {
    if (open) {
      updateState();
    }
  }, [open, editor.state.selection]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!url) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      setOpen(false);
      return;
    }

    if (editor.state.selection.empty) {
      // No text selected: Insert URL as text
      editor
        .chain()
        .focus()
        .insertContent({
          type: "text",
          text: url,
          marks: [
            {
              type: "link",
              attrs: { href: url },
            },
          ],
        })
        .run();

      // Separate chain to ensure the link renders before we unset it for the next char
      editor.chain().unsetLink().run();
      editor.chain().focus().insertContent({ type: "text", text: " " }).run();
    } else {
      // Text selected: Link it
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url })
        .setTextSelection(editor.state.selection.to) // Collapse to end
        .run();

      // Separate chain to ensure the link renders before we unset it for the next char
      editor.chain().unsetLink().run();
    }

    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className={btnClass(editor.isActive("link"))} title="Link">
          <LinkIcon className="w-4 h-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="link-url">URL</Label>
            <Input
              id="link-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Insert
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
};

export default function Toolbar({ editor }: { editor: Editor }) {
  if (!editor) return null;

  // Force re-render when editor state changes (selection, transaction, etc.)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  React.useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      forceUpdate();
    };

    editor.on("transaction", handleUpdate);
    editor.on("selectionUpdate", handleUpdate);
    editor.on("update", handleUpdate);

    return () => {
      editor.off("transaction", handleUpdate);
      editor.off("selectionUpdate", handleUpdate);
      editor.off("update", handleUpdate);
    };
  }, [editor]);

  const btnClass = (active: boolean) =>
    `p-2 rounded hover:bg-gray-100 transition-colors ${
      active ? "bg-gray-200 text-foreground" : "text-gray-600"
    }`;

  return (
    <div className="flex flex-nowrap items-center gap-1 border-b p-2 bg-gray-50/50 overflow-x-auto scrollbar-none">
      {/* History */}
      <div className="flex items-center gap-0.5 border-r pr-2 mr-1">
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 text-gray-600"
          title="Undo"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 text-gray-600"
          title="Redo"
        >
          <Redo className="w-4 h-4" />
        </button>
      </div>

      {/* Text Formatting */}
      <div className="flex items-center gap-0.5 border-r pr-2 mr-1">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={btnClass(editor.isActive("bold"))}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={btnClass(editor.isActive("italic"))}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={btnClass(editor.isActive("underline"))}
          title="Underline"
        >
          <Underline className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={btnClass(editor.isActive("strike"))}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleSubscript().run()}
          className={btnClass(editor.isActive("subscript"))}
          title="Subscript"
        >
          <Subscript className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
          className={btnClass(editor.isActive("superscript"))}
          title="Superscript"
        >
          <Superscript className="w-4 h-4" />
        </button>

        <LinkPopover editor={editor} btnClass={btnClass} />
      </div>

      {/* Headings */}
      <div className="flex items-center gap-0.5 border-r pr-2 mr-1">
        <button
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          className={btnClass(editor.isActive("heading", { level: 1 }))}
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          className={btnClass(editor.isActive("heading", { level: 2 }))}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>
      </div>

      {/* Lists & Alignment */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={btnClass(editor.isActive({ textAlign: "left" }))}
          title="Align Left"
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className={btnClass(editor.isActive({ textAlign: "center" }))}
          title="Align Center"
        >
          <AlignCenter className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className={btnClass(editor.isActive({ textAlign: "right" }))}
          title="Align Right"
        >
          <AlignRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          className={btnClass(editor.isActive({ textAlign: "justify" }))}
          title="Justify"
        >
          <AlignJustify className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={btnClass(editor.isActive("bulletList"))}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={btnClass(editor.isActive("orderedList"))}
          title="Ordered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={btnClass(editor.isActive("blockquote"))}
          title="Blockquote"
        >
          <Quote className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
