import React, { useMemo, useRef, useCallback, useState } from 'react';
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
  const [localValue, setLocalValue] = useState(value);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const isLocalChangeRef = useRef(false as boolean);

  // Sync local value when external value changes, but don't override in-progress local edits
  React.useEffect(() => {
    if (!isLocalChangeRef.current && value !== localValue) {
      setLocalValue(value || '');
    }
  }, [value, localValue]);

  // Cleanup debounce timer on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      isLocalChangeRef.current = false;
    };
  }, []);

  const debouncedOnChange = useCallback((content: string) => {
    isLocalChangeRef.current = true;
    setLocalValue(content);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      onChange(content);
      isLocalChangeRef.current = false;
    }, 300); // 300ms debounce
  }, [onChange]);

  const imageHandler = useCallback(() => {
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
    history: {
      delay: 1000,
      maxStack: 50,
      userOnly: false
    }
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
          border-top: 1px solid hsl(var(--border, 0 0% 80%));
          border-left: 1px solid hsl(var(--border, 0 0% 80%));
          border-right: 1px solid hsl(var(--border, 0 0% 80%));
          border-bottom: none;
          background-color: hsl(var(--muted, 0 0% 96%));
        }
        .rich-text-editor .ql-container {
          border: 1px solid hsl(var(--border, 0 0% 80%));
          min-height: 120px;
          background-color: hsl(var(--background, 0 0% 100%));
          color: hsl(var(--foreground, 0 0% 10%));
        }
        .rich-text-editor .ql-editor {
          color: hsl(var(--foreground, 0 0% 10%));
          padding: 12px 15px;
          min-height: 200px;
        }
        .rich-text-editor .ql-editor.ql-blank::before {
          color: hsl(var(--muted-foreground, 0 0% 45%));
          font-style: normal;
        }
        .rich-text-editor .ql-toolbar .ql-stroke {
          stroke: currentColor;
          stroke-width: 2;
          opacity: 1;
        }
        .rich-text-editor .ql-toolbar .ql-fill {
          fill: currentColor;
          opacity: 1;
        }
        .rich-text-editor .ql-toolbar button {
          color: hsl(var(--foreground, 0 0% 10%));
          opacity: 0.9;
        }
        .rich-text-editor .ql-toolbar .ql-picker {
          color: hsl(var(--foreground, 0 0% 10%));
        }
        .rich-text-editor .ql-toolbar button:hover,
        .rich-text-editor .ql-toolbar button:focus {
          color: hsl(var(--primary, 47 95% 50%));
          opacity: 1;
        }
        .rich-text-editor .ql-toolbar button.ql-active,
        .rich-text-editor .ql-toolbar .ql-picker-label.ql-active,
        .rich-text-editor .ql-toolbar .ql-picker-item.ql-selected {
          color: hsl(var(--primary, 47 95% 50%));
        }
        .rich-text-editor .ql-editor img {
          max-width: 100%;
          height: auto;
          cursor: pointer;
          border-radius: 4px;
          margin: 5px 0;
        }
        .rich-text-editor .ql-editor img:hover {
          opacity: 0.8;
        }
        .rich-text-editor .ql-editor p {
          margin-bottom: 1em;
        }
        .rich-text-editor .ql-editor h1,
        .rich-text-editor .ql-editor h2,
        .rich-text-editor .ql-editor h3 {
          margin-top: 1.5em;
          margin-bottom: 0.5em;
        }
      `}</style>
      <div className={`rich-text-editor ${className}`}>
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={localValue || ''}
          onChange={debouncedOnChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          preserveWhitespace={true}
        />
      </div>
    </>
  );
};

export default RichTextEditor;