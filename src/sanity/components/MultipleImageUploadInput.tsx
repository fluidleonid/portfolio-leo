"use client";

import React, { useCallback, useRef, useState } from "react";
import { type ArrayOfObjectsInputProps, useClient, set, unset } from "sanity";
import { Card, Text, Button, Flex, Spinner } from "@sanity/ui";

function UploadSvgIcon() {
  return (
    <svg
      width="1.2em"
      height="1.2em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "inline-block", verticalAlign: "middle" }}
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

/**
 * Custom Sanity Studio Array Input Component for Batch/Multi-Image Uploads.
 *
 * Allows uploading multiple images simultaneously:
 * 1. Button: opens native OS file picker with `multiple` enabled.
 * 2. Drag & Drop: drag and drop multiple images directly into the dashed dropzone.
 * 3. Concurrently uploads each file to Sanity's Asset Pipeline via `client.assets.upload`.
 * 4. Preserves full native Sanity Studio array functionality via `renderDefault`.
 */
export function MultipleImageUploadInput(props: ArrayOfObjectsInputProps) {
  const { value = [], onChange } = props;
  const client = useClient({ apiVersion: "2024-01-01" });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const files = Array.from(fileList).filter((f) =>
        f.type.startsWith("image/")
      );
      if (files.length === 0) return;

      setIsUploading(true);
      setUploadStatus(`Загрузка 0 из ${files.length}...`);

      try {
        let loadedCount = 0;
        const uploadPromises = files.map(async (file) => {
          const asset = await client.assets.upload("image", file, {
            filename: file.name,
          });
          loadedCount++;
          setUploadStatus(`Загрузка ${loadedCount} из ${files.length}...`);
          return {
            _type: "image",
            _key: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            asset: {
              _type: "reference",
              _ref: asset._id,
            },
          };
        });

        const newImageItems = await Promise.all(uploadPromises);
        const updatedValue = [...value, ...newImageItems];
        onChange(updatedValue.length > 0 ? set(updatedValue) : unset());
        setUploadStatus(`Успешно загружено ${files.length} изображений`);
        setTimeout(() => setUploadStatus(""), 3500);
      } catch (err: unknown) {
        console.error("[Sanity Multi-Upload Error]:", err);
        setUploadStatus("Ошибка при загрузке файлов. Попробуйте еще раз.");
        setTimeout(() => setUploadStatus(""), 4000);
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [client, value, onChange]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
      {/* 1. Standard Sanity array thumbnails & item management */}
      {props.renderDefault(props)}

      {/* 2. Batch Upload Dropzone & Button */}
      <Card
        padding={3}
        radius={2}
        border
        tone={isDragOver ? "primary" : "transparent"}
        style={{
          borderStyle: "dashed",
          borderColor: isDragOver ? "#22c55e" : "rgba(255, 255, 255, 0.2)",
          background: isDragOver ? "rgba(34, 197, 94, 0.08)" : "rgba(255, 255, 255, 0.02)",
          transition: "all 0.15s ease",
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Flex
          direction="column"
          align="center"
          justify="center"
          gap={2}
          paddingY={2}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: "none" }}
            onChange={handleInputChange}
            disabled={isUploading}
          />

          {isUploading ? (
            <Flex align="center" gap={3}>
              <Spinner />
              <Text size={1} weight="medium">
                {uploadStatus || "Загрузка изображений..."}
              </Text>
            </Flex>
          ) : (
            <Flex direction="column" align="center" gap={2}>
              <Button
                icon={UploadSvgIcon}
                text="Загрузить пачкой (выбрать несколько картинок)"
                tone="primary"
                mode="ghost"
                onClick={() => fileInputRef.current?.click()}
              />
              <Text size={1} muted>
                или перетащите сразу несколько файлов из проводника сюда
              </Text>
              {uploadStatus && (
                <Text size={1} style={{ color: "#22c55e" }}>
                  {uploadStatus}
                </Text>
              )}
            </Flex>
          )}
        </Flex>
      </Card>
    </div>
  );
}
