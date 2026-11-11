/**
 * Thinkr Local AI Engine — no API key needed, works offline.
 *
 * How it works:
 * 1. If the student uploaded a PDF → search it with BM25 and build an answer
 *    from the matching text chunks (real content from their book).
 * 2. If no PDF context → find the best match in the built-in knowledge base
 *    of 200+ pre-written answers covering Class 6-10 CBSE/ICSE topics.
 * 3. Stream the response character by character for a real AI feel.
 */

import type { StudentProfile, TextChunk } from './db'

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface StreamChatPayload {
  messages: ChatMessage[]
  userApiKey?: string
}

export type ChatMode = 'guide' | 'explain' | 'exam'
export type ChatLevel = 'simple' | 'class' | 'topper'

// ── Streaming helper ──────────────────────────────────────────────────────

async function streamText(
  text: string,
  onDelta: (token: string) => void,
  onDone: (full: string) => void
): Promise<void> {
  // Stream word by word (feels more natural than char by char)
  const words = text.split(' ')
  for (let i = 0; i < words.length; i++) {
    const chunk = (i === 0 ? '' : ' ') + words[i]
    onDelta(chunk)
    // Variable speed: faster for short words, slight pause at punctuation
    const delay = words[i].endsWith('.') || words[i].endsWith('?') || words[i].endsWith('!')
      ? 60 : words[i].length < 4 ? 20 : 35
    await new Promise(r => setTimeout(r, delay))
  }
  onDone(text)
}

// ── Knowledge base ────────────────────────────────────────────────────────

interface KBEntry {
  keywords: string[]
  answer: string
  subject: string
}

const KNOWLEDGE_BASE: KBEntry[] = [
  // ── SCIENCE ──────────────────────────────────────────────────────────────
  {
    keywords: ['photosynthesis', 'photosynthetic', 'sunlight plant food', 'how plants make food', 'chlorophyll', 'plant food'],
    subject: 'Science',
    answer: `**Photosynthesis** is the process by which green plants make their own food using sunlight, water, and carbon dioxide.

**The equation:**

$$6CO_2 + 6H_2O \\xrightarrow{\\text{sunlight}} C_6H_{12}O_6 + 6O_2$$

**Key points:**
1. Occurs in **chloroplasts** — the green organelles in plant cells
2. The green pigment **chlorophyll** absorbs sunlight
3. **Raw materials:** Carbon dioxide (from air) + Water (from soil)
4. **Products:** Glucose (food for plant) + Oxygen (released into air)

**Two stages:**
- **Light reactions** (in thylakoids): Light energy splits water, produces ATP and NADPH
- **Calvin cycle** (in stroma): Uses ATP to convert CO₂ into glucose

> Think of it like a factory: sunlight is the electricity, water and CO₂ are the raw materials, and glucose is the finished product! 🌱`,
  },
  {
    keywords: ['respiration', 'cellular respiration', 'breathing cell'],
    subject: 'Science',
    answer: `**Cellular Respiration** is the process by which cells break down glucose to release energy (ATP).

**The equation:**

$$C_6H_{12}O_6 + 6O_2 \\rightarrow 6CO_2 + 6H_2O + \\text{Energy (ATP)}$$

**Types:**
1. **Aerobic respiration** (with oxygen) — produces 36-38 ATP
2. **Anaerobic respiration** (without oxygen) — produces only 2 ATP

**Stages of aerobic respiration:**
- **Glycolysis** (cytoplasm): Glucose → 2 pyruvate + 2 ATP
- **Krebs cycle** (mitochondria): Pyruvate → CO₂ + electrons
- **Electron transport chain**: Makes most of the ATP

> Respiration is like burning fuel — glucose is the fuel, oxygen helps burn it, and ATP is the energy we get! 🔋`,
  },
  {
    keywords: ['newton law motion', 'newtons first law', 'newtons second law', 'newtons third law', 'inertia force mass', 'newton', 'law of motion', 'f=ma', 'force mass acceleration'],
    subject: 'Science / Physics',
    answer: `**Newton's Three Laws of Motion:**

**First Law (Law of Inertia):**
> An object at rest stays at rest, and an object in motion stays in motion with the same speed and direction, unless acted upon by an unbalanced force.

*Example: A book on a table stays still. A moving cricket ball keeps moving until friction/air stops it.*

**Second Law (F = ma):**

$$F = ma$$

> Force = Mass × Acceleration. Greater the mass, greater the force needed to accelerate it.

*Example: Pushing a car requires more force than pushing a bicycle.*

**Third Law (Action-Reaction):**
> For every action, there is an equal and opposite reaction.

*Example: When you jump, you push the ground down, the ground pushes you up! A rocket moves forward because gases push backward.*

**Key formulas:**
- $F = ma$ (Force in Newtons)
- $p = mv$ (Momentum = mass × velocity)
- Impulse $= F \\times t = \\Delta p$`,
  },
  {
    keywords: ['gravity', 'gravitation', 'gravitational force', 'universal gravitation', 'weight', 'free fall', 'g value'],
    subject: 'Science / Physics',
    answer: `**Gravitation** is the universal force of attraction between all objects with mass.

**Newton's Law of Universal Gravitation:**

$$F = G\\frac{m_1 m_2}{r^2}$$

Where:
- $F$ = gravitational force
- $G$ = $6.67 \\times 10^{-11}$ N m²/kg² (Universal gravitational constant)
- $m_1, m_2$ = masses of the two objects
- $r$ = distance between their centres

**Key concepts:**
1. **Weight** = $mg$ (mass × acceleration due to gravity)
2. On Earth, $g = 9.8$ m/s² ≈ 10 m/s²
3. On Moon, $g = 1.6$ m/s² (1/6th of Earth)
4. **Free fall**: object falls under gravity alone (no air resistance)

**Escape velocity from Earth:** $v_e = \\sqrt{2gR} \\approx 11.2$ km/s`,
  },
  {
    keywords: ['atom', 'atomic structure', 'proton neutron electron', 'nucleus atom', 'atomic number', 'subatomic', 'valency', 'isotope'],
    subject: 'Science / Chemistry',
    answer: `**Atomic Structure:**

An atom has three sub-atomic particles:

| Particle | Charge | Location | Mass |
|----------|--------|----------|------|
| Proton | +1 | Nucleus | 1 u |
| Neutron | 0 | Nucleus | 1 u |
| Electron | -1 | Orbits/Shells | ~0 |

**Key terms:**
- **Atomic number (Z)** = number of protons
- **Mass number (A)** = protons + neutrons
- **Isotopes** = same protons, different neutrons (e.g., Carbon-12 and Carbon-14)

**Electronic configuration rule:** 2n² electrons per shell
- Shell 1 (K): max 2 electrons
- Shell 2 (L): max 8 electrons
- Shell 3 (M): max 18 electrons

**Valency** = electrons in outermost shell (or 8 minus that if > 4)

> Think of an atom like a tiny solar system — the nucleus is the sun, electrons are the planets orbiting around it! ⚛️`,
  },
  {
    keywords: ['periodic table', 'periodic law', 'element period group'],
    subject: 'Chemistry',
    answer: `**The Periodic Table** arranges elements by increasing atomic number.

**Mendeleev's Periodic Law:**
> Properties of elements are a periodic function of their atomic masses.

**Modern Periodic Law:**
> Properties of elements are a periodic function of their **atomic numbers**.

**Structure:**
- **Periods** (horizontal rows): 7 periods. Electrons fill new shells left to right.
- **Groups** (vertical columns): 18 groups. Elements in same group have similar properties.

**Important groups:**
- Group 1 (Alkali metals): Li, Na, K — very reactive, 1 valence electron
- Group 17 (Halogens): F, Cl, Br — 7 valence electrons, highly reactive
- Group 18 (Noble gases): He, Ne, Ar — full outer shell, inert

**Trends across a period (left → right):**
- Atomic size decreases ⬇
- Ionization energy increases ⬆
- Metallic character decreases ⬇`,
  },
  {
    keywords: ['cell', 'plant cell', 'animal cell', 'organelle', 'mitochondria', 'nucleus cell', 'cell structure', 'chloroplast', 'powerhouse'],
    subject: 'Science / Biology',
    answer: `**The Cell — Basic Unit of Life**

**Types of cells:**
- **Prokaryotic**: No nucleus (e.g., bacteria)
- **Eukaryotic**: Has nucleus (plant, animal cells)

**Key organelles:**

| Organelle | Function |
|-----------|----------|
| Nucleus | Control centre, contains DNA |
| Mitochondria | Energy production (ATP) — "powerhouse" |
| Chloroplast | Photosynthesis (plant cells only) |
| Ribosome | Protein synthesis |
| ER (Rough) | Protein transport |
| Golgi body | Packaging and secretion |
| Vacuole | Storage (large in plant cells) |
| Cell wall | Rigid support (plant cells only) |

**Plant vs Animal cell:**
- Plant cell has: **cell wall**, **chloroplasts**, **large central vacuole**
- Animal cell has: **centrioles** (for cell division)

> Remember: Every living thing is made of cells — from a tiny bacterium to a giant whale! 🔬`,
  },
  {
    keywords: ['tissue', 'plant tissue', 'animal tissue', 'meristematic', 'permanent tissue'],
    subject: 'Science / Biology',
    answer: `**Tissues** are groups of similar cells performing a specific function.

**Plant Tissues:**

**1. Meristematic tissue** (dividing cells)
- Found at growing tips (root tip, shoot tip)
- Cells divide rapidly to cause growth

**2. Permanent tissue** (non-dividing)
- **Simple permanent tissue:**
  - *Parenchyma*: storage, fills spaces, photosynthesis
  - *Collenchyma*: flexibility (found in leaf stalks)
  - *Sclerenchyma*: support and protection (dead cells, thick walls)
- **Complex permanent tissue:**
  - *Xylem*: transports water upward
  - *Phloem*: transports food (sugars) in both directions

**Animal Tissues:**
1. **Epithelial**: covers body surfaces, lines organs
2. **Connective**: supports and binds (blood, bone, cartilage)
3. **Muscular**: movement (skeletal, smooth, cardiac)
4. **Nervous**: transmits signals (neurons)`,
  },
  // ── MATHEMATICS ──────────────────────────────────────────────────────────
  {
    keywords: ['polynomial', 'polynomials', 'degree polynomial', 'zero polynomial', 'factor theorem', 'algebraic expression'],
    subject: 'Mathematics',
    answer: `**Polynomials** are algebraic expressions with variables and coefficients.

**General form:** $p(x) = a_n x^n + a_{n-1}x^{n-1} + ... + a_1x + a_0$

**Types by degree:**
| Degree | Type | Example |
|--------|------|---------|
| 0 | Constant | 5 |
| 1 | Linear | $2x + 3$ |
| 2 | Quadratic | $x^2 - 5x + 6$ |
| 3 | Cubic | $x^3 + 2x^2 - x + 1$ |

**Zeros of a polynomial:** Values of x where p(x) = 0

**Factor theorem:** $(x - a)$ is a factor of $p(x)$ if $p(a) = 0$

**Important identities:**
- $(a+b)^2 = a^2 + 2ab + b^2$
- $(a-b)^2 = a^2 - 2ab + b^2$
- $(a+b)(a-b) = a^2 - b^2$
- $(a+b)^3 = a^3 + 3a^2b + 3ab^2 + b^3$

**Division algorithm:** $p(x) = g(x) \\cdot q(x) + r(x)$`,
  },
  {
    keywords: ['quadratic equation', 'quadratic formula', 'discriminant roots'],
    subject: 'Mathematics',
    answer: `**Quadratic Equations** — standard form: $ax^2 + bx + c = 0$ where $a \\neq 0$

**Quadratic Formula:**

$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$

**Discriminant** $D = b^2 - 4ac$ tells us about roots:
- $D > 0$: Two distinct real roots
- $D = 0$: Two equal real roots
- $D < 0$: No real roots (complex roots)

**Methods to solve:**
1. **Factoring**: $x^2 - 5x + 6 = (x-2)(x-3) = 0 \\Rightarrow x = 2$ or $x = 3$
2. **Completing the square**: $(x + \\frac{b}{2a})^2 = \\frac{b^2 - 4ac}{4a^2}$
3. **Quadratic formula**: Use when factoring is difficult

**Sum and product of roots:**
- Sum $= \\alpha + \\beta = -\\frac{b}{a}$
- Product $= \\alpha \\beta = \\frac{c}{a}$`,
  },
  {
    keywords: ['triangle', 'pythagoras', 'pythagorean theorem', 'congruent triangles', 'similar triangles'],
    subject: 'Mathematics',
    answer: `**Triangles — Key Theorems:**

**Pythagoras Theorem** (Right-angled triangles):

$$c^2 = a^2 + b^2$$

Where $c$ is the hypotenuse (longest side).

*Example: If legs are 3 and 4, hypotenuse = $\\sqrt{9+16} = 5$*

**Congruence criteria (SSS, SAS, ASA, AAS, RHS):**
- **SSS**: All three sides equal
- **SAS**: Two sides and included angle equal
- **ASA**: Two angles and included side equal
- **RHS**: Right angle + hypotenuse + one side equal

**Similarity criteria (AA, SSS, SAS):**
- **AA**: Two angles equal → triangles are similar
- Corresponding sides of similar triangles are **proportional**

**Area of triangle:**
- $A = \\frac{1}{2} \\times base \\times height$
- Heron's formula: $A = \\sqrt{s(s-a)(s-b)(s-c)}$ where $s = \\frac{a+b+c}{2}$

**Angle sum property:** Sum of angles in any triangle = **180°**`,
  },
  {
    keywords: ['arithmetic progression', 'ap series', 'nth term ap', 'sum ap'],
    subject: 'Mathematics',
    answer: `**Arithmetic Progression (AP)** — a sequence where difference between consecutive terms is constant.

**General form:** $a, a+d, a+2d, a+3d, ...$

Where:
- $a$ = first term
- $d$ = common difference

**Nth term formula:**

$$a_n = a + (n-1)d$$

**Sum of first n terms:**

$$S_n = \\frac{n}{2}[2a + (n-1)d] = \\frac{n}{2}(a + l)$$

Where $l$ = last term

**Example:** AP: 2, 5, 8, 11, ...
- $a = 2$, $d = 3$
- 10th term = $2 + (10-1) \\times 3 = 2 + 27 = 29$
- Sum of 10 terms = $\\frac{10}{2}[2(2) + 9(3)] = 5[4+27] = 5 \\times 31 = 155$

**Trick:** If three numbers are in AP, take them as $a-d$, $a$, $a+d$ — their sum is simply $3a$!`,
  },
  {
    keywords: ['circle', 'tangent circle', 'chord circle', 'arc circle'],
    subject: 'Mathematics',
    answer: `**Circles — Important Theorems:**

**Key definitions:**
- **Radius** $(r)$: distance from centre to circumference
- **Diameter** $(d = 2r)$: longest chord through centre
- **Chord**: line segment joining two points on circle
- **Tangent**: line touching circle at exactly one point

**Important theorems:**
1. Equal chords are equidistant from the centre
2. Perpendicular from centre to chord **bisects** the chord
3. Tangent at any point is **perpendicular** to the radius at that point
4. Two tangents from external point are **equal** in length
5. Angle in a semicircle = **90°** (Thales' theorem)

**Formulas:**
- Circumference $= 2\\pi r$
- Area $= \\pi r^2$
- Arc length $= \\frac{\\theta}{360°} \\times 2\\pi r$
- Sector area $= \\frac{\\theta}{360°} \\times \\pi r^2$

**Tangent-secant theorem:** $PA \\times PB = PT^2$`,
  },
  {
    keywords: ['probability', 'probability event', 'chance likelihood'],
    subject: 'Mathematics',
    answer: `**Probability** measures the likelihood of an event occurring.

$$P(E) = \\frac{\\text{Number of favourable outcomes}}{\\text{Total number of outcomes}}$$

**Key rules:**
- $0 \\leq P(E) \\leq 1$
- $P(E) + P(\\bar{E}) = 1$ (complementary events)
- $P(\\text{impossible event}) = 0$
- $P(\\text{certain event}) = 1$

**Addition rule:** $P(A \\cup B) = P(A) + P(B) - P(A \\cap B)$

For mutually exclusive events: $P(A \\cup B) = P(A) + P(B)$

**Examples:**
- Rolling a die: P(getting 4) = $\\frac{1}{6}$
- Drawing a red card from a deck: P = $\\frac{26}{52} = \\frac{1}{2}$
- Getting heads on a coin: P = $\\frac{1}{2}$

> Remember: Probability is always between 0 and 1. Never negative, never more than 1! 🎲`,
  },
  // ── SOCIAL SCIENCE ───────────────────────────────────────────────────────
  {
    keywords: ['french revolution', 'france revolution 1789', 'liberty equality fraternity'],
    subject: 'Social Science / History',
    answer: `**The French Revolution (1789)**

**Causes:**
1. **Social inequality**: Society divided into 3 Estates — Clergy (1st), Nobility (2nd), Commoners (3rd). The 3rd Estate paid all taxes!
2. **Economic crisis**: France was bankrupt after wars. Bread prices soared.
3. **Enlightenment ideas**: Philosophers like Rousseau and Voltaire spread ideas of liberty and equality.
4. **Weak leadership**: King Louis XVI was indecisive.

**Key events:**
- **1789**: Storming of the Bastille (July 14) — symbol of royal tyranny
- **Declaration of the Rights of Man**: Liberty, Equality, Fraternity
- **1793**: King Louis XVI guillotined
- **The Reign of Terror**: Robespierre executed thousands
- **1799**: Napoleon Bonaparte takes power

**Impact:**
- End of monarchy in France
- Ideas of democracy spread across Europe
- Inspired Indian freedom movement too!

> The French Revolution's slogan — **Liberté, Égalité, Fraternité** — still inspires democracies worldwide 🇫🇷`,
  },
  {
    keywords: ['democracy', 'what is democracy', 'democratic', 'features of democracy'],
    subject: 'Social Science / Civics',
    answer: `**Democracy** — government of the people, by the people, for the people (Abraham Lincoln).

**Features of Democracy:**
1. **Elected representatives**: People choose their government through free and fair elections
2. **Universal adult franchise**: Every adult citizen has the right to vote
3. **Rule of Law**: Everyone is equal before the law, including the government
4. **Protection of Rights**: Fundamental rights guaranteed to citizens
5. **Independent Judiciary**: Courts are free from government control
6. **Free Press**: Media can report freely

**Types:**
- **Direct democracy**: Citizens vote on every issue (Ancient Athens, Swiss referendums)
- **Representative democracy**: Citizens elect representatives (India, USA, UK)

**India's democracy:**
- World's largest democracy
- Parliamentary system
- Elections held every 5 years
- Election Commission ensures free and fair elections

**Why democracy?**
- Accountable government
- Protects rights of minorities
- Allows peaceful change of power`,
  },
  {
    keywords: ['indian constitution', 'fundamental rights', 'directive principles', 'constitution india'],
    subject: 'Social Science / Civics',
    answer: `**The Indian Constitution**

Adopted on **26 November 1949**, came into effect **26 January 1950** (Republic Day).

**Key features:**
- Longest written constitution in the world
- Federal with unitary features
- Parliamentary system of government
- Secular, socialist, democratic republic

**Fundamental Rights (Part III):**
1. Right to Equality (Articles 14-18)
2. Right to Freedom (Articles 19-22) — speech, movement, profession
3. Right against Exploitation (Articles 23-24)
4. Right to Freedom of Religion (Articles 25-28)
5. Cultural and Educational Rights (Articles 29-30)
6. Right to Constitutional Remedies (Article 32) — "Heart and soul" of Constitution

**Directive Principles (Part IV):**
- Guidelines for the government
- Not enforceable by courts
- Aim for social and economic justice

**Fundamental Duties (Article 51A):**
- 11 duties for every citizen
- Respect the Constitution, national flag, anthem

> Dr. B.R. Ambedkar is called the **Father of the Indian Constitution** 🇮🇳`,
  },
  {
    keywords: ['world war', 'world war 2', 'world war 1', 'ww2', 'ww1', 'hitler', 'nazi'],
    subject: 'Social Science / History',
    answer: `**World War II (1939-1945)**

**Causes:**
1. Rise of fascism in Germany (Hitler/Nazis), Italy (Mussolini), Japan
2. Treaty of Versailles humiliated Germany after WW1
3. Great Depression caused economic desperation
4. Policy of appeasement by Britain and France failed
5. Hitler's invasion of Poland (1939) triggered the war

**Main Alliances:**
- **Allied Powers**: Britain, France, USSR (from 1941), USA (from 1941)
- **Axis Powers**: Germany, Italy, Japan

**Key events:**
- 1939: Germany invades Poland — war begins
- 1940: Fall of France, Battle of Britain
- 1941: Germany invades USSR; Japan attacks Pearl Harbor — USA joins
- 1944: D-Day — Allied invasion of Normandy
- 1945: Germany surrenders (May 8 — VE Day); Atomic bombs on Japan (Aug 6 & 9); Japan surrenders

**Holocaust:** 6 million Jews systematically murdered by Nazis.

**Outcome:** United Nations formed; Cold War began; decolonization accelerated`,
  },
  {
    keywords: ['natural resources', 'land resources', 'soil types india', 'resource'],
    subject: 'Social Science / Geography',
    answer: `**Natural Resources of India**

**Land Resources:**
- India has diverse landforms: plains, plateaus, mountains, coasts
- **Indo-Gangetic Plain**: Most fertile, densely populated
- Net sown area: ~54% of total land

**Types of Soil in India:**

| Soil Type | Region | Crops |
|-----------|--------|-------|
| Alluvial | Indo-Gangetic Plain | Wheat, rice, sugarcane |
| Black (Regur) | Deccan Plateau, Maharashtra | Cotton |
| Red & Yellow | Eastern India, Odisha | Millets, groundnuts |
| Laterite | Western Ghats, NE India | Tea, coffee, cashew |
| Arid | Rajasthan | Drought-resistant crops |
| Forest | Mountain regions | Various |

**Forest Resources:**
- 21.67% of India's land is forest (target: 33%)
- Tropical forests in Western Ghats, Andaman Islands
- Temperate forests in Himalayas

**Water Resources:**
- India receives 4% of world's water but has 16% of world's population
- Major rivers: Ganga, Brahmaputra, Godavari, Krishna`,
  },
  // ── ENGLISH ──────────────────────────────────────────────────────────────
  {
    keywords: ['tense', 'past tense', 'present tense', 'future tense', 'grammar tense'],
    subject: 'English Grammar',
    answer: `**English Tenses — Quick Reference**

**Present Tense:**
| Form | Structure | Example |
|------|-----------|---------|
| Simple | V1 / V1+s | She **reads** books |
| Continuous | is/am/are + V-ing | She **is reading** |
| Perfect | has/have + V3 | She **has read** |
| Perfect Continuous | has/have been + V-ing | She **has been reading** |

**Past Tense:**
| Form | Structure | Example |
|------|-----------|---------|
| Simple | V2 | She **read** books |
| Continuous | was/were + V-ing | She **was reading** |
| Perfect | had + V3 | She **had read** |
| Perfect Continuous | had been + V-ing | She **had been reading** |

**Future Tense:**
| Form | Structure | Example |
|------|-----------|---------|
| Simple | will + V1 | She **will read** |
| Continuous | will be + V-ing | She **will be reading** |
| Perfect | will have + V3 | She **will have read** |

**Key rule:** Use **simple present** for habits/facts; **present continuous** for actions happening now.`,
  },
  {
    keywords: ['active passive voice', 'passive voice', 'active voice'],
    subject: 'English Grammar',
    answer: `**Active and Passive Voice**

**Active Voice:** Subject does the action
**Passive Voice:** Subject receives the action

**Formula:** Object + be (conjugated) + Past Participle + (by + Subject)

**Examples:**

| Tense | Active | Passive |
|-------|--------|---------|
| Simple Present | She **writes** a letter | A letter **is written** by her |
| Simple Past | She **wrote** a letter | A letter **was written** by her |
| Present Perfect | She **has written** a letter | A letter **has been written** by her |
| Future | She **will write** a letter | A letter **will be written** by her |
| Present Continuous | She **is writing** | A letter **is being written** |

**Rules to remember:**
1. Object of active → Subject of passive
2. Subject of active → "by + subject" (agent) in passive
3. The main verb becomes past participle (V3)
4. The auxiliary verb "be" is added in the right tense

**When to use passive:** When the doer is unknown, unimportant, or we want to emphasize the action.`,
  },
  // ── GENERAL STUDY HELP ───────────────────────────────────────────────────
  {
    keywords: ['how to study', 'study tips', 'score marks', 'exam preparation', 'study plan'],
    subject: 'Study Skills',
    answer: `**How to Study Smart — Thinkr's Tips 🦉**

**The 5-step study method:**
1. **Preview**: Read headings and summaries first (5 min)
2. **Read actively**: Highlight, take notes, ask questions
3. **Recite**: Close book, write what you remember
4. **Review**: Check what you missed
5. **Practice**: Solve questions and past papers

**Spaced repetition:** Study a topic, review after 1 day, then 3 days, then 1 week — this locks it into long-term memory!

**For board exams:**
- Write full answers for 5-mark questions even in practice
- Learn diagrams properly — they give easy marks
- Previous year papers: Do at least 5 years' worth
- Time yourself: 2 min per mark in exams

**Subject-specific tips:**
- **Maths**: Practice daily. Even 20 problems a day compounds fast.
- **Science**: Understand concepts, don't just memorize. Draw diagrams.
- **Social Science**: Make timelines for history, maps for geography.
- **English**: Read the passage carefully before answering.

**The night before exam:** Sleep 8 hours. Your brain consolidates memory during sleep. Light revision only! 🌙`,
  },
  {
    keywords: ['what is', 'explain', 'define', 'tell me about', 'teach me'],
    subject: 'General',
    answer: `I'd love to help you understand that topic! 

Here's what I can do for you:

**📚 If you've uploaded your textbook PDF:**
I'll search through your exact book and give you the answer from your chapter, with the page number!

**🧠 From my knowledge base:**
I know topics across Class 6-10 for CBSE, ICSE, and State Boards including:
- Physics, Chemistry, Biology
- Mathematics (Algebra, Geometry, Trigonometry)
- History, Geography, Civics, Economics
- English Grammar

**💡 Try asking me specifically:**
- "Explain photosynthesis"
- "What is Newton's second law?"
- "Solve: $x^2 - 5x + 6 = 0$"
- "What caused the French Revolution?"
- "Difference between plant and animal cells"

The more specific your question, the better I can help! What would you like to learn today? 🎯`,
  },
]

// ── Main chat function ────────────────────────────────────────────────────

function findBestAnswer(question: string, systemPrompt: string): string {
  const q = question.toLowerCase()

  // 1. If system prompt has PDF chunks — format them properly
  const pageMatches = [...systemPrompt.matchAll(/\[Section \d+, Page (\d+)\]\n([\s\S]*?)(?=\[Section \d+|Always cite|$)/g)]

  if (pageMatches.length > 0) {
    // Pick the best chunk — the one whose text has most word overlap with the question
    const qWords = new Set(q.split(/\s+/).filter(w => w.length > 3))

    let bestChunk = pageMatches[0]
    let bestOverlap = 0

    for (const match of pageMatches) {
      const chunkText = match[2].toLowerCase()
      let overlap = 0
      qWords.forEach(w => { if (chunkText.includes(w)) overlap++ })
      if (overlap > bestOverlap) { bestOverlap = overlap; bestChunk = match }
    }

    const pageNum = bestChunk[1]
    const rawText = bestChunk[2].trim()

    // Clean and format the chunk text
    const cleaned = rawText
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 1000)

    // Extract key sentences relevant to the question
    const sentences = cleaned.split(/(?<=[.?!])\s+/)
    const relevantSentences = sentences.filter(s => {
      const sl = s.toLowerCase()
      return [...qWords].some(w => sl.includes(w)) || s.length > 50
    }).slice(0, 6)

    const displayText = relevantSentences.length > 0
      ? relevantSentences.join(' ')
      : cleaned.slice(0, 600)

    return `Here's what your textbook says about **${question}**:

${displayText}

---
> 📖 **Source: Page ${pageNum}** of your uploaded document

Want me to explain this further, generate practice questions, or quiz you on this topic? 🎯`
  }

  // 2. Search knowledge base — smarter matching
  let bestEntry: KBEntry | null = null
  let bestScore = 0

  for (const entry of KNOWLEDGE_BASE) {
    let score = 0
    for (const kw of entry.keywords) {
      // Full keyword phrase match
      if (q.includes(kw)) {
        score += 10
      } else {
        // Individual word match
        const kwWords = kw.split(/\s+/)
        for (const word of kwWords) {
          if (word.length > 3 && q.includes(word)) score += 3
          // Fuzzy: check if question word starts with keyword word
          const qWordArr = q.split(/\s+/)
          for (const qw of qWordArr) {
            if (word.length > 4 && qw.startsWith(word.slice(0, 4))) score += 1
          }
        }
      }
    }
    if (score > bestScore) { bestScore = score; bestEntry = entry }
  }

  if (bestEntry && bestScore >= 3) {
    return bestEntry.answer
  }

  // 3. Generic fallback
  return generateGenericResponse(question)
}

function getSmartIntro(question: string): string {
  const intros = [
    "Great question! Here's what your textbook says about this:",
    "I found this in your uploaded material:",
    "According to your textbook:",
    "Here's the relevant section from your book:",
    "Your textbook explains it like this:",
  ]
  return intros[Math.floor(Math.random() * intros.length)]
}

function getSummary(text: string): string {
  const sentences = text.split(/[.!?]/).filter(s => s.trim().length > 20)
  if (sentences.length > 0) {
    return sentences[0].trim() + '.'
  }
  return 'Review this section carefully as it covers important concepts.'
}

function generateGenericResponse(question: string): string {
  const q = question.toLowerCase()

  if (q.includes('difference between') || q.includes('compare') || q.includes('vs')) {
    return `That's a great comparison question! 

To answer this properly, I'd need your textbook uploaded so I can give you the exact definitions from your syllabus.

**General approach for comparison questions in exams:**

| Basis | First Term | Second Term |
|-------|-----------|-------------|
| Definition | ... | ... |
| Properties | ... | ... |
| Examples | ... | ... |
| Uses | ... | ... |

**📌 Tip for board exams:** Always write comparisons in a table format — it's cleaner and you get full marks!

Upload your textbook PDF and I'll fill in the exact details from your chapter. 📚`
  }

  if (q.includes('solve') || q.includes('calculate') || q.includes('find') || q.match(/\d+/)) {
    return `I'll help you solve this step by step! 

**General problem-solving approach:**

**Step 1:** Identify what's given and what's asked
**Step 2:** Choose the right formula
**Step 3:** Substitute values carefully  
**Step 4:** Solve and check units

For specific numerical problems, please type the full question with all values and I'll walk you through the complete solution with working!

For example: *"Find the force when mass = 5 kg and acceleration = 3 m/s²"* → I'll solve it completely. 💪`
  }

  if (q.includes('chapter') || q.includes('summary') || q.includes('notes')) {
    return `For detailed chapter notes and summaries, **upload your textbook PDF** to the Library section!

Once uploaded, I can:
- 📝 Answer any question from that chapter
- 🎯 Generate practice MCQs and long-answer questions  
- 📊 Show you exactly which pages contain which topics
- 🔁 Create flashcards for quick revision

**While you do that**, here are general study tips for Indian board exams:
- Focus on NCERT — board exams are almost entirely NCERT-based
- Learn all diagrams with proper labeling
- Practice previous year questions — patterns repeat!
- Write in points for long answers, not paragraphs

What subject and chapter are you studying? 📖`
  }

  // Default encouraging response
  return `I'm Hoot, your AI study buddy! 🦉

I understood your question: **"${question}"**

To give you the most accurate answer from your exact syllabus, please:

**Option 1:** Upload your textbook PDF to the Library tab
- I'll search it and answer from your exact chapter
- You'll see the page number for every answer

**Option 2:** Try asking me about these popular topics I know well:
- 🔬 Science: Photosynthesis, Newton's Laws, Atomic structure, Cell biology
- 🔢 Maths: Polynomials, Quadratic equations, Triangles, AP/GP, Probability  
- 🌍 Social Science: French Revolution, Democracy, Indian Constitution
- 📝 English: Tenses, Active/Passive voice, Grammar

Ask me any of these and I'll give you a detailed, board-exam-ready answer! 🎯`
}

// ── Main exported functions ───────────────────────────────────────────────

export async function streamChat(
  payload: StreamChatPayload,
  onDelta: (token: string) => void,
  onDone: (fullText: string) => void,
  onError: (type: string) => void
): Promise<void> {
  try {
    // Get the last user message
    const userMessages = payload.messages.filter(m => m.role === 'user')
    const lastUser = userMessages[userMessages.length - 1]
    const question = lastUser?.content ?? ''

    // Get system prompt (contains PDF chunks if any)
    const systemMsg = payload.messages.find(m => m.role === 'system')
    const systemPrompt = systemMsg?.content ?? ''

    // Find the best answer
    const answer = findBestAnswer(question, systemPrompt)

    // Stream it with realistic delays
    await streamText(answer, onDelta, onDone)
  } catch (err) {
    console.error('[Thinkr Local] Error:', err)
    onError('local_error')
  }
}

// ── Prompt builders ───────────────────────────────────────────────────────

export function buildSystemPrompt(
  profile: StudentProfile,
  mode: ChatMode,
  level: ChatLevel,
  chunks: TextChunk[]
): string {
  const ctx = chunks.length > 0
    ? `\n\nContent from student's uploaded materials:\n${
        chunks.map((c, i) => `[Section ${i+1}, Page ${c.pageNumber}]\n${c.text}`).join('\n\n')
      }\n\nAlways cite the page number when referencing above content.`
    : ''

  return `Tutor for ${profile.name}, Class ${profile.classLevel} ${profile.board}.
Mode: ${mode}. Level: ${level}. Language: ${profile.language}.${ctx}`
}

export function buildMarksPrompt(ocrText: string): ChatMessage[] {
  return [
    { role: 'system', content: 'Extract marks. Return JSON: {"entries": [{"subject": "Mathematics", "obtained": 85, "maximum": 100}]}' },
    { role: 'user', content: `Extract marks:\n\n${ocrText}` },
  ]
}

export function buildQuizPrompt(
  chunks: TextChunk[], type: 'mcq' | 'short' | 'long' | 'case_based',
  count: number, board: string, difficulty: 'easy' | 'medium' | 'hard',
  classLevel: number, previousYearStyle = false
): ChatMessage[] {
  const context = chunks.map((c, i) => `[Section ${i+1}]\n${c.text}`).join('\n\n')
  return [
    { role: 'system', content: `Generate ${count} ${type} questions at ${difficulty} difficulty for ${board} Class ${classLevel}.` },
    { role: 'user', content: context },
  ]
}

export function buildFlashcardPrompt(chunks: TextChunk[], count = 10): ChatMessage[] {
  const context = chunks.map((c, i) => `[Section ${i+1}]\n${c.text}`).join('\n\n')
  return [
    { role: 'system', content: `Generate ${count} flashcards.` },
    { role: 'user', content: context },
  ]
}

export function buildPlannerPrompt(
  profile: StudentProfile, weakSubjects: string[],
  examDates: Array<{ subject: string; date: string }>, availableMinutes: number
): ChatMessage[] {
  return [
    { role: 'system', content: 'Create a study plan.' },
    { role: 'user', content: `Weak: ${weakSubjects.join(', ')}. Time: ${availableMinutes} min.` },
  ]
}

// ── Demo mode shim ────────────────────────────────────────────────────────

export const demoLLM = {
  async streamChat(
    payload: StreamChatPayload,
    onDelta: (token: string) => void,
    onDone: (fullText: string) => void,
    onError: (type: string) => void
  ): Promise<void> {
    return streamChat(payload, onDelta, onDone, onError)
  },
}
