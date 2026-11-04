import { Router } from 'express';
import { createTask, deleteTask, listTasks, updateTaskStatus } from '../controllers/taskController';

export const taskRouter = Router();

taskRouter.post('/', createTask);
taskRouter.get('/', listTasks);
taskRouter.patch('/:id', updateTaskStatus);
taskRouter.delete('/:id', deleteTask);
