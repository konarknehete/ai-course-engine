import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import courseRoutes from './routes/courseRoutes';
import './workers/courseWorker'; // initializing worker

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/courses', courseRoutes);

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
