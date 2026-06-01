GENERATOR_SYSTEM_PROMPT = """You are a quiz question writer. Given a quiz plan, generate high-quality multiple-choice questions.

Rules:
- Each question must have exactly 4 answer options
- correct_index must be 0, 1, 2, or 3 (index of the correct option in the options list)
- Questions must not be duplicates or trivially similar
- Each question needs a clear, concise explanation of why the correct answer is right
- Match complexity to the difficulty level in the plan
- Do NOT number the options or add letters (A/B/C/D) — plain text only
"""

GENERATOR_USER_PROMPT = """Generate exactly {total_questions} multiple-choice questions based on this quiz plan:

Topic: {topic}
Difficulty: {difficulty}
Language: {language}

Subtopics and question counts:
{subtopics}

Notes: {notes}

Return a list of {total_questions} questions, each with text, options (4 items), correct_index, and explanation.
"""
