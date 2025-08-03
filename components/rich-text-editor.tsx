'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import Typography from '@tiptap/extension-typography'
import Placeholder from '@tiptap/extension-placeholder'
import { Color } from '@tiptap/extension-color'
import TextStyle from '@tiptap/extension-text-style'
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Highlighter,
  Type,
  Image as ImageIcon,
  Palette,
  Upload,
  Link,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useRef, useState, useCallback } from 'react'

interface RichTextEditorProps {
  content?: string
  onChange?: (content: string) => void
  placeholder?: string
  className?: string
  minHeight?: string
}

export function RichTextEditor({ 
  content = '', 
  onChange, 
  placeholder = 'Start typing...',
  className,
  minHeight = '200px'
}: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showFontPicker, setShowFontPicker] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        }
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full rounded-lg'
        }
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph']
      }),
      Highlight.configure({
        multicolor: true
      }),
      Typography,
      Placeholder.configure({
        placeholder
      }),
      Color,
      TextStyle
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none dark:prose-invert p-4'
      }
    }
  })

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result
      if (typeof result === 'string' && editor) {
        editor.chain().focus().setImage({ src: result }).run()
      }
    }
    reader.readAsDataURL(file)
  }, [editor])

  const handleImageUrl = useCallback(() => {
    const url = window.prompt('Enter image URL')
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  const colors = [
    '#000000', '#374151', '#DC2626', '#F59E0B', '#10B981', 
    '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280', '#F3F4F6'
  ]

  const fonts = [
    { name: 'Default', value: 'inherit' },
    { name: 'Serif', value: 'serif' },
    { name: 'Mono', value: 'monospace' },
    { name: 'Sans', value: 'sans-serif' }
  ]

  if (!editor) {
    return null
  }

  return (
    <div className={cn('border rounded-lg overflow-hidden', className)}>
      {/* Toolbar */}
      <div className="border-b bg-gray-50 dark:bg-gray-800 p-2 flex flex-wrap gap-1">
        {/* Text Formatting */}
        <div className="flex items-center gap-1 pr-2 border-r">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn('h-8 w-8 p-0', editor.isActive('bold') && 'bg-gray-200 dark:bg-gray-700')}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn('h-8 w-8 p-0', editor.isActive('italic') && 'bg-gray-200 dark:bg-gray-700')}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={cn('h-8 w-8 p-0', editor.isActive('strike') && 'bg-gray-200 dark:bg-gray-700')}
          >
            <Strikethrough className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={cn('h-8 w-8 p-0', editor.isActive('code') && 'bg-gray-200 dark:bg-gray-700')}
          >
            <Code className="h-4 w-4" />
          </Button>
        </div>

        {/* Headings */}
        <div className="flex items-center gap-1 pr-2 border-r">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={cn('h-8 px-2 text-xs', editor.isActive('heading', { level: 1 }) && 'bg-gray-200 dark:bg-gray-700')}
          >
            H1
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={cn('h-8 px-2 text-xs', editor.isActive('heading', { level: 2 }) && 'bg-gray-200 dark:bg-gray-700')}
          >
            H2
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={cn('h-8 px-2 text-xs', editor.isActive('heading', { level: 3 }) && 'bg-gray-200 dark:bg-gray-700')}
          >
            H3
          </Button>
        </div>

        {/* Lists */}
        <div className="flex items-center gap-1 pr-2 border-r">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn('h-8 w-8 p-0', editor.isActive('bulletList') && 'bg-gray-200 dark:bg-gray-700')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn('h-8 w-8 p-0', editor.isActive('orderedList') && 'bg-gray-200 dark:bg-gray-700')}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={cn('h-8 w-8 p-0', editor.isActive('blockquote') && 'bg-gray-200 dark:bg-gray-700')}
          >
            <Quote className="h-4 w-4" />
          </Button>
        </div>

        {/* Alignment */}
        <div className="flex items-center gap-1 pr-2 border-r">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={cn('h-8 w-8 p-0', editor.isActive({ textAlign: 'left' }) && 'bg-gray-200 dark:bg-gray-700')}
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={cn('h-8 w-8 p-0', editor.isActive({ textAlign: 'center' }) && 'bg-gray-200 dark:bg-gray-700')}
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={cn('h-8 w-8 p-0', editor.isActive({ textAlign: 'right' }) && 'bg-gray-200 dark:bg-gray-700')}
          >
            <AlignRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            className={cn('h-8 w-8 p-0', editor.isActive({ textAlign: 'justify' }) && 'bg-gray-200 dark:bg-gray-700')}
          >
            <AlignJustify className="h-4 w-4" />
          </Button>
        </div>

        {/* Colors and Highlight */}
        <div className="flex items-center gap-1 pr-2 border-r relative">
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="h-8 w-8 p-0"
            >
              <Palette className="h-4 w-4" />
            </Button>
            {showColorPicker && (
              <div className="absolute top-10 left-0 z-50 bg-white dark:bg-gray-800 border rounded-lg shadow-lg p-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium">Text Color</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowColorPicker(false)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <div className="grid grid-cols-5 gap-1">
                  {colors.map(color => (
                    <button
                      key={color}
                      onClick={() => {
                        editor.chain().focus().setColor(color).run()
                        setShowColorPicker(false)
                      }}
                      className="w-8 h-8 rounded border-2 border-gray-300 hover:border-gray-400"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className={cn('h-8 w-8 p-0', editor.isActive('highlight') && 'bg-gray-200 dark:bg-gray-700')}
          >
            <Highlighter className="h-4 w-4" />
          </Button>
        </div>

        {/* Font Selection */}
        <div className="flex items-center gap-1 pr-2 border-r relative">
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFontPicker(!showFontPicker)}
              className="h-8 px-2 text-xs"
            >
              <Type className="h-4 w-4 mr-1" />
              Font
            </Button>
            {showFontPicker && (
              <div className="absolute top-10 left-0 z-50 bg-white dark:bg-gray-800 border rounded-lg shadow-lg p-2 w-32">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium">Font</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFontPicker(false)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                {fonts.map(font => (
                  <button
                    key={font.value}
                    onClick={() => {
                      editor.chain().focus().setMark('textStyle', { fontFamily: font.value }).run()
                      setShowFontPicker(false)
                    }}
                    className="w-full text-left px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    style={{ fontFamily: font.value }}
                  >
                    {font.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Image */}
        <div className="flex items-center gap-1 pr-2 border-r">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="h-8 w-8 p-0"
            title="Upload image"
          >
            <Upload className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleImageUrl}
            className="h-8 w-8 p-0"
            title="Add image from URL"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
        </div>

        {/* Undo/Redo */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="h-8 w-8 p-0"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="h-8 w-8 p-0"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="bg-white dark:bg-gray-900" style={{ minHeight }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}