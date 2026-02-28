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
  }),
});

export const collections = { blog };
