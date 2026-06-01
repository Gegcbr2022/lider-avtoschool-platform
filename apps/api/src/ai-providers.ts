import { aiProviderSchema } from "../../../packages/shared/src/index";
import { z } from "zod";

export const aiConsultationSchema = z.object({
  provider: aiProviderSchema.default("openai"),
  question: z.string().min(3).max(1200),
  category: z.enum(["A", "A1", "B", "C", "CE"]).optional()
});

export type AiConsultationRequest = z.infer<typeof aiConsultationSchema>;

export async function answerStudentQuestion(input: AiConsultationRequest) {
  return {
    provider: input.provider,
    answer:
      "AI-консультант готовий до підключення через адаптери OpenAI, Claude, Gemini, OpenRouter або локальну модель. Для production додайте ключ провайдера в secret store та реалізуйте provider adapter.",
    recommendedCategory: input.category ?? "B"
  };
}
