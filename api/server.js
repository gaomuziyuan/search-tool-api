require("dotenv").config();

const express = require("express");
const axios = require("axios");
const cors = require("cors");
const xml2js = require("xml2js");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(
  cors({ origin: ["https://gaomuziyuan.github.io", "http://localhost:3000"] })
);
app.use(express.json());

app.get("/api/search", async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: "Missing parameter" });
  }

  try {
    const response = await axios.get(`${process.env.BC_LAWS_API_URL}`, {
      params: {
        q: query,
        s: 0,
        e: 20,
        nFrag: 5,
        lFrag: 100,
      },
    });

    const parser = new xml2js.Parser();
    parser.parseString(response.data, (err, parsedResponse) => {
      if (err) {
        return res.status(500).json({ error: "Failed to parse XML" });
      }
      res.json(parsedResponse);
    });
  } catch (error) {
    res.status(500).json({ error: "Error fetching data" });
  }
});

app.post("/api/generate", async (req, res) => {
  const { formattedContent } = req.body;
  const openaiUrl = process.env.OPENAI_API_URL;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  try {
    const response = await axios.post(
      openaiUrl,
      {
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that summarizes BC Laws content.",
          },
          {
            role: "user",
            content: `Please summarize the following content: ${formattedContent}`,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
          "Content-Type": "application/json",
        },
      }
    );
    const summarizedContent = response.data.choices[0].message.content;
    console.log(summarizedContent);
    res.json(summarizedContent);
  } catch (error) {
    console.error("Error summarizing document:", error);
    res.status(500).json({ error: "Failed to summarize document" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
