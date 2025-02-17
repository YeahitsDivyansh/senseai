"use client"; // Ensures the component runs on the client side

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format } from "date-fns"; // Library for formatting dates
import React, { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"; // Recharts library for rendering the performance chart

// Component to display a performance trend chart based on quiz assessments
const PerformanceChart = ({ assessments }) => {
  // State to store formatted chart data
  const [chartData, setChartData] = useState([]);

  // useEffect hook to format assessment data when assessments change
  useEffect(() => {
    if (assessments) {
      const formattedData = assessments.map((assessment) => ({
        date: format(new Date(assessment.createdAt), "MMM dd"), // Formats date to "MMM dd" (e.g., "Feb 14")
        score: assessment.quizScore, // Stores the quiz score for plotting
      }));
      setChartData(formattedData); // Updates the state with formatted data
    }
  }, [assessments]); // Runs whenever the assessments prop changes

  return (
    <div>
      {/* Card container for the performance chart */}
      <Card>
        <CardHeader>
          {/* Title of the performance chart */}
          <CardTitle className="gradient-title text-3xl md:text-4xl">
            Performance Trend
          </CardTitle>
          {/* Description of the chart */}
          <CardDescription>Your quiz scores over time</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Container for the chart with a fixed height */}
          <div className="h-[300px]">
            {/* Makes the chart responsive to container size */}
            <ResponsiveContainer width="100%" height="100%">
              {/* Line chart to visualize quiz scores */}
              <LineChart data={chartData}>
                {/* Adds a grid with dashed lines for better readability */}
                <CartesianGrid strokeDasharray="3 3" />
                {/* X-axis displaying formatted dates */}
                <XAxis dataKey="date" />
                {/* Y-axis displaying scores, ranging from 0 to 100 */}
                <YAxis domain={[0, 100]} />
                {/* Tooltip to display score details on hover */}
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload?.length) {
                      return (
                        <div className="bg-background border rounded-lg p-2 shadow-md">
                          {/* Displays the score in the tooltip */}
                          <p className="text-sm font-medium">
                            Score: {payload[0].value}%
                          </p>
                          {/* Displays the date of the assessment */}
                          <p className="text-xs text-muted-foreground">
                            {payload[0].payload.date}
                          </p>
                        </div>
                      );
                    }
                    return null; // Returns nothing if no tooltip data is available
                  }}
                />
                {/* Line representation of performance trend */}
                <Line
                  type="monotone" // Smooth curve for better visualization
                  dataKey="score" // Uses score data for the Y-axis
                  stroke="hsl(var(--primary))" // Uses the primary theme color for the line
                  strokeWidth={2} // Sets the thickness of the line
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceChart; // Exports the component for use elsewhere
