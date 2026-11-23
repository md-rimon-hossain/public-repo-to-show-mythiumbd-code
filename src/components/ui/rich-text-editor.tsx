"use client";

import React, { useRef, useCallback, useEffect } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Highlighter,
  Link,
  Quote,
  Undo,
  Redo,
  Type,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Start writing...",
  minHeight = "200px",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);

  useEffect(() => {
    if (editorRef.current && !isInternalChange.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || "";
      }
    }
    isInternalChange.current = false;
  }, [value]);

  const execCommand = useCallback(
    (command: string, val?: string) => {
      editorRef.current?.focus();
      document.execCommand(command, false, val);
      isInternalChange.current = true;
      onChange(editorRef.current?.innerHTML || "");
    },
    [onChange]
  );

  const handleInput = useCallback(() => {
    isInternalChange.current = true;
    onChange(editorRef.current?.innerHTML || "");
  }, [onChange]);

  const handleLink = () => {
    const url = prompt("Enter URL:");
    if (url) execCommand("createLink", url);
  };

  const handleHighlight = () => {
    execCommand("hiliteColor", "#fef08a");
  };

  const ToolBtn = ({
    onClick,
    title,
    children,
    active,
  }: {
    onClick: () => void;
    title: string;
    children: React.ReactNode;
    active?: boolean;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-md transition-colors hover:bg-black/10 ${
        active ? "bg-black/10 text-black" : "text-gray-500"
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden bg-white/5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-white/10 bg-white/5">
        <ToolBtn onClick={() => execCommand("bold")} title="Bold">
          <Bold size={16} />
        </ToolBtn>
        <ToolBtn onClick={() => execCommand("italic")} title="Italic">
          <Italic size={16} />
        </ToolBtn>
        <ToolBtn onClick={() => execCommand("underline")} title="Underline">
          <Underline size={16} />
        </ToolBtn>
        <ToolBtn
          onClick={() => execCommand("strikeThrough")}
          title="Strikethrough"
        >
          <Strikethrough size={16} />
        </ToolBtn>

        <div className="w-px h-5 bg-white/10 mx-1" />

        <ToolBtn
          onClick={() => execCommand("formatBlock", "<h2>")}
          title="Heading 2"
        >
          <Heading2 size={16} />
        </ToolBtn>
        <ToolBtn
          onClick={() => execCommand("formatBlock", "<h3>")}
          title="Heading 3"
        >
          <Heading3 size={16} />
        </ToolBtn>
        <ToolBtn
          onClick={() => execCommand("formatBlock", "<p>")}
          title="Paragraph"
        >
          <Type size={16} />
        </ToolBtn>

        <div className="w-px h-5 bg-white/10 mx-1" />

        <ToolBtn
          onClick={() => execCommand("insertUnorderedList")}
          title="Bullet List"
        >
          <List size={16} />
        </ToolBtn>
        <ToolBtn
          onClick={() => execCommand("insertOrderedList")}
          title="Numbered List"
        >
          <ListOrdered size={16} />
        </ToolBtn>
        <ToolBtn
          onClick={() => execCommand("formatBlock", "<blockquote>")}
          title="Blockquote"
        >
          <Quote size={16} />
        </ToolBtn>

        <div className="w-px h-5 bg-white/10 mx-1" />

        <ToolBtn onClick={handleHighlight} title="Highlight">
          <Highlighter size={16} />
        </ToolBtn>
        <ToolBtn onClick={handleLink} title="Insert Link">
          <Link size={16} />
        </ToolBtn>

        <div className="w-px h-5 bg-white/10 mx-1" />

        <ToolBtn onClick={() => execCommand("undo")} title="Undo">
          <Undo size={16} />
        </ToolBtn>
        <ToolBtn onClick={() => execCommand("redo")} title="Redo">
          <Redo size={16} />
        </ToolBtn>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        data-placeholder={placeholder}
        className="px-4 py-3 outline-none prose prose-sm max-w-none text-foreground
          [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-gray-400
          [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2
          [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1
          [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6
          [&_li]:my-1
          [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-500
          [&_a]:text-blue-500 [&_a]:underline
          [&_mark]:bg-yellow-200 [&_mark]:px-0.5 [&_mark]:rounded"
        style={{ minHeight }}
      />
    </div>
  );
}
