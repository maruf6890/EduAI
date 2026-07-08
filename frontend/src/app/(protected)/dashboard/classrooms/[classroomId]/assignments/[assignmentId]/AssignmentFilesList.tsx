import { FileText, Image as ImageIcon, FileArchive, File as FileIcon, Download } from "lucide-react";
import { AssignmentFile, SubmissionFile } from "../types";

function getFileIcon(fileType: string) {
  if (fileType === "image") return ImageIcon;
  if (fileType === "zip") return FileArchive;
  if (fileType === "pdf" || fileType === "docx" || fileType === "pptx") return FileText;
  return FileIcon;
}

export default function AssignmentFilesList({
  files,
  emptyLabel = "No files attached",
}: {
  files: (AssignmentFile | SubmissionFile)[];
  emptyLabel?: string;
}) {
  if (files.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {files.map((file) => {
        const Icon = getFileIcon(file.file_type);
        return (
          <li key={file.id}>
            <a
              href={file.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-sm border border-border bg-muted/30 px-3 py-2.5 text-sm transition hover:border-[#8168f3]/40 hover:bg-[#8168f3]/5"
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <Icon className="h-4 w-4 shrink-0 text-[#8168f3]" />
                <span className="truncate text-foreground">{file.file_name}</span>
              </span>
              <Download className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </a>
          </li>
        );
      })}
    </ul>
  );
}