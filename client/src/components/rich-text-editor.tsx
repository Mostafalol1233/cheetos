import React, { useMemo, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onImageUpload?: (file: File) => Promise<string>;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Enter description...",
  className = "",
  onImageUpload
}) => {
  const quillRef = useRef<ReactQuill>(null);

  const imageHandler = useMemo(() => {
    return () => {
      if (!onImageUpload) {
        // Fallback to default behavior - insert image URL
        const url = prompt('Enter image URL:');
        if (url) {
          const quill = quillRef.current?.getEditor();
          if (quill) {
            const range = quill.getSelection();
            quill.insertEmbed(range?.index || 0, 'image', url);
          }
        }
        return;
      }

      const input = document.createElement('input');
      input.setAttribute('type', 'file');
      input.setAttribute('accept', 'image/*');
      input.click();

      input.onchange = async () => {
        const file = input.files?.[0];
        if (file) {
          try {
            const imageUrl = await onImageUpload(file);
            const quill = quillRef.current?.getEditor();
            if (quill) {
              const range = quill.getSelection();
              quill.insertEmbed(range?.index || 0, 'image', imageUrl);
            }
          } catch (error) {
            console.error('Image upload failed:', error);
            alert('Image upload failed. Please try again.');
          }
        }
      };
    };
  }, [onImageUpload]);

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'indent': '-1'}, { 'indent': '+1' }],
        [{ 'direction': 'rtl' }],
        [{ 'align': [] }],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: imageHandler,
      },
    },
    clipboard: {
      matchVisual: false,
    },
  }), [imageHandler]);

  const formats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent', 'direction', 'align',
    'link', 'image'
  ];

  return (
    <>
      <style>{`
        .rich-text-editor .ql-toolbar {
          border-top: 1px solid hsl(var(--border));
          border-left: 1px solid hsl(var(--border));
          border-right: 1px solid hsl(var(--border));
          border-bottom: none;
          background-color: hsl(var(--muted));
        }
        .rich-text-editor .ql-container {
          border: 1px solid hsl(var(--border));
          min-height: 120px;
          background-color: hsl(var(--background));
          color: hsl(var(--foreground));
        }
        .rich-text-editor .ql-editor {
          color: hsl(var(--foreground));
          padding: 12px 15px;
        }
        .rich-text-editor .ql-editor.ql-blank::before {
          color: hsl(var(--muted-foreground));
        }
        .rich-text-editor .ql-toolbar .ql-stroke {
          stroke: hsl(var(--foreground));
        }
        .rich-text-editor .ql-toolbar .ql-fill {
          fill: hsl(var(--foreground));
        }
        .rich-text-editor .ql-toolbar button:hover,
        .rich-text-editor .ql-toolbar button:focus {
          color: hsl(var(--primary));
        }
        .rich-text-editor .ql-toolbar button.ql-active,
        .rich-text-editor .ql-toolbar .ql-picker-label.ql-active,
        .rich-text-editor .ql-toolbar .ql-picker-item.ql-selected {
          color: hsl(var(--primary));
        }
        .rich-text-editor .ql-editor img {
          max-width: 100%;
          height: auto;
          cursor: pointer;
        }
        .rich-text-editor .ql-editor img:hover {
          opacity: 0.8;
        }
      `}</style>
      <div className={`rich-text-editor ${className}`}>
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={value}
          onChange={onChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
        />
      </div>
    </>
  );
};

export default RichTextEditor;