"use client"

import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import Toolbar from "./Toolbar"

interface Props {
    value?: any
    onChange?: (content: any) => void
}

export default function RichTextEditor({ value, onChange }: Props) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline
        ],
        content: value || "",
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class:
                    "prose max-w-none min-h-[200px] p-4 focus:outline-none"
            }
        },
        onUpdate({ editor }) {
            onChange?.(editor.getHTML())
        }
    })

    if (!editor) return null

    return (
        <div className="border rounded-lg bg-white">
            <Toolbar editor={editor} />
            <EditorContent editor={editor} />
        </div>
    )
}
