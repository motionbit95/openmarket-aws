import { common, createLowlight } from "lowlight";
import LinkExtension from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { mergeClasses } from "minimal-shared/utils";
import ImageExtension from "@tiptap/extension-image";
import StarterKitExtension from "@tiptap/starter-kit";
import TextAlignExtension from "@tiptap/extension-text-align";
import PlaceholderExtension from "@tiptap/extension-placeholder";
import { useMemo, useState, useEffect, useCallback } from "react";
import CodeBlockLowlightExtension from "@tiptap/extension-code-block-lowlight";
import { useEditor, EditorContent, ReactNodeViewRenderer } from "@tiptap/react";

import Box from "@mui/material/Box";
import Portal from "@mui/material/Portal";
import Backdrop from "@mui/material/Backdrop";
import FormHelperText from "@mui/material/FormHelperText";

import { Toolbar } from "./toolbar";
import { EditorRoot } from "./styles";
import { editorClasses } from "./classes";
import { CodeHighlightBlock } from "./components/code-highlight-block";
import { Button } from "@mui/material";
import { uploadEditorAttachments } from "src/actions/product";
import { toast } from "sonner";

// ----------------------------------------------------------------------

export function Editor({
  sx,
  ref,
  error,
  onChange,
  slotProps,
  helperText,
  resetValue,
  className,
  editable = true,
  fullItem = false,
  value: content = "",
  placeholder = "내용을 작성해주세요.",
  ...other
}) {
  const [fullScreen, setFullScreen] = useState(false);

  const handleToggleFullScreen = useCallback(() => {
    setFullScreen((prev) => !prev);
  }, []);

  const lowlight = useMemo(() => createLowlight(common), []);

  const editor = useEditor({
    content,
    editable,
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    extensions: [
      Underline,
      StarterKitExtension.configure({
        codeBlock: false,
        code: { HTMLAttributes: { class: editorClasses.content.codeInline } },
        heading: { HTMLAttributes: { class: editorClasses.content.heading } },
        horizontalRule: { HTMLAttributes: { class: editorClasses.content.hr } },
        listItem: { HTMLAttributes: { class: editorClasses.content.listItem } },
        blockquote: {
          HTMLAttributes: { class: editorClasses.content.blockquote },
        },
        bulletList: {
          HTMLAttributes: { class: editorClasses.content.bulletList },
        },
        orderedList: {
          HTMLAttributes: { class: editorClasses.content.orderedList },
        },
      }),
      PlaceholderExtension.configure({
        placeholder,
        emptyEditorClass: editorClasses.content.placeholder,
      }),
      ImageExtension.configure({
        HTMLAttributes: { class: editorClasses.content.image },
      }),
      TextAlignExtension.configure({ types: ["heading", "paragraph"] }),
      LinkExtension.configure({
        autolink: true,
        openOnClick: false,
        HTMLAttributes: { class: editorClasses.content.link },
      }),
      CodeBlockLowlightExtension.extend({
        addNodeView: () => ReactNodeViewRenderer(CodeHighlightBlock),
      }).configure({
        lowlight,
        HTMLAttributes: { class: editorClasses.content.codeBlock },
      }),
    ],
    onUpdate({ editor: _editor }) {
      const html = _editor.getHTML();
      onChange?.(html);
    },
    ...other,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (editor?.isEmpty && content !== "<p></p>") {
        editor.commands.setContent(content);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [content, editor]);

  useEffect(() => {
    if (resetValue && !content) {
      editor?.commands.clearContent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  useEffect(() => {
    document.body.style.overflow = fullScreen ? "hidden" : "";
  }, [fullScreen]);

  // 이미지 파일 선택 처리
  const handleFileChange = useCallback(
    async (event) => {
      const file = event.target.files?.[0];
      if (!file || !editor) return;

      try {
        const response = await uploadEditorAttachments(
          [file],
          "product-editor"
        );
        console.log("업로드 응답:", response);

        const uploadedFile = response.files?.[0];

        if (!uploadedFile?.url) {
          throw new Error("파일 업로드 실패: URL 없음");
        }

        editor.chain().focus().setImage({ src: uploadedFile.url }).run();
      } catch (error) {
        console.error("에디터 이미지 업로드 실패:", error);
        toast.error("이미지 업로드에 실패했습니다.");
      } finally {
        event.target.value = "";
      }
    },
    [editor]
  );

  return (
    <Portal disablePortal={!fullScreen}>
      {fullScreen && (
        <Backdrop open sx={[(theme) => ({ zIndex: theme.zIndex.modal - 1 })]} />
      )}

      <Box
        {...slotProps?.wrapper}
        sx={[
          {
            display: "flex",
            flexDirection: "column",
            ...(!editable && { cursor: "not-allowed" }),
          },
          ...(Array.isArray(slotProps?.wrapper?.sx)
            ? slotProps.wrapper.sx
            : [slotProps?.wrapper?.sx]),
        ]}
      >
        {/* 이미지 업로드 input */}
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: "none" }}
          id="editor-image-upload"
        />

        <EditorRoot
          error={!!error}
          disabled={!editable}
          fullScreen={fullScreen}
          className={mergeClasses([editorClasses.root, className])}
          sx={sx}
        >
          <Toolbar
            editor={editor}
            fullItem={fullItem}
            fullScreen={fullScreen}
            onToggleFullScreen={handleToggleFullScreen}
            imageUploadInputId="editor-image-upload" // 추가: input id 넘김
          />
          <EditorContent
            ref={ref}
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
            editor={editor}
            className={editorClasses.content.root}
          />
        </EditorRoot>

        {helperText && (
          <FormHelperText error={!!error} sx={{ px: 2 }}>
            {helperText}
          </FormHelperText>
        )}
      </Box>
    </Portal>
  );
}
