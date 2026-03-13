export const MOCK_COLLEGES = {
  "iit-bombay": {
    name: "Indian Institute of Technology, Bombay",
    slug: "iit-bombay",
    location: "Mumbai, Maharashtra",
    description:
      "IIT Bombay is one of India's premier engineering institutions, known for its vibrant campus life and 'Mood Indigo' festival.",
    logo: "/logos/iitb.png", // specific relative path (mock)
  },
  "bits-pilani": {
    name: "BITS Pilani",
    slug: "bits-pilani",
    location: "Pilani, Rajasthan",
    description:
      "Birla Institute of Technology and Science, Pilani is a private deemed university in Pilani, India.",
    logo: "/logos/bits.png",
  },
};

export async function getCollegeBySlug(slug: string) {
  // Simulate fetch
  await new Promise((resolve) => setTimeout(resolve, 50));
  return MOCK_COLLEGES[slug as keyof typeof MOCK_COLLEGES] || null;
}
