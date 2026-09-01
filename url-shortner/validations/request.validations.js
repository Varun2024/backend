import {z} from "zod";

export const signupPostRequestBodySchema = z.object({
    firstname: z.string().min(1, { message: "First name is required" }),
    lastname: z.string().optional(),
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters long" }),
})

export const loginPostRequestBodySchema = z.object({
    email:z.string().email(),
    password:z.string().min(6)
})

export const shortenPostRequestBodySchema = z.object({
    url:z.string().url({message:"Invalid URL format"}),
    code:z.string().optional()
})