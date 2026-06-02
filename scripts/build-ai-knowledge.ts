import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  branches,
  graduateReviews,
  graduateStories,
  homeFaq,
  mobileAppFeatures,
  services,
  socialLinks,
  socialProofStats
} from "../packages/shared/src/index";

const documents = [
  ...services.map((service) => ({
    id: `service-${service.id}`,
    title: service.title,
    tags: ["service", service.category, service.retraining ? "retraining" : "course"],
    content: `${service.title}. Категорія ${service.category}. Тривалість ${service.duration}. Теорія від ${service.priceFrom} грн. ${service.summary}`
  })),
  ...branches.map((branch) => ({
    id: `branch-${branch.id}`,
    title: `Філія ${branch.city}`,
    tags: ["branch", branch.city],
    content: `${branch.city}. ${branch.address}. Телефон ${branch.phone}. Графік ${branch.workingHours}. Карта: ${branch.mapQuery}.`
  })),
  ...homeFaq.map((item, index) => ({
    id: `faq-${index}`,
    title: item.question,
    tags: ["faq"],
    content: `${item.question} ${item.answer}`
  })),
  ...graduateReviews.map((review) => ({
    id: `review-${review.id}`,
    title: `Відгук ${review.name}`,
    tags: ["review", review.city],
    content: `${review.name}, ${review.city}, ${review.rating}/5. ${review.text}`
  })),
  ...graduateStories.map((story) => ({
    id: `graduate-${story.id}`,
    title: `Випускник ${story.name}`,
    tags: ["graduate", story.city, story.category],
    content: `${story.name}. ${story.city}. Категорія ${story.category}. ${story.date}. ${story.quote}`
  })),
  ...socialLinks.map((link) => ({
    id: `social-${link.id}`,
    title: link.label,
    tags: ["social", link.id],
    content: `${link.label}: ${link.description}. ${link.href}`
  })),
  {
    id: "trust",
    title: "Соціальний доказ",
    tags: ["trust"],
    content: socialProofStats.map((item) => `${item.value} ${item.label}: ${item.detail}`).join(". ")
  },
  {
    id: "mobile-app",
    title: "Мобільний застосунок",
    tags: ["mobile", "app", "ai"],
    content: mobileAppFeatures.join(". ")
  }
];

const outputPath = resolve(process.cwd(), "ai-knowledge.json");
writeFileSync(
  outputPath,
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      source: "packages/shared/src/index.ts",
      documents
    },
    null,
    2
  )}\n`,
  "utf8"
);

console.log(`AI knowledge exported to ${outputPath}`);
