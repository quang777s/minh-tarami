import { useEffect, useRef, useState, useCallback } from "react";
import type { OutputData } from "@editorjs/editorjs";
import { useDebounce } from "~/hooks/use-debounce";
import { cn } from "~/lib/utils";

interface RichTextEditorProps {
  onChange: (data: OutputData) => void;
  value?: OutputData;
  initialData?: OutputData;
  className?: string;
}

export function RichTextEditor({
  onChange,
  value,
  initialData,
  className,
}: RichTextEditorProps) {
  const [editor, setEditor] = useState<any>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(false);

  const handleEditorChange = useCallback(
    async (editorInstance: any) => {
      try {
        if (!editorInstance || !isInitializedRef.current) return;

        await editorInstance.isReady;
        const data = await editorInstance.save();
        console.log("data", data);
        onChange(data);
      } catch (error) {
        console.error("Error saving editor content:", error);
      }
    },
    [onChange]
  );

  const debouncedOnChange = useDebounce(handleEditorChange, 3000);

  useEffect(() => {
    let editorInstance: any = null;

    const initEditor = async () => {
      if (!editorRef.current || typeof window === "undefined") return;

      try {
        const EditorJS = (await import("@editorjs/editorjs")).default;
        const Header = (await import("@editorjs/header")).default;
        const List = (await import("@editorjs/list")).default;
        const Image = (await import("@editorjs/image")).default;
        const Embed = (await import("@editorjs/embed")).default;
        const Table = (await import("@editorjs/table")).default;
        const Paragraph = (await import("editorjs-paragraph-with-alignment"))
          .default;

        editorInstance = new EditorJS({
          holder: editorRef.current,
          data: value || initialData,
          tools: {
            // header: Header,
            header: {
              class: Header,
              inlineToolbar: ["link"],
            },
            list: List,
            embed: Embed,
            paragraph: Paragraph,
            table: Table,
            image: {
              class: Image,
              config: {
                uploader: {
                  uploadByFile(file: File) {
                    return new Promise((resolve, reject) => {
                      const formData = new FormData();
                      formData.append("file", file);

                      fetch("/api/upload", {
                        method: "POST",
                        body: formData,
                      })
                        .then((response) => response.json())
                        .then((result) => {
                          if (result.success) {
                            resolve(result);
                          } else {
                            reject(result.error);
                          }
                        })
                        .catch((error) => {
                          reject(error);
                        });
                    });
                  },
                },
              },
            },
          },
          onChange: () => {
            if (editorInstance) {
              debouncedOnChange(editorInstance);
            }
          },
        });

        await editorInstance.isReady;
        setEditor(editorInstance);
        isInitializedRef.current = true;
      } catch (error) {
        console.error("Error initializing editor:", error);
      }
    };

    initEditor();

    return () => {
      if (editorInstance && isInitializedRef.current) {
        try {
          editorInstance.destroy();
        } catch (error) {
          console.error("Error destroying editor:", error);
        }
        isInitializedRef.current = false;
      }
    };
  }, [initialData, debouncedOnChange, value]);

  // Update editor content when value changes
  useEffect(() => {
    const updateContent = async () => {
      if (!editor || !isInitializedRef.current || !value) return;

      try {
        await editor.isReady;
        await editor.render(value);
      } catch (error) {
        console.error("Error updating editor content:", error);
      }
    };

    updateContent();
  }, [editor, value]);

  return (
    <div
      ref={editorRef}
      className={cn(
        "prose max-w-none min-h-[400px] border rounded-md p-4",
        className
      )}
    />
  );
}
