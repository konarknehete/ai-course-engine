import { genkit } from 'genkit';
import { googleAI, gemini15Flash, gemini15Pro } from '@genkit-ai/googleai';
import { CourseSchema, Course } from '../lib/schema';
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const ai = genkit({
    plugins: [googleAI({ apiKey: process.env.GEMINI_API_KEY })],
});

const SyllabusSchema = z.object({
    title: z.string(),
    description: z.string(),
    modules: z.array(z.object({
        moduleName: z.string(),
        lessons: z.array(z.object({
            title: z.string(),
            description: z.string(),
        }))
    }))
});

const LessonContentSchema = z.object({
    content: z.string(),
});

const QuizSchema = z.object({
    quiz: z.array(z.object({
        question: z.string(),
        options: z.array(z.string()).length(4),
        correctAnswer: z.number()
    }))
});

const VideoScriptSchema = z.object({
    videoScript: z.string(),
});

export const courseGeneratorFlow = ai.defineFlow({
    name: 'generateCourseChain',
    inputSchema: z.string(), // topic
    outputSchema: CourseSchema,
}, async (topic: string) => {
    // 1. Generate Syllabus
    const syllabusRes = await ai.generate({
        model: gemini15Flash,
        prompt: `Generate a comprehensive syllabus for a course on: ${topic}. It should be tailored for retail investors and students.`,
        output: { schema: SyllabusSchema }
    });
    const syllabus = syllabusRes.output;

    if (!syllabus) throw new Error("Failed to generate syllabus");

    // Prepare full course object
    const courseGen: Course = {
        title: syllabus.title,
        description: syllabus.description,
        modules: [],
    };

    // 2. Generate Lessons (Parallel)
    for (const mod of syllabus.modules) {
        const courseModule = {
            moduleName: mod.moduleName,
            lessons: [] as any[],
        };

        // Parallelize generation for each lesson in the module
        const lessonPromises = mod.lessons.map(async (lessonMeta) => {
            // Step 2: Content
            const contentRes = await ai.generate({
                model: gemini15Pro, // Pro for complex reasoning
                prompt: `Write detailed, engaging markdown lesson content for a lesson titled "${lessonMeta.title}" which covers: ${lessonMeta.description}. Part of module: ${mod.moduleName}.`,
                output: { schema: LessonContentSchema }
            });
            const content = contentRes.output?.content || "";

            // Step 3: Quizzes
            const quizRes = await ai.generate({
                model: gemini15Flash,
                prompt: `Create a 3-question multiple-choice quiz based on the following lesson content. Content: ${content}`,
                output: { schema: QuizSchema }
            });
            const quiz = quizRes.output?.quiz || [];

            // Step 4: Video Scripts
            const videoRes = await ai.generate({
                model: gemini15Flash,
                prompt: `Create a professional video script to present the following lesson content. It should be engaging and clear. Content: ${content}`,
                output: { schema: VideoScriptSchema }
            });
            const videoScript = videoRes.output?.videoScript || "";

            return {
                title: lessonMeta.title,
                content: content,
                videoScript: videoScript,
                quiz: quiz
            };
        });

        const populatedLessons = await Promise.all(lessonPromises);
        courseModule.lessons = populatedLessons;
        courseGen.modules.push(courseModule);
    }

    return courseGen;
});
