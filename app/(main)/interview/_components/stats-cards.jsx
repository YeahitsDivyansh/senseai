import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Trophy } from "lucide-react";
import React from "react";

const StatsCards = ({ assessments }) => {
  // Function to calculate the average quiz score
  const getAverageScore = () => {
    if (!assessments?.length) return 0; // Return 0 if no assessments are available
    const total = assessments.reduce(
      (sum, assessment) => sum + assessment.quizScore,
      0
    );
    return (total / assessments.length).toFixed(1); // Return average score with one decimal place
  };

  // Function to get the most recent assessment
  const getLatestAssessment = () => {
    if (!assessments?.length) return null; // Return null if no assessments are available
    return assessments[0]; // Assuming the latest assessment is the first in the array
  };

  // Function to get the total number of questions practiced
  const getTotalQuestions = () => {
    if (!assessments?.length) return 0; // Return 0 if no assessments are available
    return assessments.reduce(
      (sum, assessment) => sum + assessment.questions.length,
      0
    );
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Card for displaying the average quiz score */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Score</CardTitle>
          <Trophy className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{getAverageScore()}%</div>
          <p className="text-xs text-muted-foreground">
            Across all assessments
          </p>
        </CardContent>
      </Card>

      {/* Card for displaying the total number of questions practiced */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Questions Practiced
          </CardTitle>
          <Brain className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{getTotalQuestions()}</div>
          <p className="text-xs text-muted-foreground">Total questions</p>
        </CardContent>
      </Card>

      {/* Card for displaying the most recent quiz score */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Latest Score</CardTitle>
          <Trophy className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {getLatestAssessment()?.quizScore.toFixed(1) || 0}%
          </div>
          <p className="text-xs text-muted-foreground">Most recent quiz</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsCards;
