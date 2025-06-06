import { useCallback, useEffect, useState } from 'react';
import type { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value?: string;
  onChange?: (content: string) => void;
  height?: number;
}

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'color': [] }, { 'background': [] }],
    ['link', 'image'],
    ['clean']
  ],
};

const formats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list', 'bullet',
  'color', 'background',
  'link', 'image'
];

export default function RichTextEditor({ 
  value = '', 
  onChange,
  height = 500 
}: RichTextEditorProps) {
  const [ReactQuill, setReactQuill] = useState<typeof import('react-quill').default | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    import('react-quill').then((module) => {
      setReactQuill(() => module.default);
    });
  }, []);

  const handleChange = useCallback((content: string) => {
    if (onChange) {
      onChange(content);
    }
  }, [onChange]);

  if (!isMounted || !ReactQuill) {
    return (
      <div 
        className="rich-text-editor"
        style={{ 
          height: `${height}px`,
          border: '1px solid #ccc',
          borderRadius: '0.375rem',
          padding: '1rem',
          backgroundColor: 'white',
          color: 'black'
        }}
      >
        Loading editor...
      </div>
    );
  }

  return (
    <div className="rich-text-editor">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={handleChange}
        modules={modules}
        formats={formats}
        style={{ height: `${height}px` }}
      />
      <style>{`
        .rich-text-editor .ql-container {
          height: ${height - 42}px;
          background: white;
          color: black;
        }
        .rich-text-editor .ql-toolbar {
          background: #f8f9fa;
          border-top-left-radius: 0.375rem;
          border-top-right-radius: 0.375rem;
        }
        .rich-text-editor .ql-container {
          border-bottom-left-radius: 0.375rem;
          border-bottom-right-radius: 0.375rem;
        }
        .dark .rich-text-editor .ql-container {
          background: #1f2937;
          color: white;
        }
        .dark .rich-text-editor .ql-toolbar {
          background: #374151;
        }
        .dark .rich-text-editor .ql-toolbar button {
          color: white;
        }
        .dark .rich-text-editor .ql-toolbar button:hover,
        .dark .rich-text-editor .ql-toolbar button.ql-active {
          color: #60a5fa;
        }
        .dark .rich-text-editor .ql-toolbar .ql-stroke {
          stroke: white;
        }
        .dark .rich-text-editor .ql-toolbar .ql-fill {
          fill: white;
        }
      `}</style>
    </div>
  );
} 