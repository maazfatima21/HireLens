import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import { supabase, supabaseResumeBucket } from "../config/supabase.js";
import { ResumeAnalysis } from "../models/resume-analysis.model.js";
import { generateResumeAnalysis, getSafeGeminiErrorMessage } from "../services/gemini-resume-analysis.service.js";

export const normalizeResumeText = (text: string) => text
  .replace(/\r/g, "")
  .replace(/[ \t]+/g, " ")
  .replace(/\n{3,}/g, "\n\n")
  .trim();

export const processResumeAnalysis = async (
  data: { candidateId: string; resumeFileKey: string; processingToken: string },
  retry = { attemptsMade: 0, maxAttempts: 1 }
) => {
  const analysis = await ResumeAnalysis.findOneAndUpdate(
    { candidateId: data.candidateId, resumeFileKey: data.resumeFileKey, processingToken: data.processingToken, analysisStatus: "PENDING" },
    { $set: { analysisStatus: "PROCESSING" }, $unset: { errorMessage: 1 } },
    { returnDocument: "after" }
  );
  try {
    if (!analysis) throw new Error("Resume analysis record not found");
    const { data: object, error: downloadError } = await supabase.storage
      .from(supabaseResumeBucket)
      .download(data.resumeFileKey);
    if (downloadError || !object) throw downloadError || new Error("Resume download returned no data");
    const buffer = Buffer.from(await object.arrayBuffer());
    let text: string;
    if (data.resumeFileKey.toLowerCase().endsWith(".pdf")) {
      const parser = new PDFParse({ data: buffer });
      try {
        text = (await parser.getText()).text;
      } finally {
        await parser.destroy();
      }
    } else {
      text = (await mammoth.extractRawText({ buffer })).value;
    }
    const rawText = normalizeResumeText(text);
    if (rawText.replace(/\s/g, "").length < 50) throw new Error("Resume text extraction returned insufficient text");
    const result = await generateResumeAnalysis(rawText);
    await ResumeAnalysis.findOneAndUpdate(
      { _id: analysis._id, candidateId: data.candidateId, resumeFileKey: data.resumeFileKey, processingToken: data.processingToken, analysisStatus: "PROCESSING" },
      { $set: { rawText, ...result, analysisStatus: "COMPLETED" }, $unset: { errorMessage: 1 } }
    );
  } catch (error) {
    const safeMessage = getSafeGeminiErrorMessage(error);
    console.error(`[resume-analysis] ${safeMessage}`);
    if (analysis) {
      const hasAttemptsRemaining = retry.attemptsMade + 1 < retry.maxAttempts;
      await ResumeAnalysis.findOneAndUpdate(
        { _id: analysis._id, candidateId: data.candidateId, resumeFileKey: data.resumeFileKey, processingToken: data.processingToken, analysisStatus: "PROCESSING" },
        hasAttemptsRemaining
          ? { $set: { analysisStatus: "PENDING" }, $unset: { errorMessage: 1 } }
          : { $set: { analysisStatus: "FAILED", errorMessage: safeMessage } }
      );
    }
    throw error;
  }
};
