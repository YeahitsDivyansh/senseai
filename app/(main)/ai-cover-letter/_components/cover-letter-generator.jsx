"use client"; // Ensures this component runs on the client side

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod"; // Integrates Zod for form validation
import { toast } from "sonner"; // Provides toast notifications
import { Loader2 } from "lucide-react"; // Loading spinner icon
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { generateCoverLetter } from "@/actions/cover-letter"; // API function to generate cover letter
import useFetch from "@/hooks/use-fetch"; // Custom hook for handling async requests
import { coverLetterSchema } from "@/app/lib/schema"; // Validation schema for the form
import { useEffect } from "react";
import { useRouter } from "next/navigation"; // For programmatic navigation

export default function CoverLetterGenerator() {
  const router = useRouter(); // Next.js router instance

  // Setting up form handling with validation
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset, // Reset function to clear form fields
  } = useForm({
    resolver: zodResolver(coverLetterSchema), // Applying validation schema
  });

  // Custom hook for API request and state management
  const {
    loading: generating, // Loading state while generating the cover letter
    fn: generateLetterFn, // Function to trigger API call
    data: generatedLetter, // Response data from API
  } = useFetch(generateCoverLetter);

  // Effect to handle successful letter generation
  useEffect(() => {
    if (generatedLetter) {
      toast.success("Cover letter generated successfully!"); // Show success message
      router.push(`/ai-cover-letter/${generatedLetter.id}`); // Navigate to generated cover letter page
      reset(); // Clear the form after successful generation
    }
  }, [generatedLetter]);

  // Function to handle form submission
  const onSubmit = async (data) => {
    try {
      await generateLetterFn(data); // Trigger API call
    } catch (error) {
      toast.error(error.message || "Failed to generate cover letter"); // Show error message if request fails
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
          <CardDescription>
            Provide information about the position you're applying for
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Grid layout for form fields */}
            <div className="grid grid-cols-2 gap-4">
              {/* Company Name Field */}
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  placeholder="Enter company name"
                  {...register("companyName")}
                />
                {errors.companyName && (
                  <p className="text-sm text-red-500">
                    {errors.companyName.message}
                  </p>
                )}
              </div>

              {/* Job Title Field */}
              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input
                  id="jobTitle"
                  placeholder="Enter job title"
                  {...register("jobTitle")}
                />
                {errors.jobTitle && (
                  <p className="text-sm text-red-500">
                    {errors.jobTitle.message}
                  </p>
                )}
              </div>
            </div>

            {/* Job Description Field */}
            <div className="space-y-2">
              <Label htmlFor="jobDescription">Job Description</Label>
              <Textarea
                id="jobDescription"
                placeholder="Paste the job description here"
                className="h-32"
                {...register("jobDescription")}
              />
              {errors.jobDescription && (
                <p className="text-sm text-red-500">
                  {errors.jobDescription.message}
                </p>
              )}
            </div>

            {/* Submit Button with loading state */}
            <div className="flex justify-end">
              <Button type="submit" disabled={generating}>
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Cover Letter"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
