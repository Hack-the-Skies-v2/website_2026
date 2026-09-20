import { answersByQuestion } from "@/lib/grading/questions";
import type { ApplicationType } from "@/lib/grading/types";
import type { OrganizerApplication } from "@/components/OrganizerDashboard";
import type { ReviewApplication } from "@/components/OrganizerReviewClient";

type MockSeed = {
  id: string;
  type: ApplicationType;
  status: OrganizerApplication["status"];
  first_name: string;
  last_name: string;
  email: string;
  school_or_organization: string;
  answers: string[];
  submitted_at: string;
  average_score: number | null;
  grader_count: number;
  my_score: number | null;
  notification_sent_at: string | null;
  notification_error: string | null;
};

const SEEDS: MockSeed[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    type: "hacker",
    status: "pending",
    first_name: "Ava",
    last_name: "Chen",
    email: "ava.chen@example.com",
    school_or_organization: "Waterloo Collegiate Institute",
    submitted_at: "2026-03-12T18:22:00.000Z",
    average_score: null,
    grader_count: 0,
    my_score: null,
    notification_sent_at: null,
    notification_error: null,
    answers: [
      "I built a bus tracker for my school route because the transit app never showed the two buses that actually matter. It scrapes the schedule overnight, stores it locally, and shows one number: minutes until I have to leave the house. My little brother uses it more than I do now.",
      "I want to spend a weekend with people who care about shipping messy first versions. Hack the Skies feels like the place where I can try something ambitious without waiting for a class assignment.",
      "I want to get better at turning a vague idea into a working demo, and I hope I can help teammates who are newer to web stuff. I am also excited to meet mentors who build things for real users.",
    ],
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    type: "hacker",
    status: "pending",
    first_name: "Jordan",
    last_name: "Patel",
    email: "jordan.patel@example.com",
    school_or_organization: "Cameron Heights",
    submitted_at: "2026-03-14T09:05:00.000Z",
    average_score: 7.8,
    grader_count: 2,
    my_score: 8.0,
    notification_sent_at: null,
    notification_error: null,
    answers: [
      "Last year I repaired three pairs of headphones for people in my class after teaching myself to solder. Not a flashy project, but I liked that the fix was invisible once it worked.",
      "I applied because I want a weekend where I can focus on one project end to end, and Hack the Skies seems student-run in a way that feels welcoming.",
      "I want to learn how teams decide what to cut when time runs out. I can contribute calm debugging energy when something breaks at 2am.",
    ],
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    type: "mentor",
    status: "pending",
    first_name: "Sam",
    last_name: "Okoye",
    email: "sam.okoye@example.com",
    school_or_organization: "University of Waterloo",
    submitted_at: "2026-03-10T15:40:00.000Z",
    average_score: null,
    grader_count: 0,
    my_score: null,
    notification_sent_at: null,
    notification_error: null,
    answers: [
      "I have mentored at two high-school hackathons and work on a small open-source CLI used by local clubs. I am strongest at helping beginners structure their first backend.",
      "I ask what they have already tried, then we reproduce the bug together. If they are stuck on scope, I help them define a weekend-sized MVP before touching code.",
      "I want to mentor at Hack the Skies because the organizers are students too. The energy is collaborative, and I like helping hackers ship something they are proud of by Sunday.",
    ],
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    type: "hacker",
    status: "rejected",
    first_name: "Riley",
    last_name: "Nguyen",
    email: "riley.nguyen@example.com",
    school_or_organization: "Eastwood Collegiate",
    submitted_at: "2026-03-08T11:10:00.000Z",
    average_score: 4.2,
    grader_count: 1,
    my_score: 4.2,
    notification_sent_at: "2026-03-16T09:00:00.000Z",
    notification_error: null,
    answers: [
      "I followed a few coding tutorials and made a personal homepage.",
      "I heard about Hack the Skies from a friend and thought it would be fun.",
      "I mostly want to see what a hackathon is like.",
    ],
  },
  {
    id: "55555555-5555-4555-8555-555555555555",
    type: "mentor",
    status: "accepted",
    first_name: "Morgan",
    last_name: "Singh",
    email: "morgan.singh@example.com",
    school_or_organization: "Wilfrid Laurier University",
    submitted_at: "2026-03-09T20:00:00.000Z",
    average_score: 8.5,
    grader_count: 1,
    my_score: 8.5,
    notification_sent_at: "2026-03-16T10:00:00.000Z",
    notification_error: null,
    answers: [
      "I lead a campus coding club and mentor first-years through their first group projects.",
      "I start with what they already understand, then suggest one next experiment instead of rewriting their work.",
      "I want to give high-school hackers the same patient feedback I wish I had at their age.",
    ],
  },
  {
    id: "66666666-6666-4666-8666-666666666666",
    type: "hacker",
    status: "pending",
    first_name: "Casey",
    last_name: "Brooks",
    email: "casey.brooks@example.com",
    school_or_organization: "Huron Heights",
    submitted_at: "2026-03-16T08:00:00.000Z",
    average_score: null,
    grader_count: 0,
    my_score: null,
    notification_sent_at: null,
    notification_error: null,
    answers: [
      "I made a plant-watering reminder that texts my roommate when the soil sensor is dry.",
      "I want a weekend of building with people who are as curious as I am.",
      "I hope to learn how to scope a project that can actually finish by Sunday demo.",
    ],
  },
  {
    id: "77777777-7777-4777-8777-777777777777",
    type: "hacker",
    status: "pending",
    first_name: "Mock",
    last_name: "Mock",
    email: "mock.mock@example.com",
    school_or_organization: "Mock High School",
    submitted_at: "2026-03-18T12:00:00.000Z",
    average_score: null,
    grader_count: 0,
    my_score: null,
    notification_sent_at: null,
    notification_error: null,
    answers: [
      "I want to learn how to ship a small ML demo that classifies bird calls from phone audio, and leave with something I can keep iterating on after the weekend.",
      "I built a chrome extension that highlights duplicate calendar events before I double-book myself. It is ugly but it saved me twice last month.",
      "I break the problem into the smallest failing test, write down what I already know, then ask one person for a second pair of eyes before rewriting everything.",
      "I usually end up as the glue person: wiring APIs, keeping the board honest, and making sure the demo story matches what we actually built.",
      "I would bring a calm debugging habit, share notes from workshops, and help first-time hackers get unstuck without taking over their project.",
    ],
  },
  {
    id: "88888888-8888-4888-8888-888888888888",
    type: "judge",
    status: "pending",
    first_name: "Alex",
    last_name: "Rivera",
    email: "alex.rivera@example.com",
    school_or_organization: "Northwind Labs · Staff Engineer",
    submitted_at: "2026-03-17T16:30:00.000Z",
    average_score: null,
    grader_count: 0,
    my_score: null,
    notification_sent_at: null,
    notification_error: null,
    answers: [
      "A strong project solves a real user problem, ships a working demo, and shows clear tradeoffs the team made under time pressure.",
      "I build developer tools at Northwind and previously mentored university hackathon teams on product scoping and demo polish.",
      "I judged a campus pitch night last year and a high-school science fair software category the year before.",
    ],
  },
];

export function getMockOrganizerApplications(): OrganizerApplication[] {
  return SEEDS.map((seed) => ({
    id: seed.id,
    type: seed.type,
    status: seed.status,
    first_name: seed.first_name,
    last_name: seed.last_name,
    email: seed.email,
    school_or_organization: seed.school_or_organization,
    details: null,
    answers: seed.answers,
    submitted_at: seed.submitted_at,
    notification_sent_at: seed.notification_sent_at,
    notification_error: seed.notification_error,
    average_score: seed.average_score,
    grader_count: seed.grader_count,
    my_score: seed.my_score,
  }));
}

export function getMockReviewApplication(id: string): ReviewApplication | null {
  const seed = SEEDS.find((entry) => entry.id === id);
  if (!seed) return null;
  return {
    id: seed.id,
    type: seed.type,
    status: seed.status,
    first_name: seed.first_name,
    last_name: seed.last_name,
    email: seed.email,
    school_or_organization: seed.school_or_organization,
    details: null,
    answers: answersByQuestion(seed.type, seed.answers),
    submitted_at: seed.submitted_at,
  };
}
