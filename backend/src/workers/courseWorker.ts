import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { courseGeneratorFlow } from '../services/aiService';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
export const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });

// Create a queue for course generation jobs
export const courseQueue = new Queue('CourseGenerationQueue', { connection });

// Initialize the worker that processes the jobs
export const courseWorker = new Worker(
    'CourseGenerationQueue',
    async (job) => {
        console.log(`Processing job ${job.id} for topic: ${job.data.topic}`);
        try {
            // Execute the AI Flow
            const course = await courseGeneratorFlow(job.data.topic);
            console.log(`Job ${job.id} completed successfully`);
            return course;
        } catch (error) {
            console.error(`Error processing job ${job.id}:`, error);
            throw error;
        }
    },
    { connection }
);

courseWorker.on('completed', (job) => {
    console.log(`Worker: Job ${job.id} has completed!`);
});

courseWorker.on('failed', (job, err) => {
    console.log(`Worker: Job ${job?.id} has failed with ${err.message}`);
});
