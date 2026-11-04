import type { Request, Response } from 'express';
import { HttpError } from '../middleware/errorHandler';
import { Task } from '../models/Task';
import {
  createTaskSchema,
  listTasksQuerySchema,
  taskIdParamsSchema,
  updateStatusSchema,
} from '../validators/taskValidator';

export async function createTask(req: Request, res: Response): Promise<void> {
  const input = createTaskSchema.parse(req.body);
  const task = await Task.create(input);
  res.status(201).json(task);
}

export async function listTasks(req: Request, res: Response): Promise<void> {
  const { status } = listTasksQuerySchema.parse(req.query);
  const tasks = await Task.find(status ? { status } : {}).sort({ createdAt: -1, _id: -1 });
  res.json(tasks);
}

export async function updateTaskStatus(req: Request, res: Response): Promise<void> {
  const { id } = taskIdParamsSchema.parse(req.params);
  const { status } = updateStatusSchema.parse(req.body);

  const task = await Task.findByIdAndUpdate(id, { status }, { returnDocument: 'after', runValidators: true });
  if (!task) throw new HttpError(404, 'Task not found');

  res.json(task);
}

export async function deleteTask(req: Request, res: Response): Promise<void> {
  const { id } = taskIdParamsSchema.parse(req.params);

  const task = await Task.findByIdAndDelete(id);
  if (!task) throw new HttpError(404, 'Task not found');

  res.status(204).end();
}
