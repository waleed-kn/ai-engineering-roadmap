import { z } from "zod";

export const InvoiceSchema = z.object({
    invoiceNumber: z.string(),
    customerName: z.string(),
    total: z.number(),
    currency: z.enum(["PKR", "USD", "EUR"]),
});