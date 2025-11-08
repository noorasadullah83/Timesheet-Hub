import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { TimesheetEntry, User, Project } from '../types';

export interface CostEstimatorData {
    numUsers: string;
    entriesPerUser: string;
    summaryGenerations: string;
    cloudProvider: string;
    databaseType: string;
    redundancy: string;
}

export interface InsightResult {
    text: string;
    sources: { uri: string; title: string }[];
}

export const getProjectManagementInsights = async (prompt: string): Promise<InsightResult> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `As a project management expert, answer the following question based on the latest information from the web: "${prompt}"`,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        const text = response.text;
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        
        const sources = groundingChunks
            .map((chunk: any) => chunk.web)
            // FIX: Add a type guard to correctly infer the type of `web` for the subsequent `.map` call.
            .filter((web: any): web is { uri: string; title?: string } => web && web.uri)
            .map((web) => ({ uri: web.uri, title: web.title || web.uri }));
        
        const uniqueSources = Array.from(new Map(sources.map(item => [item.uri, item])).values());

        return { text, sources: uniqueSources };
    } catch (error) {
        console.error("Error calling Gemini API with Search Grounding:", error);
        return {
            text: "An error occurred while fetching insights. Please check the console for details.",
            sources: [],
        };
    }
};


export const getDeploymentCostEstimation = async (data: CostEstimatorData): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
        You are a Google Cloud cost estimation expert. Based on the following parameters for a web application, provide a monthly cost estimate.

        Application Details:
        - A simple CRUD timesheet application with user authentication.
        - Frontend: React (static hosting)
        - Backend: A simple Node.js API (serverless functions or small container)
        - Database: Storing user data, timesheet entries, projects.
        - AI Integration: Uses a large language model for occasional summaries.

        Parameters:
        - Number of Users: ${data.numUsers}
        - Average Daily Timesheet Entries per User: ${data.entriesPerUser}
        - Expected AI Summary Generations per month: ${data.summaryGenerations}
        - Cloud Provider: ${data.cloudProvider} (Focus on GCP services if GCP is selected)
        - Database Type: ${data.databaseType}
        - Redundancy Level: ${data.redundancy}

        Please provide a cost breakdown in markdown format, focusing on a GCP stack:
        1.  **Frontend Hosting:** (e.g., Firebase Hosting or Google Cloud Storage with Cloud CDN)
        2.  **Backend Compute:** (e.g., Google Cloud Run or Cloud Functions)
        3.  **Database:** (e.g., Google Cloud SQL or Firestore)
        4.  **AI API Usage:** (Estimate for Gemini API calls)
        5.  **Data Transfer/Egress:** (A rough estimate)
        
        Conclude with a **Total Estimated Monthly Cost**.

        Keep the explanation concise and clear for a non-technical user. Assume standard, cost-effective service tiers on GCP.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API for cost estimation:", error);
        return "An error occurred while generating the cost estimate. Please check the console for details.";
    }
};


export const generateTimesheetSummary = async (
    entries: TimesheetEntry[],
    users: User[],
    projects: Project[]
): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const userMap = new Map(users.map(u => [u.id, u.name]));
    const projectMap = new Map(projects.map(p => [p.id, p.name]));

    const simplifiedEntries = entries.map(entry => ({
        employee: userMap.get(entry.userId) || 'Unknown User',
        date: entry.date,
        project: entry.projectId ? projectMap.get(entry.projectId) : 'N/A',
        activity: entry.activity,
        hours: entry.hours,
        status: entry.status
    }));

    const prompt = `
        You are an expert project management analyst. Based on the following timesheet data in JSON format, provide a concise and insightful summary for an administrator.

        The summary should include:
        1.  Total hours logged.
        2.  A breakdown of hours by project.
        3.  A breakdown of hours by status (Pending, Approved, Rejected).
        4.  Any potential insights, such as employees with high rejected hours, projects consuming the most effort, or significant idle time.
        
        Use markdown for formatting.

        Data:
        ${JSON.stringify(simplifiedEntries, null, 2)}
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return "An error occurred while generating the summary. Please check the console for details.";
    }
};