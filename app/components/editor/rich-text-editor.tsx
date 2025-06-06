import { useEffect, useRef, useState, useCallback } from "react";
import type { OutputData } from "@editorjs/editorjs";
import { useDebounce } from "~/hooks/use-debounce";
import { cn } from "~/lib/utils";

interface RichTextEditorProps {
  onChange: (data: OutputData) => void;
  initialData?: OutputData;
  className?: string;
}

export function RichTextEditor({
  onChange,
  initialData,
  className,
}: RichTextEditorProps) {
  const [editor, setEditor] = useState<any>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(false);
  const editorInstanceRef = useRef<any>(null);
  const isInitializingRef = useRef(false);

  const handleEditorChange = useCallback(
    async (editorInstance: any) => {
      try {
        if (!editorInstance || !isInitializedRef.current) return;

        await editorInstance.isReady;
        const data = await editorInstance.save();
        onChange(data);
      } catch (error) {
        console.error("Error saving editor content:", error);
      }
    },
    [onChange]
  );

  const debouncedOnChange = useDebounce(handleEditorChange, 500);

  useEffect(() => {
    const initEditor = async () => {
      if (
        !editorRef.current ||
        typeof window === "undefined" ||
        isInitializedRef.current ||
        isInitializingRef.current
      )
        return;

      isInitializingRef.current = true;

      try {
        const EditorJS = (await import("@editorjs/editorjs")).default;
        const Header = (await import("editorjs-header-with-alignment")).default;
        const List = (await import("@editorjs/list")).default;
        const Image = (await import("@editorjs/image")).default;
        const Embed = (await import("@editorjs/embed")).default;
        const Table = (await import("@editorjs/table")).default;
        const Paragraph = (await import("editorjs-paragraph-with-alignment"))
          .default;
        const LinkInlineTool = (await import("@coolbytes/editorjs-link"))
          .default;
        const Hyperlink = (await import("editorjs-hyperlink")).default;

        editorInstanceRef.current = new EditorJS({
          holder: editorRef.current,
          tools: {
            header: Header,
            list: List,
            embed: Embed,
            paragraph: Paragraph,
            table: Table,
            // link: {
            //   class: Link,
            //   config: {
            //     endpoint: "/api/fetch-url", // Optional: endpoint for link preview
            //     headers: {
            //       "Content-Type": "application/json",
            //     },
            //   },
            // },
            // hyperlink: {
            //   class: Hyperlink,
            //   config: {
            //     shortcut: "CMD+L",
            //     target: "_blank",
            //     rel: "nofollow",
            //     availableTargets: ["_blank", "_self"],
            //     availableRels: ["author", "noreferrer"],
            //     validate: false,
            //   },
            // },
            link: {
              // Cấu hình LinkInlineTool
              class: LinkInlineTool,
              config: {
                shortcut: "CMD+L", // Phím tắt
                placeholder: "Nhập URL",
                targets: ["_self", "_blank"], // Cho phép chọn target
                defaultTarget: "_blank", // Mặc định mở tab mới
                relations: [], // Các thuộc tính rel cho link
                validate: true, // Kiểm tra URL
              },
            },
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
            if (editorInstanceRef.current) {
              debouncedOnChange(editorInstanceRef.current);
            }
          },
        });

        await editorInstanceRef.current.isReady;
        setEditor(editorInstanceRef.current);
        isInitializedRef.current = true;

        // Set initial data if it exists
        if (initialData) {
          await editorInstanceRef.current.render(initialData);
        }
      } catch (error) {
        console.error("Error initializing editor:", error);
      } finally {
        isInitializingRef.current = false;
      }
    };

    initEditor();

    return () => {
      if (editorInstanceRef.current && isInitializedRef.current) {
        try {
          editorInstanceRef.current.destroy();
        } catch (error) {
          console.error("Error destroying editor:", error);
        }
        isInitializedRef.current = false;
        editorInstanceRef.current = null;
      }
    };
  }, []); // Empty dependency array to ensure it only runs once

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
