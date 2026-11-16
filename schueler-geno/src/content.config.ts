import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Hier wird festgelegt, welche Angaben ein Beitrag im Ordner /beitraege
// haben muss. Fehlt etwas oder ist etwas falsch geschrieben, meldet die
// Seite beim Bauen einen verständlichen Fehler.
const beitraege = defineCollection({
  loader: glob({ pattern: '*.md', base: './beitraege' }),
  schema: ({ image }) =>
    z.object({
      titel: z.string().min(1),
      datum: z.coerce.date(),
      kategorie: z.enum(['Neuigkeit', 'Ankündigung']),
      kurztext: z.string().min(1).max(300),
      bild: image().optional(),
      bildBeschreibung: z.string().optional(),
    }),
});

export const collections = { beitraege };
