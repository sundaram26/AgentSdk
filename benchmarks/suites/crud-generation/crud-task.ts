import { z } from 'zod';

export const CRUD_TASK_PROMPT = `Given the following Zod User schema:

const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(['admin', 'user']),
});

Generate a complete JSON array containing 4 REST API route definitions handling GET /users, GET /users/:id, POST /users, and DELETE /users/:id.
Each route object must have "method", "path", "description", and "handlerLogic" fields.`;

export interface RouteDefinition {
    method: 'GET' | 'POST' | 'DELETE' | 'PUT';
    path: string;
    description: string;
    handlerLogic: string;
}

export function validateCrudOutput(output: string): { valid: boolean; score: number; errors: string[] } {
    const errors: string[] = [];

    // 1. Check for JSON structure
    const jsonMatch = output.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
        return { valid: false, score: 0, errors: ['Output does not contain a JSON array of route definitions.'] };
    }

    try {
        const routes = JSON.parse(jsonMatch[0]) as RouteDefinition[];
        if (!Array.isArray(routes) || routes.length < 4) {
            errors.push(`Expected at least 4 route definitions, found ${Array.isArray(routes) ? routes.length : 0}.`);
        }

        const requiredMethods = ['GET', 'POST', 'DELETE'];
        const foundMethods = new Set(routes.map(r => r.method?.toUpperCase()));
        for (const req of requiredMethods) {
            if (!foundMethods.has(req)) {
                errors.push(`Missing required HTTP method '${req}'.`);
            }
        }

        for (const route of routes) {
            if (!route.method || !route.path || !route.description || !route.handlerLogic) {
                errors.push(`Route '${route.path || 'unknown'}' missing required fields (method, path, description, handlerLogic).`);
            }
        }

        const score = Math.max(0, 100 - errors.length * 20);
        return { valid: errors.length === 0, score, errors };
    } catch (err) {
        return { valid: false, score: 0, errors: [`JSON parsing error: ${(err as Error).message}`] };
    }
}
