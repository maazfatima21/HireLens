import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import { ApiError } from "../utils/api-error.js";

export const extractResumeText = async (buffer: Buffer, mimeType: string) => {
  let text = "";
  if (mimeType === "application/pdf") {
    const parser = new PDFParse({ data: buffer });
    text = (await parser.getText()).text;
    await parser.destroy();
  } else if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    text = (await mammoth.extractRawText({ buffer })).value;
  } else {
    throw new ApiError(400, "Unsupported resume format");
  }
  const normalized = text.replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  if (!normalized) throw new ApiError(400, "Could not extract text from resume");
  return normalized;
};
