import { Router } from 'express';
import { courseQueue } from '../workers/courseWorker';
import { QueueEvents } from 'bullmq';
import { connection } from '../workers/courseWorker';

const router = Router();
const queueEvents = new QueueEvents('CourseGenerationQueue', { connection });

router.post('/generate-course', async (req: any, res: any) => {
    try {
        const { topic } = req.body;
        if (!topic) {
            return res.status(400).json({ error: 'Topic is required' });
        }

        // Add job to Queue
        const job = await courseQueue.add('generate-course', { topic });

        // Send immediate response
        res.json({ message: 'Course generation started', jobId: job.id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/status/:jobId', async (req: any, res: any) => {
    try {
        const { jobId } = req.params;
        const job = await courseQueue.getJob(jobId);

        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        const state = await job.getState();
        const result = job.returnvalue;
        const progress = job.progress;

        res.json({ id: job.id, state, progress, result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
