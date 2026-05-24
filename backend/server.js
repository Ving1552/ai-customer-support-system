import express from "express";
import cors from "cors";
import fs from "fs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import { createClient } from '@supabase/supabase-js';

// Resolve __dirname for ESM and load .env next to this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);
console.log('✅ Supabase connected');

// Load FAQs (file located next to this server file)
const faqs = JSON.parse(fs.readFileSync(path.join(__dirname, "faqs.json"), "utf-8"));

// Hash map for faster lookup - O(1) instead of O(n)
const faqMap = new Map();
function initializeFaqMap(faqs) {
  for (const item of faqs) {
    const kw = String(item.keyword).toLowerCase().trim();
    faqMap.set(kw, item.answer);
  }
  console.log(`Loaded ${faqMap.size} FAQs into hash map`);
}

// Initialize the map on startup
initializeFaqMap(faqs);

// Simple FAQ matcher using hash map - O(1) lookup
function getFAQResponse(userInput) {
  if (!userInput) return null;
  const text = userInput.toLowerCase().trim();

  // Direct hash map lookup - O(1) complexity
  if (faqMap.has(text)) {
    const answer = faqMap.get(text);
    return { answer: answer, keyword: text };
  }

  return null;
}

async function callRagService(userMessage) {
  const ragResponse = await axios.post("http://localhost:5000/rag-chat",
    { message: userMessage });
  return ragResponse.data;
}

// Main AI route
app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  // Try FAQ first
  const faqResponse = getFAQResponse(userMessage);
  if (faqResponse) {
    console.log("FAQ match:", faqResponse.keyword);
    const sessionId = req.body.sessionId || 'default-session';
    const { data, error } = await supabase.from('conversations').insert({
      session_id: sessionId,
      user_message: userMessage,
      ai_response: faqResponse.answer,
      source: 'faq',
      keyword: faqResponse.keyword
    })
      .select()
      .single();
    if (error) console.error('Supabase insert error:', error);
    else console.log('Supabase insert success');
    return res.json({
      reply: faqResponse.answer,
      source: "faq",
      keyword: faqResponse.keyword
    });
  }

  try {
    const result = await callRagService(userMessage);

    const sessionId = req.body.sessionId || 'default-session';

    const { data, error } = await supabase.from('conversations').insert({
      session_id: sessionId,
      user_message: userMessage,
      ai_response: result.reply,
      source: 'ai'
    })
      .select()
      .single();

    if (error) console.error('Supabase insert error:', error);
    else console.log('Supabase insert success');

    res.json({
      reply: result.reply,
      source: "ai",
      conversationId: data?.id
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ reply: "AI service error." });
  }
});

app.post("/feedback", async (req, res) => {
  const { conversationId, isResolved, attemptsCount } = req.body;
  const { data, error } = await supabase.from('conversations').update({
    user_feedback: isResolved,
    attempts_count: attemptsCount
  }).eq('id', conversationId);

  if (error) {
    console.error('Supabase update error:', error);
    return res.status(500).json({ error: "Failed to record feedback" });
  }
  console.log('Supabase update success');
  res.json({ status: "success" });
});

// Get conversation history
app.get("/history/:sessionId", async (req, res) => {
  const { sessionId } = req.params;
  
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('❌ History error:', error);
    return res.status(500).json({ error: 'Failed to fetch history' });
  }
  
  console.log(`✅ Retrieved ${data.length} messages`);
  res.json(data);
});

// Serve FAQ suggestions for the frontend
app.get("/faqs", (req, res) => {
  try {
    // Return keyword + short answer; frontend can choose what to display
    const suggestions = faqs.map((f) => ({ keyword: f.keyword, answer: f.answer }));
    res.json(suggestions);
  } catch (err) {
    console.error("Failed to read faqs:", err);
    res.status(500).json({ error: "Failed to load faqs" });
  }
});

// Simulate connecting to a human agent (placeholder)
app.post("/connect-human", (req, res) => {
  try {
    // In a real system we'd enqueue the request, notify agents, or create a ticket.
    console.log("Request to connect to human agent received");
    res.json({ status: "queued", message: "A human agent will contact you shortly." });
  } catch (err) {
    console.error("Failed to enqueue human agent request:", err);
    res.status(500).json({ error: "Failed to connect to human agent" });
  }
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
