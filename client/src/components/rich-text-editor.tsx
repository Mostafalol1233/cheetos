import React, { useMemo, useRef, useCallback } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onImageUpload?: (file: File) => Promise<string>;
}

// New advanced rich editor built on Quill with a comprehensive toolbar, color controls,
// headings, lists, alignment, direction, code, blockquote, and robust image upload handler.
const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Enter description...',
  className = '',
  onImageUpload,
}) => {
  const quillRef = useRef<ReactQuill | null>(null);

  const handleImageInsert = useCallback(async () => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;

    // If no custom uploader provided, fall back to URL prompt
    if (!onImageUpload) {
      const url = window.prompt('Enter image URL:');
      if (url) {
        const range = quill.getSelection(true);
        quill.insertEmbed(range?.index ?? 0, 'image', url, 'user');
        quill.setSelection((range?.index ?? 0) + 1, 0, 'user');
      }
      return;
    }

    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const imageUrl = await onImageUpload(file);
        const range = quill.getSelection(true);
        quill.insertEmbed(range?.index ?? 0, 'image', imageUrl, 'user');
        quill.setSelection((range?.index ?? 0) + 1, 0, 'user');
      } catch (err) {
        console.error('Image upload failed:', err);
        alert('Image upload failed. Please try again.');
      }
    };
  }, [onImageUpload]);

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'font': [] }, { 'size': ['small', false, 'large', 'huge'] }],
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'indent': '-1'}, { 'indent': '+1' }],
        [{ 'align': [] }, { 'direction': 'rtl' }],
        ['link', 'image', 'video'],
        ['clean']
      ],
      handlers: {
        image: handleImageInsert,
      },
    },
    clipboard: {
      matchVisual: false,
    },
    history: {
      delay: 800,
      maxStack: 200,
      userOnly: false,
    },
  }), [handleImageInsert]);

  const formats = [
    'font', 'size', 'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block',
    'color', 'background',
    'list', 'bullet', 'indent',
    'align', 'direction',
    'link', 'image',
  ];

  const handleChange = useCallback((content: string) => {
    // Use controlled mode: push changes up immediately
    onChange(content);
  }, [onChange]);

  return (
    <>
      <style>{`
        /* High-contrast, theme-friendly styling for Quill toolbar and editor */
        .advanced-rich-text-editor .ql-toolbar {
          border-top: 1px solid hsl(var(--border, 0 0% 80%));
          border-left: 1px solid hsl(var(--border, 0 0% 80%));
          border-right: 1px solid hsl(var(--border, 0 0% 80%));
          border-bottom: none;
          background-color: hsl(var(--muted, 0 0% 96%));
          position: relative;
          z-index: 10;
        }
        .advanced-rich-text-editor .ql-container {
          border: 1px solid hsl(var(--border, 0 0% 80%));
          min-height: 180px;
          background-color: hsl(var(--background, 0 0% 100%));
          color: hsl(var(--foreground, 0 0% 10%));
        }
        .advanced-rich-text-editor .ql-editor {
          color: hsl(var(--foreground, 0 0% 10%));
          padding: 12px 15px;
          min-height: 300px;
        }
        .advanced-rich-text-editor .ql-editor.ql-blank::before {
          color: hsl(var(--muted-foreground, 0 0% 45%));
          font-style: normal;
        }
        .advanced-rich-text-editor .ql-toolbar .ql-stroke {
          stroke: currentColor;
          stroke-width: 2;
          opacity: 1;
        }
        .advanced-rich-text-editor .ql-toolbar .ql-fill {
          fill: currentColor;
          opacity: 1;
        }
        .advanced-rich-text-editor .ql-toolbar button,
        .advanced-rich-text-editor .ql-toolbar .ql-picker {
          color: hsl(var(--foreground, 0 0% 10%));
          opacity: 0.95;
          cursor: pointer !important;
          pointer-events: auto !important;
        }
        .advanced-rich-text-editor .ql-toolbar button:hover,
        .advanced-rich-text-editor .ql-toolbar button:focus,
        .advanced-rich-text-editor .ql-toolbar .ql-picker-label:hover {
          color: hsl(var(--primary, 47 95% 50%));
          opacity: 1;
          background-color: hsl(var(--accent, 0 0% 96%));
        }
        .advanced-rich-text-editor .ql-toolbar button.ql-active,
        .advanced-rich-text-editor .ql-toolbar .ql-picker-label.ql-active,
        .advanced-rich-text-editor .ql-toolbar .ql-picker-item.ql-selected {
          color: hsl(var(--primary, 47 95% 50%));
          background-color: hsl(var(--accent, 0 0% 96%));
        }
        .advanced-rich-text-editor .ql-toolbar .ql-picker-options {
          background-color: hsl(var(--popover, 0 0% 100%));
          border: 1px solid hsl(var(--border, 0 0% 80%));
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          z-index: 1000;
        }
        .advanced-rich-text-editor .ql-toolbar .ql-picker-item {
          color: hsl(var(--foreground, 0 0% 10%));
        }
        .advanced-rich-text-editor .ql-toolbar .ql-picker-item:hover {
          background-color: hsl(var(--accent, 0 0% 96%));
        }
        .advanced-rich-text-editor .ql-editor img {
          max-width: 100%;
          height: auto;
          border-radius: 6px;
          margin: 6px 0;
        }
        .advanced-rich-text-editor .ql-editor pre.ql-syntax {
          background: hsl(0 0% 10%);
          color: hsl(0 0% 92%);
          padding: 10px;
          border-radius: 6px;
          overflow-x: auto;
        }
      `}</style>
      <div className={`advanced-rich-text-editor ${className}`}>
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={value || ''}
          onChange={handleChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
        />
      </div>
    </>
  );
};

export default RichTextEditor;
