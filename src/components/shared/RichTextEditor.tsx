'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import { Extension } from '@tiptap/core';
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    List,
    ListOrdered,
    Quote,
    Link as LinkIcon,
    Type,
    RotateCcw,
    Heading1,
    Heading2,
    Heading3
} from 'lucide-react';

// Custom Extension to handle font-size as an attribute on both marks and nodes
const CustomFontSize = Extension.create({
    name: 'fontSize',
    addOptions() {
        return {
            types: ['textStyle', 'paragraph', 'listItem'],
        };
    },
    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    fontSize: {
                        default: null,
                        parseHTML: element => element.style.fontSize?.replace(/['"]+/g, ''),
                        renderHTML: attributes => {
                            if (!attributes.fontSize) return {};
                            return { style: `font-size: ${attributes.fontSize}` };
                        },
                    },
                },
            },
        ];
    },
    addCommands() {
        return {
            setFontSize: fontSize => ({ chain }) => {
                return chain()
                    .setMark('textStyle', { fontSize })
                    .updateAttributes('paragraph', { fontSize })
                    .updateAttributes('listItem', { fontSize })
                    .run();
            },
            unsetFontSize: () => ({ chain }) => {
                return chain()
                    .setMark('textStyle', { fontSize: null })
                    .updateAttributes('paragraph', { fontSize: null })
                    .updateAttributes('listItem', { fontSize: null })
                    .removeEmptyTextStyle()
                    .run();
            },
        };
    },
});

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

const MenuBar = ({ editor }: { editor: any }) => {
    if (!editor) return null;

    const setLink = () => {
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);

        if (url === null) return;
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };

    const sizes = [
        { label: 'Small', value: '0.75rem' },
        { label: 'Normal', value: '1rem' },
        { label: 'Large', value: '1.5rem' },
        { label: 'Huge', value: '2.5rem' },
    ];

    return (
        <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50 border-b border-gray-200 rounded-t-xl">
            <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    className={`p-1.5 rounded transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-200 text-gray-600'}`}
                    title="Heading 1"
                >
                    <Heading1 size={18} />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={`p-1.5 rounded transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-200 text-gray-600'}`}
                    title="Heading 2"
                >
                    <Heading2 size={18} />
                </button>
            </div>

            <div className="flex items-center gap-1 px-2 border-r border-gray-200">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`p-1.5 rounded transition-colors ${editor.isActive('bold') ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-200 text-gray-600'}`}
                    title="Bold"
                >
                    <Bold size={18} />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`p-1.5 rounded transition-colors ${editor.isActive('italic') ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-200 text-gray-600'}`}
                    title="Italic"
                >
                    <Italic size={18} />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    className={`p-1.5 rounded transition-colors ${editor.isActive('underline') ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-200 text-gray-600'}`}
                    title="Underline"
                >
                    <UnderlineIcon size={18} />
                </button>
            </div>

            <div className="flex items-center gap-1 px-2 border-r border-gray-200">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`p-1.5 rounded transition-colors ${editor.isActive('bulletList') ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-200 text-gray-600'}`}
                    title="Bullet List"
                >
                    <List size={18} />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={`p-1.5 rounded transition-colors ${editor.isActive('orderedList') ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-200 text-gray-600'}`}
                    title="Ordered List"
                >
                    <ListOrdered size={18} />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    className={`p-1.5 rounded transition-colors ${editor.isActive('blockquote') ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-200 text-gray-600'}`}
                    title="Blockquote"
                >
                    <Quote size={18} />
                </button>
            </div>

            <div className="flex items-center gap-2 px-2 border-r border-gray-200">
                <select
                    onChange={(e) => {
                        if (e.target.value === 'normal') {
                            editor.chain().focus().unsetFontSize().run();
                        } else {
                            editor.chain().focus().setFontSize(e.target.value).run();
                        }
                    }}
                    className="text-xs bg-white border border-gray-200 rounded px-2 py-1 outline-none text-gray-600 focus:border-indigo-400"
                    value={editor.getAttributes('textStyle').fontSize || 'normal'}
                >
                    <option value="normal">Normal Size</option>
                    {sizes.map(size => (
                        <option key={size.value} value={size.value}>{size.label}</option>
                    ))}
                </select>
            </div>

            <div className="flex items-center gap-1 pl-2">
                <button
                    type="button"
                    onClick={setLink}
                    className={`p-1.5 rounded transition-colors ${editor.isActive('link') ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-200 text-gray-600'}`}
                    title="Link"
                >
                    <LinkIcon size={18} />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
                    className="p-1.5 rounded hover:bg-gray-200 text-red-500 transition-colors"
                    title="Clear Formatting"
                >
                    <RotateCcw size={18} />
                </button>
            </div>
        </div>
    );
};

export default function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                bulletList: {
                    keepMarks: true,
                    keepAttributes: true,
                },
                orderedList: {
                    keepMarks: true,
                    keepAttributes: true,
                },
            }),
            Underline,
            TextStyle,
            CustomFontSize as any,
            Link.configure({
                openOnClick: false,
            }),
            Placeholder.configure({
                placeholder: placeholder || 'Write something...',
            }),
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-slate prose-sm focus:outline-none max-w-none min-h-[200px] p-4 text-gray-700',
            },
        },
    });

    return (
        <div className={`border border-gray-200 rounded-xl overflow-hidden focus-within:border-indigo-400 transition-colors ${className}`}>
            <MenuBar editor={editor} />
            <EditorContent editor={editor} />
            <style jsx global>{`
        .tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }
        .tiptap ul, .tiptap ol {
          padding-left: 1.5rem;
          margin: 1rem 0;
        }
        .tiptap ul { list-style-type: disc; }
        .tiptap ol { list-style-type: decimal; }
        .tiptap li p { margin: 0; }
        
        /* Font size rendering inside editor */
        .tiptap [style*="font-size"] {
          display: inline-block; /* Helps with scaling */
        }

        .tiptap li::marker {
          font-size: inherit !important;
        }
      `}</style>
        </div>
    );
}
