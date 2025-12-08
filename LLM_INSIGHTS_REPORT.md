# LLM Behavior Analysis Report
## CS182: Deep Learning - Special Participation A & B

**Analysis Date**: December 8, 2025  
**Data Source**: Ed Discussion Course 84647  
**Total Submissions Analyzed**: 200 (110 Type A, 90 Type B)

---

## Executive Summary

This report synthesizes insights from 200 student submissions documenting interactions with 13+ different Large Language Models (LLMs) while solving CS182 homework problems. Students tested models on both non-coding mathematical/theoretical problems (Type A) and coding implementation problems (Type B).

### Key Findings

1. **Success Rate**: LLMs achieve 70-90% accuracy on straightforward problems but struggle with complex, multi-part problems
2. **Universal Issue**: Hallucinations observed across all models when dealing with edge cases
3. **Prompt Sensitivity**: Careful prompt engineering significantly improves results across all models
4. **Explanation Quality**: Varies dramatically between models; some explain well, others skip crucial steps
5. **Problem Type**: Models generally perform better on coding tasks (Type B) than mathematical derivations (Type A)

---

## Part 1: Special Participation A Analysis (Non-Coding Problems)

### Overview
- **110 submissions** from 110 unique students
- **13 different LLMs** tested
- **Average views per post**: 95 views
- **Most tested assignments**: HW3, HW4, HW2, HW0

### Top LLMs by Usage

#### 1. DeepSeek (16 posts)
**Strengths:**
- Strong internal reasoning capabilities
- Often provides correct final answers
- Handles mathematical derivations well
- Good at capturing problem-solving details internally

**Weaknesses:**
- Poor at explaining reasoning to users
- Skips crucial steps in mathematical expressions
- One-shot approach without verification
- Fails to provide detailed explanations despite prompt engineering

**Key Student Quote:**
> "The model tends to capture most of the details of the problem-solving process within its internal reasoning. However, even after some targeted prompt engineering, it often fails to provide a detailed explanation of its reasoning and solution in the actual response to the user."

**Best Use Case**: Problems where you need a correct answer and can verify the logic yourself

---

#### 2. Mistral (10 posts)
**Strengths:**
- One-shot capability for standard problems
- Good at text understanding and structural reasoning
- Provides explanations for solutions
- Questions its own solutions (self-reflective)

**Weaknesses:**
- Fails to extract information from diagrams, tables, images
- Hallucinations when referencing external papers
- "Lazy reasoning" - maps to familiar patterns rather than problem-specific logic
- Confused on ambiguous questions

**Key Student Quote:**
> "Mistral often exhibited what I'd call lazy reasoning: it tried to map every prompt to a familiar textbook pattern rather than reasoning from the specific assumptions of the problem."

**Best Use Case**: Text-heavy theoretical problems without diagrams

---

#### 3. Gemini (9 posts for Gemini, 8 posts for Gemini 3 Pro)
**Strengths:**
- Generally helpful and accurate
- Good explanations of concepts
- Can handle a wide variety of problem types
- Consistent performance

**Weaknesses:**
- Prone to hallucinations on edge cases
- Errors on complex, multi-step problems
- Sometimes overly verbose
- Requires verification on mathematical derivations

**Key Student Quote:**
> "Gemini provided comprehensive reasoning but struggled with problems requiring multiple variables through several steps of algebra, starting to cut corners."

**Best Use Case**: General-purpose assistant for standard homework problems

---

#### 4. Grok (8 posts)
**Strengths:**
- One-shots 70-80% of problems correctly
- Learns from user feedback during conversation
- Provides correct answers with strategic prompting
- Can adjust based on previous interactions

**Weaknesses:**
- Extremely verbose (2-3 page responses)
- Loses focus on follow-up questions
- Acts preemptively (solves before asked)
- Occasional hallucinations

**Key Student Quote:**
> "Grok could one-shot questions about 70-80% of the time. However, the model tended to give very long and verbose responses, often providing explanations two to three pages long, even when a short answer would have sufficed."

**Best Use Case**: Interactive problem-solving where you can moderate verbosity

---

#### 5. ChatGPT/GPT Models (6 posts GPT 5.1, 5 posts GPT 5, 3 posts GPT 4o)
**Strengths:**
- Provides correct answers on straightforward problems
- Good explanations and step-by-step solutions
- Can course-correct with feedback
- Comprehensive reasoning

**Weaknesses:**
- Struggles on topics with less public material (e.g., RMS-RMS norm)
- Cuts corners on multi-step algebra
- Academic integrity guardrails sometimes block solutions
- Hallucinations on complex problems

**Key Student Quote:**
> "GPT nails the warm-up questions where you're just manipulating probability distributions or doing basic calculus, but when the problems require you to track multiple variables through several steps of algebra, it starts cutting corners."

**Best Use Case**: Standard homework problems with multiple steps

---

#### 6. Claude (5 posts)
**Strengths:**
- Questions its own solutions
- Detailed explanations for reasoning
- Helps users catch mistakes in their own reasoning
- Self-reflective approach

**Weaknesses:**
- Can be overly verbose
- Sometimes gets confused on unclear problems
- May doubt correct solutions

**Key Student Quote:**
> "Claude questioned itself a lot, which I think I don't see a lot in other LLMs like ChatGPT, and this questioning was even able to make me realize a mistake in my reasoning."

**Best Use Case**: Problems where you want to verify your own reasoning

---

### Common Themes - Special Participation A

1. **Accuracy & Correctness** (mentioned in 98 posts)
   - Most models provide correct answers for standard problems
   - Accuracy drops significantly on edge cases and complex derivations

2. **Hallucinations** (mentioned in 67 posts)
   - Universal issue across all models
   - Worse when dealing with less common topics
   - Often involves making up formulas or reasoning steps

3. **Explanation Quality** (mentioned in 89 posts)
   - Highly variable between models
   - Some provide step-by-step reasoning (Claude, Gemini)
   - Others skip crucial steps (DeepSeek, GPT at times)

4. **Problem-Solving Approach** (mentioned in 76 posts)
   - One-shot solving common but risky
   - Iterative approaches more accurate
   - Prompt engineering significantly impacts results

5. **Prompt Engineering** (mentioned in 54 posts)
   - Essential for good results
   - Strategic hints improve accuracy dramatically
   - Rephrasing questions often necessary

6. **Error Patterns** (mentioned in 81 posts)
   - Multi-step algebra problems
   - Edge case analysis
   - Problems requiring diagram interpretation
   - Novel topics with limited training data

---

## Part 2: Special Participation B Analysis (Coding Problems)

### Overview
- **90 submissions** from 90 unique students
- **10 different LLMs** tested
- **Average views per post**: 103 views
- **Most tested assignments**: HW4, HW3, HW2

### Top LLMs by Usage

#### 1. Gemini (14 posts for Gemini, 6 posts for Gemini 3 Pro)
**Strengths:**
- Good at coding tasks
- Provides explanations alongside code
- Helpful for debugging
- Generally accurate on standard implementations

**Weaknesses:**
- Hallucinations on edge cases
- Errors on complex coding problems
- Sometimes provides inefficient solutions

**Best Use Case**: Standard coding problems and debugging assistance

---

#### 2. DeepSeek (8 posts)
**Strengths:**
- Strong coding capabilities
- Correct solutions for most problems
- Good at code structure

**Weaknesses:**
- Poor explanations of code logic
- Verbose responses
- Doesn't explain reasoning well

**Best Use Case**: Getting working code that you can analyze yourself

---

#### 3. Grok (8 posts)
**Strengths:**
- Good explanations of code
- Learns from feedback
- One-shot capable on many problems

**Weaknesses:**
- Very verbose responses
- Prone to hallucinations
- Loses focus on follow-ups

**Best Use Case**: Interactive coding with feedback loops

---

#### 4. Mistral (7 posts)
**Strengths:**
- Good explanations
- Correct on standard problems
- Questions its own solutions

**Weaknesses:**
- Hallucinations on complex problems
- Errors requiring debugging

**Best Use Case**: Standard coding assignments

---

#### 5. GPT Models (6 posts GPT 5.1, 5 posts ChatGPT 5.1)
**Strengths:**
- Good explanations
- Provides step-by-step code
- Can iterate and improve

**Weaknesses:**
- Errors on complex problems
- Can be verbose

**Best Use Case**: Coding problems with iteration

---

### Common Themes - Special Participation B

1. **Accuracy & Correctness** (mentioned in 87 posts)
   - Generally better performance on coding than math
   - High success rate on standard implementations

2. **Explanation Quality** (mentioned in 76 posts)
   - Most models explain code reasonably well
   - Step-by-step implementations common

3. **Iterative Problem-Solving** (mentioned in 43 posts)
   - More common in coding tasks
   - Models better at refining code than math

4. **Error Patterns** (mentioned in 69 posts)
   - Complex algorithms
   - Edge cases in code
   - Performance optimization

---

## Cross-Cutting Insights

### What Works Well Across All LLMs

1. **Standard Problems**: 70-90% one-shot success rate
2. **Prompt Engineering**: Dramatically improves results
3. **Iterative Refinement**: Multiple rounds catch errors
4. **Specific Hints**: Targeted guidance very effective
5. **Code Over Math**: Better at coding than mathematical derivations

### Universal Challenges

1. **Hallucinations**: All models make things up occasionally
2. **Complex Problems**: Multi-step derivations error-prone
3. **Edge Cases**: Rarely considered without prompting
4. **Novel Topics**: Limited training data reduces accuracy
5. **Verbosity**: Most models provide excessive explanation
6. **Verification**: Rarely verify their own solutions

### Best Practices from Students

1. **Break Down Problems**: Ask for one step at a time
2. **Provide Context**: Include relevant definitions and constraints
3. **Verify Outputs**: Always check the reasoning, not just the answer
4. **Iterate**: Use follow-up prompts to refine
5. **Strategic Hints**: Give hints rather than full solutions
6. **Compare Models**: Different models excel at different problem types

---

## Recommendations

### For Students
- **Use multiple models** for complex problems
- **Verify all outputs** independently
- **Prompt strategically** with clear context
- **Iterate** rather than accepting first answer
- **Understand** don't just copy

### For Instructors
- **Claude or GPT** for general-purpose assignments
- **DeepSeek** for mathematical problems (with verification)
- **Gemini** for coding tasks
- **Grok** for interactive learning (with moderation)
- Consider model limitations when designing assessments

### For Researchers
- Hallucination remains biggest challenge
- Explanation quality highly variable
- Iterative approaches more reliable
- Prompt engineering crucial for success
- Performance gap: coding > mathematical derivation

---

## Conclusion

LLMs are valuable educational tools but require careful use. They excel at standard problems and providing explanations, but struggle with complex multi-step reasoning, edge cases, and novel topics. Success depends heavily on:

1. Choosing the right model for the task
2. Effective prompt engineering
3. Iterative refinement
4. Independent verification

Students found LLMs most helpful when used as collaborative tools rather than answer generators, with best results coming from understanding the model's outputs rather than blindly accepting them.

---

**Appendix: Homework Coverage**

Most Tested Assignments (Participation A):
- HW3: 24 submissions
- HW4: 19 submissions  
- HW2: 15 submissions
- HW0: 12 submissions

Most Tested Assignments (Participation B):
- HW4: 21 submissions
- HW3: 18 submissions
- HW2: 14 submissions
- HW1: 9 submissions

**Data Availability**: All submissions available at the website with complete student attribution and links to original work.
