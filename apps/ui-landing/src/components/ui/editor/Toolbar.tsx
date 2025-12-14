"use client"

import { Editor } from "@tiptap/react"

export default function Toolbar({ editor }: { editor: Editor }) {
    const btn = (active: boolean) =>
        `px-2 py-1 rounded text-sm ${active ? "bg-purple-600 text-white" : "hover:bg-gray-100"
        }`

    return (
        <div className="flex flex-wrap gap-1 border-b p-2">
            <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={btn(editor.isActive("bold"))}
            >
                B
            </button>

            <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={btn(editor.isActive("italic"))}
            >
                I
            </button>

            <button
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={btn(editor.isActive("underline"))}
            >
                U
            </button>

            <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={btn(editor.isActive("bulletList"))}
            >
                • List
            </button>

            <button
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={btn(editor.isActive("orderedList"))}
            >
                1. List
            </button>

            <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={btn(editor.isActive("heading", { level: 2 }))}
            >
                H2
            </button>
        </div>
    )
}
