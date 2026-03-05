import { z } from 'zod';

export const CourseSchema = z.object({
  title: z.string(),
  description: z.string(),
  modules: z.array(z.object({
    moduleName: z.string(),
    lessons: z.array(z.object({
      title: z.string(),
      content: z.string(),
      videoScript: z.string(),
      quiz: z.array(z.object({
        question: z.string(),
        options: z.array(z.string()).length(4),
        correctAnswer: z.number()
      }))
    }))
  }))
});

export type Course = z.infer<typeof CourseSchema>;
