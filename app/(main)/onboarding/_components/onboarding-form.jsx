"use client"; // Ensures this component runs on the client-side in Next.js

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { onboardingSchema } from "@/app/lib/schema";
import { useRouter } from "next/navigation";

// Import UI components from the project's component library
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

// Custom hook for handling API requests
import useFetch from "@/hooks/use-fetch";
import { updateUser } from "@/actions/user";
import { toast } from "sonner"; // Notification library for success/error messages
import { Loader2 } from "lucide-react"; // Loading spinner icon

// Component for onboarding form
const OnboardingForm = ({ industries }) => {
  // State to track the selected industry
  const [selectedIndustry, setSelectedIndustry] = useState(null);

  // Next.js router for navigation
  const router = useRouter();

  // Custom hook for handling API request to update user profile
  const {
    loading: updateLoading, // Boolean to indicate if the API request is in progress
    fn: updateUserFn, // Function to trigger the update request
    data: updateResult, // Response data from the update request
  } = useFetch(updateUser);

  // React Hook Form setup with validation schema
  const {
    register, // Function to register form fields for validation
    handleSubmit, // Function to handle form submission
    formState: { errors }, // Object containing validation errors
    setValue, // Function to programmatically update form field values
    watch, // Function to track changes to specific form fields
  } = useForm({
    resolver: zodResolver(onboardingSchema), // Uses Zod schema for validation
  });

  // Function triggered when the form is submitted
  const onSubmit = async (values) => {
    try {
      // Formats the industry and sub-industry into a structured format
      const formattedIndustry = `${values.industry}-${values.subIndustry
        .toLowerCase()
        .replace(/ /g, "-")}`; // Converts spaces to hyphens for consistency

      // Calls API to update the user profile with form values
      await updateUserFn({
        ...values,
        industry: formattedIndustry,
      });
    } catch (error) {
      console.error("Onboarding error:", error); // Logs any error that occurs during form submission
    }
  };

  // Effect that runs whenever `updateResult` or `updateLoading` changes
  useEffect(() => {
    if (updateResult?.success && !updateLoading) {
      toast.success("Profile completed successfully!"); // Displays success message
      router.push("/dashboard"); // Redirects user to dashboard after successful form submission
      router.refresh(); // Refreshes the page to reflect new data
    }
  }, [updateResult, updateLoading]); // Dependencies that trigger this effect

  // Watches the selected industry field to determine when to display specialization options
  const watchIndustry = watch("industry");

  return (
    <div className="flex items-center justify-center bg-background">
      {/* Centered card container for the onboarding form */}
      <Card className="w-full max-w-lg mt-10 mx-2">
        <CardHeader>
          <CardTitle className="gradient-title text-4xl">
            Complete Your Profile
          </CardTitle>
          <CardDescription>
            Select your industry to get personalized career insights and
            recommendations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Form element with onSubmit handler */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Industry Selection */}
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Select
                onValueChange={(value) => {
                  setValue("industry", value); // Updates the selected industry in the form state
                  setSelectedIndustry(
                    industries.find((ind) => ind.id === value)
                  ); // Finds and sets the selected industry object
                  setValue("subIndustry", ""); // Resets the sub-industry selection when industry changes
                }}
              >
                <SelectTrigger id="industry">
                  <SelectValue placeholder="Select an Industry" />
                </SelectTrigger>
                <SelectContent>
                  {/* Renders industry options dynamically */}
                  {industries.map((ind) => {
                    return (
                      <SelectItem value={ind.id} key={ind.id}>
                        {ind.name}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {/* Displays validation error message for industry field */}
              {errors.industry && (
                <p className="text-sm text-red-500">
                  {errors.industry.message}
                </p>
              )}
            </div>

            {/* Specialization (Sub-Industry) Selection - Only displayed if an industry is selected */}
            {watchIndustry && (
              <div className="space-y-2">
                <Label htmlFor="subIndustry">Specialization</Label>
                <Select
                  onValueChange={(value) => setValue("subIndustry", value)} // Updates the selected sub-industry
                >
                  <SelectTrigger id="subIndustry">
                    <SelectValue placeholder="Select an Industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Renders sub-industries dynamically based on the selected industry */}
                    {selectedIndustry?.subIndustries.map((sub) => (
                      <SelectItem key={sub} value={sub}>
                        {sub}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Displays validation error message for sub-industry field */}
                {errors.subIndustry && (
                  <p className="text-sm text-red-500">
                    {errors.subIndustry.message}
                  </p>
                )}
              </div>
            )}

            {/* Years of Experience Input */}
            <div className="space-y-2">
              <Label htmlFor="experience">Years of Experience</Label>
              <Input
                id="experience"
                type="number"
                min="0"
                max="50"
                placeholder="Enter your years of experience"
                {...register("experience")}
              />
              {errors.experience && (
                <p className="text-sm text-red-500">
                  {errors.experience.message}
                </p>
              )}
            </div>

            {/* Skills Input */}
            <div className="space-y-2">
              <Label htmlFor="skills">Skills</Label>
              <Input
                id="skills"
                placeholder="e.g., Python, JavaScript, Project Management"
                {...register("skills")}
              />
              <p className="text-sm text-muted-foreground">
                Separate multiple skills with commas
              </p>
              {errors.skills && (
                <p className="text-sm text-red-500">{errors.skills.message}</p>
              )}
            </div>

            {/* Professional Bio Textarea */}
            <div className="space-y-2">
              <Label htmlFor="bio">Professional Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about your professional background..."
                className="h-32"
                {...register("bio")}
              />
              {errors.bio && (
                <p className="text-sm text-red-500">{errors.bio.message}</p>
              )}
            </div>

            {/* Submit Button - Displays loading spinner when API request is in progress */}
            <Button type="submit" className="w-full" disabled={updateLoading}>
              {updateLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Complete Profile"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingForm;
