"use client"; // Ensures this component runs on the client side

import { Button } from "@/components/ui/button"; // Button component from the UI library
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"; // UI components for displaying quizzes
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"; // Modal dialog components from UI library
import { format } from "date-fns"; // Utility for formatting dates
import { useRouter } from "next/navigation"; // Next.js router for navigation
import React, { useState } from "react";
import QuizResult from "./quiz-result"; // Component to display detailed quiz results

// Component to list and manage quiz assessments
const QuizList = ({ assessments }) => {
  const router = useRouter(); // Hook to manage navigation
  const [selectedQuiz, setSelectedQuiz] = useState(null); // State to track the selected quiz for detailed view

  return (
    <>
      {/* Card container for listing recent quizzes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            {/* Title of the recent quizzes section */}
            <CardTitle className="gradient-title text-3xl md:text-4xl">
              Recent Quizzes
            </CardTitle>
            {/* Description for user guidance */}
            <CardDescription>Review your past quiz performance</CardDescription>
          </div>

          {/* Button to start a new quiz */}
          <Button onClick={() => router.push("/interview/mock")}>
            Start New Quiz
          </Button>
        </CardHeader>
        <CardContent>
          {/* List of past quizzes */}
          <div className="space-y-4">
            {assessments.map((assessment, i) => {
              return (
                <Card
                  key={assessment.id} // Unique key for React's reconciliation
                  onClick={() => setSelectedQuiz(assessment)} // Opens detailed view when clicked
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <CardHeader>
                    {/* Quiz title with an index */}
                    <CardTitle>Quiz {i + 1}</CardTitle>
                    {/* Displays quiz score and formatted date */}
                    <CardDescription className="flex justify-between w-full">
                      <div>Score: {assessment.quizScore.toFixed(1)}%</div>
                      <div>
                        {format(
                          new Date(assessment.createdAt),
                          "MMMM dd, yyyy HH:mm"
                        )}
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Displays improvement tips for the quiz */}
                    <p className="text-sm text-muted-foreground">
                      {assessment.improvementTip}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Dialog (modal) for displaying detailed quiz results */}
      <Dialog open={!!selectedQuiz} onOpenChange={() => setSelectedQuiz(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle></DialogTitle>{" "}
            {/* Necessary for the dialog to work properly in ShadCN UI */}
          </DialogHeader>
          {/* Renders detailed quiz result inside the dialog */}
          <QuizResult
            result={selectedQuiz}
            hideStartNew // Hides the "Start New" button inside quiz results
            onStartNew={() => router.push("/interview/mock")} // Redirects user to start a new quiz
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default QuizList; // Exports the component for use elsewhere
