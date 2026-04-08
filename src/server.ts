import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (_req, res) => {
    res.json({
        success: true,
        message: 'CoreHR Backend API is running'
    });
});

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
     console.log(`Server running on http://localhost:${PORT}`);
})