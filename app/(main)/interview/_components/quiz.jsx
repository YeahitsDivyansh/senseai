"use client"; // Indicates this component is a Client Component in Next.js

// Import necessary dependencies
import { saveQuizResult } from "@/actions/interview"; // Import function for saving quiz results
import { Button } from "@/components/ui/button"; // Import a button component
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"; // Import card components for UI structure
import { Label } from "@/components/ui/label"; // Import label component
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; // Import radio group components for answer selection
import useFetch from "@/hooks/use-fetch"; // Custom hook for handling async API calls
import { Loader2 } from "lucide-react"; // Icon for loading state
import React, { useEffect, useState, useRef } from "react"; // Import React hooks
import { BarLoader } from "react-spinners"; // Import loading indicator
import { toast } from "sonner"; // Import toast notifications
import QuizResult from "./quiz-result"; // Import QuizResult component to display results

const Quiz = () => {
  // State to track the current question index
  const [currentQuestion, setCurrentQuestion] = useState(0);

  // State to store user's answers
  const [answers, setAnswers] = useState([]);

  // State to control explanation visibility
  const [showExplanation, setShowExplanation] = useState(false);

  // State for quiz generation
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [quizData, setQuizData] = useState(null);
  const [generationStatus, setGenerationStatus] = useState(null); // PENDING, PROCESSING, COMPLETED, FAILED
  const pollingIntervalRef = useRef(null);

  // Fetch function for saving quiz results
  const {
    loading: savingResult, // Loading state while saving results
    fn: saveQuizResultFn, // Function to save quiz results
    data: resultData, // Store quiz result data
    setData: setResultData, // Function to update result data
  } = useFetch(saveQuizResult);

  // When quiz data is available, initialize the answers array
  useEffect(() => {
    if (quizData) {
      setAnswers(new Array(quizData.length).fill(null)); // Create an array with null values for each question
    }
  }, [quizData]);

  // Handle user's answer selection
  const handleAnswer = (answer) => {
    const newAnswers = [...answers]; // Create a copy of current answers
    newAnswers[currentQuestion] = answer; // Update the selected answer for the current question
    setAnswers(newAnswers); // Update the state
  };

  // Handle next question logic
  const handleNext = () => {
    if (currentQuestion < quizData.length - 1) {
      setCurrentQuestion(currentQuestion + 1); // Move to the next question
      setShowExplanation(false); // Hide explanation for the next question
    } else {
      finishQuiz(); // If it's the last question, finish the quiz
    }
  };

  // Calculate quiz score based on correct answers
  const calculateScore = () => {
    let correct = 0;
    answers.forEach((answer, index) => {
      if (answer === quizData[index].correctAnswer) {
        correct++; // Increase count if answer is correct
      }
    });
    return (correct / quizData.length) * 100; // Return score percentage
  };

  // Handle quiz completion
  const finishQuiz = async () => {
    const score = calculateScore(); // Calculate final score
    try {
      await saveQuizResultFn(quizData, answers, score); // Save quiz result
      toast.success("Quiz completed!"); // Show success message
    } catch (error) {
      toast.error(error.message || "Failed to save quiz results"); // Show error message if saving fails
    }
  };

  // Function to trigger quiz generation via background job
  const generateQuizFn = async () => {
    const startTime = Date.now();
    console.log("[Quiz Component] 🚀 Starting quiz generation request...");
    
    setGeneratingQuiz(true);
    setGenerationStatus("PENDING");
    setQuizData(null);

    try {
      // Step 1: Trigger the background job
      const fetchStart = Date.now();
      console.log("[Quiz Component] 📤 Calling /api/quiz/generate...");
      
      const response = await fetch("/api/quiz/generate", {
        method: "POST",
      });

      const fetchTime = Date.now() - fetchStart;
      console.log(`[Quiz Component] ⏱️  API call completed in ${fetchTime}ms, status: ${response.status}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to start quiz generation");
      }

      const { quizGenerationId } = await response.json();
      const totalTime = Date.now() - startTime;
      console.log(`[Quiz Component] ✅ Quiz generation started in ${totalTime}ms, ID: ${quizGenerationId}`);

      // Step 2: Start polling for status
      startPolling(quizGenerationId);
    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error(`[Quiz Component] ❌ Error after ${totalTime}ms:`, error);
      console.error("[Quiz Component] ❌ Error details:", {
        message: error.message,
        stack: error.stack,
      });
      toast.error(error.message || "Failed to start quiz generation");
      setGeneratingQuiz(false);
      setGenerationStatus(null);
    }
  };

  // Function to poll quiz generation status
  const startPolling = (quizGenerationId) => {
    console.log(`[Quiz Component] 🔄 Starting polling for quiz ${quizGenerationId}...`);
    const pollingStartTime = Date.now();
    let pollCount = 0;
    const maxPolls = 60; // Maximum 60 polls (2 minutes at 2s intervals)

    // Clear any existing polling interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Poll immediately first time
    checkQuizStatus(quizGenerationId, pollCount, pollingStartTime);
    pollCount++;

    // Then poll every 2 seconds
    pollingIntervalRef.current = setInterval(() => {
      if (pollCount >= maxPolls) {
        console.error(`[Quiz Component] ❌ Polling timeout after ${maxPolls} attempts (${(Date.now() - pollingStartTime) / 1000}s)`);
        clearInterval(pollingIntervalRef.current);
        setGeneratingQuiz(false);
        toast.error("Quiz generation is taking too long. Please try again.");
        return;
      }
      checkQuizStatus(quizGenerationId, pollCount, pollingStartTime);
      pollCount++;
    }, 2000);
  };

  // Function to check quiz generation status
  const checkQuizStatus = async (quizGenerationId, pollNumber, pollingStartTime) => {
    const checkStartTime = Date.now();
    console.log(`[Quiz Component] 🔍 Poll #${pollNumber + 1}: Checking status for quiz ${quizGenerationId}...`);

    try {
      const fetchStart = Date.now();
      const response = await fetch(
        `/api/quiz/status?quizGenerationId=${quizGenerationId}`
      );
      const fetchTime = Date.now() - fetchStart;

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Quiz Component] ❌ Status check failed (${response.status}):`, errorText);
        throw new Error(`Failed to check quiz status: ${response.status}`);
      }

      const { quizGeneration } = await response.json();
      const checkTime = Date.now() - checkStartTime;
      const elapsedTime = Date.now() - pollingStartTime;
      
      console.log(`[Quiz Component] ⏱️  Status check #${pollNumber + 1} completed in ${checkTime}ms (fetch: ${fetchTime}ms)`);
      console.log(`[Quiz Component] 📊 Current status: ${quizGeneration.status}, Elapsed: ${(elapsedTime / 1000).toFixed(1)}s`);
      
      setGenerationStatus(quizGeneration.status);

      if (quizGeneration.status === "COMPLETED") {
        // Quiz is ready!
        const totalTime = Date.now() - pollingStartTime;
        console.log(`[Quiz Component] ✅ Quiz generation completed after ${(totalTime / 1000).toFixed(2)}s (${pollNumber + 1} polls)`);
        clearInterval(pollingIntervalRef.current);
        setGeneratingQuiz(false);
        setQuizData(quizGeneration.questions);
        toast.success("Quiz generated successfully!");
      } else if (quizGeneration.status === "FAILED") {
        // Quiz generation failed
        const totalTime = Date.now() - pollingStartTime;
        console.error(`[Quiz Component] ❌ Quiz generation failed after ${(totalTime / 1000).toFixed(2)}s:`, quizGeneration.error);
        clearInterval(pollingIntervalRef.current);
        setGeneratingQuiz(false);
        toast.error(quizGeneration.error || "Failed to generate quiz");
      } else {
        // If PENDING or PROCESSING, continue polling
        console.log(`[Quiz Component] ⏳ Status is ${quizGeneration.status}, continuing to poll...`);
      }
    } catch (error) {
      const checkTime = Date.now() - checkStartTime;
      console.error(`[Quiz Component] ❌ Error checking status after ${checkTime}ms:`, error);
      console.error("[Quiz Component] ❌ Error details:", {
        message: error.message,
        pollNumber: pollNumber + 1,
      });
      // Don't stop polling on network errors, they might be temporary
    }
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Start a new quiz
  const startNewQuiz = () => {
    setCurrentQuestion(0); // Reset question index
    setAnswers([]); // Reset answers
    setShowExplanation(false); // Hide explanation
    generateQuizFn(); // Fetch a new quiz
    setResultData(null); // Reset quiz result
  };

  // Display loading indicator while quiz is being generated
  if (generatingQuiz) {
    return (
      <Card className="mx-2">
        <CardHeader>
          <CardTitle>Generating Your Quiz</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <BarLoader className="mt-4" width={"100%"} color="gray" />
          <p className="text-center text-muted-foreground">
            {generationStatus === "PENDING" && "Preparing your personalized quiz..."}
            {generationStatus === "PROCESSING" && "Generating questions with AI... This may take 15-20 seconds."}
            {!generationStatus && "Starting quiz generation..."}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Display quiz result if available
  if (resultData) {
    return (
      <div className="mx-2">
        <QuizResult result={resultData} onStartNew={startNewQuiz} />
      </div>
    );
  }

  // Initial screen before starting quiz
  if (!quizData) {
    return (
      <Card className="mx-2">
        <CardHeader>
          <CardTitle>Ready to test your knowledge</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This quiz contains 10 questions specific to your industry and
            skills. Take your time and choose the best answer for each question.
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={generateQuizFn} className="w-full">
            Start Quiz
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Get current question data
  const question = quizData[currentQuestion];

  return (
    <Card className="mx-2">
      <CardHeader>
        <CardTitle>
          Question {currentQuestion + 1} of {quizData.length}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-lg font-medium">{question.question}</p>
        <RadioGroup
          onValueChange={handleAnswer}
          value={answers[currentQuestion]}
          className="space-y-2"
        >
          {question.options.map((option, index) => {
            return (
              <div className="flex items-center space-x-2" key={index}>
                <RadioGroupItem value={option} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`}>{option}</Label>
              </div>
            );
          })}
        </RadioGroup>

        {showExplanation && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="font-medium">Explanation:</p>
            <p className="text-muted-foreground">{question.explanation}</p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        {!showExplanation && (
          <Button
            onClick={() => setShowExplanation(true)}
            variant="outline"
            disabled={!answers[currentQuestion]}
          >
            Show Explanation
          </Button>
        )}

        <Button
          onClick={handleNext}
          disabled={!answers[currentQuestion] || savingResult}
          className="ml-auto"
        >
          {savingResult && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {currentQuestion < quizData.length - 1
            ? "Next Question"
            : "Finish Quiz"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default Quiz;
