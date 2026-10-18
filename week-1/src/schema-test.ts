import { InvoiceSchema } from "./invoice-schema";

const tests = [
    {
        name: "Valid invoice",
        input: {
            invoiceNumber: "INV-104",
            customerName: "Ali Khan",
            total: 5000,
            currency: "PKR",
        },
        expected: true,
    },
    {
        name: "Missing customer name",
        input: {
            invoiceNumber: "INV-104",
            total: 5000,
            currency: "PKR",
        },
        expected: false,
    },
    {
        name: "Total is a string",
        input: {
            invoiceNumber: "INV-104",
            customerName: "Ali Khan",
            total: "5000",
            currency: "PKR",
        },
        expected: false,
    },
    {
        name: "Unsupported currency",
        input: {
            invoiceNumber: "INV-104",
            customerName: "Ali Khan",
            total: 5000,
            currency: "GBP",
        },
        expected: false,
    },
    {
        name: "Empty customer name",
        input: {
            invoiceNumber: "INV-105",
            customerName: "",
            total: 5000,
            currency: "PKR",
        },
        expected: false,
    },
    {
        name: "Negative total",
        input: {
            invoiceNumber: "INV-106",
            customerName: "Ali Khan",
            total: -500,
            currency: "PKR",
        },
        expected: false,
    },
];

for (const test of tests) {
    const result = InvoiceSchema.safeParse(test.input);
    const passed = result.success === test.expected;

    console.log(`${passed ? "PASS" : "FAIL"}: ${test.name}`);

    if (!passed && !result.success) {
        console.log(result.error.issues);
    }
}