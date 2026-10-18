
import { z } from "zod";

export const WeatherSchema = z.object({
    city: z.string().trim().min(1).max(100),
});

export const QuerySchema = z.object({
    table: z.enum(["students"]),
    limit: z.number().int().min(1).max(100).optional(),
});

export async function fetchWeather(
    args: z.infer<typeof WeatherSchema>,
) {
    // Mock data for learning; this is not live weather.
    return {
        city: args.city,
        temperatureC: 25,
        condition: "Sunny",
        source: "mock",
    };
}

export async function queryDatabase(
    args: z.infer<typeof QuerySchema>,
) {
    // Mock data for learning; this is not a real database.
    const students = [
        { id: 1, name: "Ali" },
        { id: 2, name: "Sara" },
        { id: 3, name: "Ahmed" },
    ];

    return {
        table: args.table,
        count: students.length,
        students: students.slice(0, args.limit ?? 10),
        source: "mock",
    };
}
