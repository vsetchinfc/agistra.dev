---
name: writing-core
description: "Shared foundation for all human-voice writing skills. Load before any profession-specific skill. Contains: burstiness principle, perplexity principle, soul injection techniques, community-discovered AI patterns with sources, additional core patterns, banned AI vocabulary, and scoring rubric."
argument-hint: "Load before job-seeker, consultant, or any other human-voice writing skill"
---

# Writing Core — Shared Foundation

Load this skill before any profession-specific writing skill (job-seeker, consultant, etc.). It defines the universal writing quality baseline all human-voice skills share.

---

## Burstiness Principle

AI detectors measure "burstiness": sentence length variance. Human writing has HIGH burstiness. AI has LOW.

Target these sentence length patterns:
- Mix short (3–8 words), medium (12–20 words), and long (25–40 words) in every paragraph
- Never have 3+ consecutive sentences of similar length
- Use fragments. They work. Really.
- One-word sentences? Occasionally.
- Let a sentence run long when the thought needs room to breathe, winding through qualifications before landing
- Vary paragraph length dramatically — four sentences, then one line. Like this.

---

## Perplexity Principle

AI detectors also measure "perplexity": how predictable each word is. AI text has LOW perplexity. Human text has HIGHER — more surprising word choices.

Increase perplexity naturally by:
- Choosing the second or third word that comes to mind, not the first (the most statistically likely, the one AI would pick)
- Using domain-specific jargon or slang appropriate to the audience
- Making unexpected analogies from personal experience
- Occasionally using informal transitions ("Anyway,", "So here's the thing:", "Look,", "Thing is,")

---

## Soul Injection Techniques

Removal alone does not produce human writing. These make the difference between "AI-clean" and "human":

1. **Have actual opinions.** Don't just report. React. "This approach is frustrating" is more human than "This approach has certain limitations."
2. **Acknowledge uncertainty honestly.** "I'm not sure this is right, but..." beats both false confidence and excessive hedging.
3. **Use specific sensory or experiential details.** Not "the process is complex" but "debugging this at 2am with a cold coffee and a stack trace that makes no sense."
4. **Reference shared human experiences.** "You know that feeling when..." creates connection.
5. **Allow tangents and asides.** A brief digression signals a thinking mind, not an algorithm.
6. **Vary paragraph length dramatically.** Four sentences, then one line. Like this.
7. **Use the imperfect start.** Begin mid-thought: "So I was looking at the numbers and..." or "Here's what nobody tells you about..."
8. **Break parallel structure occasionally.** Three items with the same grammar, then make the fourth different. Humans aren't that consistent.
9. **Use callbacks.** Reference something mentioned earlier. "Remember that point about X? It gets worse."
10. **Self-correct.** "The system handles auth — well, authentication and authorization are separate, but you get the idea." A small correction signals a mind thinking in real time. Use once per document maximum.
11. **End without wrapping up.** Not every piece needs a neat conclusion. Sometimes just stop.

---

## Community-Discovered Patterns (2026)

Surfaced from HackerNews, Substack, Wikipedia's editorial guidelines, and writing practitioner blogs. Sources cited inline.

**P38: Paragraph-Reshuffling Immunity.**
LLMs generate parallel blocks rather than an unfolding argument. Test: can you swap paragraph 2 and paragraph 4 without breaking the piece? If yes, it's AI. Fix: make paragraph N+1 depend on something concrete in paragraph N — references, callbacks, causal linkage. If two paragraphs are interchangeable, merge or cut one.
*Source: [HackerNews, May 2025](https://news.ycombinator.com/item?id=46646939)*

> **AI:** Remote work improves balance. Many workers prefer it. Studies show productivity rises. Additionally, commuting costs drop.
> **Human:** Remote work's flexibility is the obvious sell. The harder question is what you lose — the hallway conversation that turns into your best idea.

**P39: Paragraph-Closing "Whether" Summary Sentences.**
LLMs treat paragraph endings as local summaries, mimicking SEO blog structure where each section self-explains. Humans rarely end flowing prose this way. Fix: cut the closing "whether" sentence. End on the strongest specific point, not a hedge that gestures at the range covered.
*Source: [Gone Travelling Productions, Aug 2025](https://gonetravellingproductions.com/2025/08/20/ai-giveaways-in-writing/)*

> **AI:** Tokyo offers everything from Michelin-starred restaurants to humble ramen stalls. Whether you prefer fine dining or street food, Tokyo has something for every palate.
> **Human:** Tokyo's best ramen counter doesn't take reservations and hasn't changed the broth recipe since 1987.

**P40: Symbolic Gloss / Meaning-Telling.**
LLMs narrate the meaning of things rather than trusting description to carry it. Triggers: "represents", "symbolises", "speaks to", "embodies", "reflects broader" applied to mundane things. Fix: cut the symbol sentence. State the fact and let the reader interpret.
*Source: [Writewithai Substack, 2025](https://writewithai.substack.com/p/10-dead-giveaways-your-content-screams)*

> **AI:** The closed factory represents the decline of manufacturing and speaks to broader anxieties about post-industrial identity.
> **Human:** The factory closed in 2009. Three hundred jobs. The town's high school dropped football the following year.

**P41: Infomercial Engagement Hooks.**
Fake dramatic pauses imported from social-media-optimised AI writing. Triggers: single-sentence paragraphs that mimic viral LinkedIn cadence — "The catch?", "The kicker?", "Here's the thing:", "The brutal truth?", "Want to know the best part?" Fix: delete the hook line. Let the next paragraph make its point directly.
*Source: [Writewithai Substack](https://writewithai.substack.com/p/10-dead-giveaways-your-content-screams), corroborated on [HackerNews](https://news.ycombinator.com/item?id=46646939)*

> **AI:** Most people abandon goals in week three.\n\nThe brutal truth?\n\nThey lack a clear failure threshold.
> **Human:** Most people abandon goals in week three. The ones who don't usually make the failure threshold explicit before they start.

**P42: Erratic Inline Bolding.**
Patternless bolding — the model decided certain words felt important, with no consistent rule. Triggers: bold spans of 1–4 words appearing mid-paragraph, not labelling a defined term, multiple bold spans per paragraph with no shared category. Fix: strip all inline bold except glossary terms and UI labels. If something deserves emphasis, the sentence structure should provide it.
*Source: [Gone Travelling, 2025](https://gonetravellingproductions.com/2025/08/20/ai-giveaways-in-writing/), [Wikipedia: Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing)*

**P43: The Treadmill Effect (Low Information Density).**
A 500-word AI section may contain 100 words of new information and 400 words of restatement. Humans advance; AI circles. Triggers: marker phrases inside the paragraph — "In other words,", "Put simply,", "To put it another way,", "Essentially,". Fix: apply the "what's actually new here?" test on each sentence. Delete any that just rephrases what came before.
*Source: [aidetectors.io](https://www.aidetectors.io/blog/spotting-ai-writing-patterns), [HackerNews](https://news.ycombinator.com/item?id=46646939)*

---

## Additional Core Patterns

**P3: Superficial -ing Phrases.**
Tacking present participle phrases onto sentences to fake depth. Triggers: sentences ending with "...ensuring reliability.", "...fostering growth.", "...highlighting the importance of.", "...contributing to.", "...showcasing." Fix: delete the -ing clause. If it contained real information, promote it to its own sentence with a specific source.

> **AI:** The platform processes payments globally, ensuring reliability and fostering growth.
> **Human:** The platform processes payments in 47 countries. Uptime is 99.97% over the last 12 months.

**P24: Generic Positive Conclusions.**
Default closing sentences that say nothing. Triggers: "The future looks bright", "exciting times lie ahead", "continues its journey toward excellence", "a step in the right direction", "poised for growth", "we look forward to what comes next." Fix: cut the closing entirely, or end on the last specific fact.

---

## Banned AI Vocabulary

Single words that mark AI-generated writing — replace with plain language:

delve, leverage, robust, seamless, pivotal, nuanced, tapestry, realm, underscore, elevate, foster, navigate (metaphorical), landscape (metaphorical), synergy, cutting-edge, game-changer, impactful, utilize (use "use"), spearhead, orchestrate, bolster, crucial, garner, multifaceted, interplay, vibrant, showcase, testament

---

## Scoring Rubric

Score on five dimensions (0–10 each, 50 max). Revise if total < 35.

| Dimension | 0–4 | 5–7 | 8–10 |
|-----------|-----|-----|------|
| **Directness** | Long warm-up, buried claim | Main point findable | Claim in first sentence, no hedging |
| **Rhythm** | Uniform sentence length, monotone | Some variation | Deliberate mix, reads naturally aloud |
| **Trust** | Constant hedging and softening | Occasional hedging | States directly, no apology for existing |
| **Authenticity** | Generic, could be anyone | Some specific detail | Sounds like a specific person with a specific history |
| **Density** | Padded with filler | Some waste | Every sentence earns its place |

- 45–50: Ship it
- 35–44: Minor polish, acceptable
- 25–34: Rewrite before sending
- < 25: Start over
