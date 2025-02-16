import { z } from "zod";

// Schema for onboarding form data
export const onboardingSchema = z.object({
  // Industry field (required)
  industry: z.string({
    required_error: "Please select an industry",
  }),

  // Sub-industry or specialization (required)
  subIndustry: z.string({
    required_error: "Please select a specialization",
  }),

  // Optional biography with a maximum length of 500 characters
  bio: z.string().max(500).optional(),

  // Experience in years, converted from a string to an integer
  experience: z
    .string()
    .transform((val) => parseInt(val, 10)) // Convert input to an integer
    .pipe(
      z
        .number()
        .min(0, "Experience must be at least 0 years") // Minimum value of 0
        .max(50, "Experience cannot exceed 50 years") // Maximum value of 50
    ),

  // Skills field, converts a comma-separated string into an array of trimmed skill names
  skills: z.string().transform((val) =>
    val
      ? val
          .split(",")
          .map((skill) => skill.trim()) // Trim whitespace from each skill
          .filter(Boolean) // Remove empty values
      : undefined
  ),
});

// Schema for contact information
export const contactSchema = z.object({
  // Email field (required with validation)
  email: z.string().email("Invalid email address"),

  // Optional mobile number
  mobile: z.string().optional(),

  // Optional LinkedIn profile URL
  linkedin: z.string().optional(),

  // Optional Twitter profile URL
  twitter: z.string().optional(),
});

// Schema for experience, education, and projects entries
export const entrySchema = z
  .object({
    // Title of the experience/project/education (required)
    title: z.string().min(1, "Title is required"),

    // Organization associated with the entry (required)
    organization: z.string().min(1, "Organization is required"),

    // Start date (required)
    startDate: z.string().min(1, "Start date is required"),

    // Optional end date
    endDate: z.string().optional(),

    // Description of the role, project, or education (required)
    description: z.string().min(1, "Description is required"),

    // Boolean flag to indicate if the entry is a current position (default: false)
    current: z.boolean().default(false),
  })
  .refine(
    (data) => {
      // If the entry is not current, an end date must be provided
      if (!data.current && !data.endDate) {
        return false;
      }
      return true;
    },
    {
      message: "End date is required unless this is your current position",
      path: ["endDate"],
    }
  );

// Schema for a complete resume
export const resumeSchema = z.object({
  // Contact information (validated by contactSchema)
  contactInfo: contactSchema,

  // Professional summary (required)
  summary: z.string().min(1, "Professional summary is required"),

  // Skills field (required)
  skills: z.string().min(1, "Skills are required"),

  // Work experience entries (array of entrySchema objects)
  experience: z.array(entrySchema),

  // Education entries (array of entrySchema objects)
  education: z.array(entrySchema),

  // Project entries (array of entrySchema objects)
  projects: z.array(entrySchema),
});
