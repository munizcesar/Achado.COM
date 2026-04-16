import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.date(),
    category: z.string().default('Blog'),
    image: z.string().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    // Campos de monetização
    affiliateUrl: z.string().url().optional(),
    productImage: z.string().optional(),
    price: z.string().optional(),
    // Campos legado (posts antigos) — não remover para evitar erros de build
    rating: z.number().min(1).max(5).optional(),
    pros: z.array(z.string()).optional(),
    cons: z.array(z.string()).optional(),
    brand: z.string().optional(),
    model: z.string().optional(),
    verdict: z.string().optional(),
    // Evidências dos três pilares (usados em posts de produto)
    pillar1Title: z.string().optional(),
    pillar1Evidence: z.string().optional(),
    pillar2Title: z.string().optional(),
    pillar2Evidence: z.string().optional(),
    pillar3Title: z.string().optional(),
    pillar3Evidence: z.string().optional(),
  }),
});

export const collections = { blog };
