"use client";
import { improveWithAI } from "@/actions/resume";
import { entrySchema } from "@/app/lib/schema";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import useFetch from "@/hooks/use-fetch";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parse } from "date-fns";
import { Loader2, PlusCircle, Sparkles, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

// Helper function to format the date for display
const formatDisplayDate = (dateString) => {
  if (!dateString) return "";
  const date = parse(dateString, "yyyy-MM", new Date());
  return format(date, "MMM yyyy");
};

// EntryForm component for adding and managing entries (e.g., experience, education, projects)
const EntryForm = ({ type, entries, onChange }) => {
  const [isAdding, setIsAdding] = useState(false); // State to manage the form visibility

  // React Hook Form setup for form management and validation
  const {
    register,
    handleSubmit: handleValidation,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(entrySchema), // Use Zod for schema validation
    defaultValues: {
      title: "",
      organization: "",
      startDate: "",
      endDate: "",
      description: "",
      current: false, // Checkbox for current position
    },
  });

  const current = watch("current"); // Watch the 'current' field to conditionally disable the end date

  // Custom hook to handle AI-based description improvement
  const {
    loading: isImproving,
    fn: improveWithAIFn,
    data: improvedContent,
    error: improveError,
  } = useFetch(improveWithAI);

  // Function to handle adding a new entry
  const handleAdd = handleValidation((data) => {
    const formattedEntry = {
      ...data,
      startDate: formatDisplayDate(data.startDate), // Format start date
      endDate: data.current ? "" : formatDisplayDate(data.endDate), // Format end date if not current
    };

    onChange([...entries, formattedEntry]); // Update the entries list
    reset(); // Reset the form
    setIsAdding(false); // Close the form
  });

  // Function to handle deleting an entry
  const handleDelete = (index) => {
    const newEntries = entries.filter((_, i) => i !== index); // Filter out the entry to delete
    onChange(newEntries); // Update the entries list
  };

  // Effect to handle the result of the AI-based description improvement
  useEffect(() => {
    if (improvedContent && !isImproving) {
      setValue("description", improvedContent); // Update the description field with the improved content
      toast.success("Description improved successfully!"); // Show success toast
    }
    if (improveError) {
      toast.error(improveError.message || "Failed to improve description"); // Show error toast
    }
  }, [improvedContent, improveError, isImproving, setValue]);

  // Function to trigger AI-based description improvement
  const handleImproveDescription = async () => {
    const description = watch("description");
    if (!description) {
      toast.error("Please enter a description first"); // Show error if description is empty
      return;
    }

    await improveWithAIFn({
      current: description,
      type: type.toLowerCase(), // Pass the type (e.g., 'experience', 'education', 'project')
    });
  };

  return (
    <div className="space-y-4">
      {/* Render all existing entries */}
      <div className="space-y-4">
        {entries.map((item, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {item.title} @ {item.organization}{" "}
                {/* Display title and organization */}
              </CardTitle>
              <Button
                variant="outline"
                size="icon"
                type="button"
                onClick={() => handleDelete(index)} // Delete button
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {item.current
                  ? `${item.startDate} - Present` // Display current position
                  : `${item.startDate} - ${item.endDate}`}{" "}
                {/* Display date range */}
              </p>
              <p className="mt-2 text-sm whitespace-pre-wrap">
                {item.description} {/* Display description */}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Form for adding a new entry */}
      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle>Add {type}</CardTitle> {/* Form title */}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Input
                  placeholder="Title/Position"
                  {...register("title")} // Register title field
                  error={errors.title} // Show error if validation fails
                />
                {errors.title && (
                  <p className="text-sm text-red-500">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Input
                  placeholder="Organization/Company"
                  {...register("organization")} // Register organization field
                  error={errors.organization} // Show error if validation fails
                />
                {errors.organization && (
                  <p className="text-sm text-red-500">
                    {errors.organization.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Input
                  type="month"
                  {...register("startDate")} // Register start date field
                  error={errors.startDate} // Show error if validation fails
                />
                {errors.startDate && (
                  <p className="text-sm text-red-500">
                    {errors.startDate.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Input
                  type="month"
                  {...register("endDate")} // Register end date field
                  disabled={current} // Disable end date if current position is checked
                  error={errors.endDate} // Show error if validation fails
                />
                {errors.endDate && (
                  <p className="text-sm text-red-500">
                    {errors.endDate.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="current"
                {...register("current")} // Register current checkbox
                onChange={(e) => {
                  setValue("current", e.target.checked);
                  if (e.target.checked) {
                    setValue("endDate", ""); // Clear end date if current is checked
                  }
                }}
              />
              <label htmlFor="current">Current {type}</label>{" "}
              {/* Label for checkbox */}
            </div>

            <div className="space-y-2">
              <Textarea
                placeholder={`Description of your ${type.toLowerCase()}`}
                className="h-32"
                {...register("description")} // Register description field
                error={errors.description} // Show error if validation fails
              />
              {errors.description && (
                <p className="text-sm text-red-500">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Button to trigger AI-based description improvement */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleImproveDescription}
              disabled={isImproving || !watch("description")} // Disable if improving or no description
            >
              {isImproving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Improving...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Improve with AI
                </>
              )}
            </Button>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset(); // Reset form
                setIsAdding(false); // Close form
              }}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleAdd}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Entry
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Button to show the form for adding a new entry */}
      {!isAdding && (
        <Button
          className="w-full"
          variant="outline"
          onClick={() => setIsAdding(true)}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Add {type}
        </Button>
      )}
    </div>
  );
};

export default EntryForm;
